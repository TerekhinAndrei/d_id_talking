import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

export const useMicrophoneToCloudinary = (options = {}) => {
  // Состояния
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [streamStats, setStreamStats] = useState({
    totalChunks: 0,
    sentChunks: 0,
    processedChunks: 0,
    uploadedFiles: 0,
    totalBytes: 0,
    totalSentData: 0,
    processingTime: 0,
    speechDetected: 0,
    silenceDetected: 0
  });
  const [audioChunks, setAudioChunks] = useState([]);
  const [processedChunks, setProcessedChunks] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const websocketRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  const isRecordingRef = useRef(false);
  
  // 🎵 AudioWorklet refs
  const audioWorkletNodeRef = useRef(null);
  const audioWorkletLoadedRef = useRef(false);

  // 🎵 ОЧЕРЕДЬ ЗАГРУЗКИ В CLOUDINARY - НОВАЯ АРХИТЕКТУРА
  const uploadQueueRef = useRef([]);
  const isUploadingRef = useRef(false);

  // Обработчик очереди загрузки в Cloudinary
  const processUploadQueue = useCallback(async () => {
    if (isUploadingRef.current || uploadQueueRef.current.length === 0) {
      return;
    }

    isUploadingRef.current = true;
    
    while (uploadQueueRef.current.length > 0) {
      const audioData = uploadQueueRef.current.shift();
      
      try {
        console.log('☁️ Загружаем аудио в Cloudinary из очереди, осталось:', uploadQueueRef.current.length);
        
        // Конвертируем base64 в Blob
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        
        // Создаем файл с именем для загрузки
        const audioFile = new File([audioBlob], `processed_audio_${Date.now()}.mp3`, { type: 'audio/mp3' });
        
        // Загружаем через наш API
        const response = await apiService.uploadAudio(audioFile);
        
        if (response.success) {
          // Используем HTTPS URL вместо HTTP
          const cloudinaryUrl = response.data.secure_url || response.data.url;
          console.log('✅ Аудио загружено в Cloudinary:', cloudinaryUrl);
          
          // Добавляем в список загруженных файлов
          setUploadedFiles(prev => [...prev, {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: cloudinaryUrl,
            timestamp: new Date(),
            size: audioData.length
          }]);
          
          // Обновляем статистику
          setStreamStats(prev => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles + 1
          }));
          
          // Вызываем callback если предоставлен
          try {
            if (options && typeof options.onAudioUploaded === 'function') {
              options.onAudioUploaded(cloudinaryUrl);
            }
          } catch (error) {
            console.warn('Ошибка в onAudioUploaded callback:', error);
          }
          
          // Добавляем в историю обработанных чанков
          setProcessedChunks(prev => [...prev, {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            counter: streamStats.processedChunks + 1,
            originalSize: audioData.length,
            cloudinaryUrl: cloudinaryUrl,
            timestamp: new Date()
          }]);
          
        } else {
          throw new Error(response.message || 'Ошибка загрузки в Cloudinary');
        }
        
      } catch (error) {
        console.error('❌ Ошибка загрузки аудио в Cloudinary из очереди:', error);
        // Продолжаем с следующим элементом очереди
      }
    }
    
    isUploadingRef.current = false;
  }, [streamStats.processedChunks, options]);

  // Добавление аудио в очередь загрузки
  const addToUploadQueue = useCallback((audioData) => {
    uploadQueueRef.current.push(audioData);
    console.log('📥 Добавлен в очередь загрузки Cloudinary, размер очереди:', uploadQueueRef.current.length);
    
    // Запускаем обработку очереди, если она еще не запущена
    if (!isUploadingRef.current) {
      processUploadQueue();
    }
  }, [processUploadQueue]);

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//talking-head.onrender.com/ws/stream`;
      
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('✅ WebSocket соединение установлено для Cloudinary загрузки');
      };
      
      websocketRef.current.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Получено WebSocket сообщение для Cloudinary:', message);
          
          if (message.type === 'audio_data') {
            // ☁️ ИСПОЛЬЗУЕМ ОЧЕРЕДЬ ЗАГРУЗКИ ВМЕСТО ПРЯМОЙ ЗАГРУЗКИ
            addToUploadQueue(message.data);
          } else if (message.type === 'error') {
            console.error('❌ WebSocket ошибка:', message.message);
            
            // Проверяем на ошибку 429 (система занята)
            if (message.message && message.message.includes('429')) {
              console.warn('⚠️ ElevenLabs API перегружен (429). Это временная проблема.');
              setError('ElevenLabs API временно перегружен. Попробуйте позже.');
            } else {
              setError(message.message);
            }
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
        }
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        setError('Ошибка WebSocket соединения');
      };
      
      websocketRef.current.onclose = () => {
        console.log('🔌 WebSocket соединение закрыто');
      };
      
    } catch (error) {
      console.error('❌ Ошибка подключения к WebSocket:', error);
      setError('Ошибка подключения к WebSocket');
    }
  }, [addToUploadQueue]);

  // 🎵 Загрузка AudioWorklet
  const loadAudioWorklet = useCallback(async () => {
    if (audioWorkletLoadedRef.current) {
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Загружаем AudioWorklet модуль
      await audioContextRef.current.audioWorklet.addModule('/audio-recorder-worklet.js');
      audioWorkletLoadedRef.current = true;
      console.log('✅ AudioWorklet загружен успешно для Cloudinary');
      
    } catch (error) {
      console.error('❌ Ошибка загрузки AudioWorklet:', error);
      setError('Ошибка загрузки AudioWorklet');
      throw error;
    }
  }, []);

  // 🎵 Создание AudioWorklet узла
  const createAudioWorkletNode = useCallback(async (stream) => {
    try {
      // Создаем источник из медиа потока
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Создаем AudioWorklet узел
      audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-recorder-processor');
      
      // Обработчик сообщений от AudioWorklet
      audioWorkletNodeRef.current.port.onmessage = (event) => {
        const { type, data, hasSpeech } = event.data;
        
        switch (type) {
          case 'audio_data':
            // Обрабатываем аудио данные с детекцией речи
            // Логируем только при наличии речи
            if (hasSpeech) {
              console.log('🎵 Получены аудио данные с речью от AudioWorklet:', { 
                dataLength: data?.length,
                willSend: websocketRef.current?.readyState === WebSocket.OPEN
              });
            }
            processAudioChunk(data, hasSpeech);
            break;
            
          case 'send_phrase':
            // Отправляем фразу через WebSocket (только если есть речь)
            console.log('📤 Отправляем фразу через WebSocket для Cloudinary');
            sendPhrase([data]);
            break;
            
          case 'debug':
            // Отладочная информация - только важные события
            // Закомментировано для уменьшения количества логов
            /*
            if (data.event) {
              console.log(`🔍 AudioWorklet ${data.event}:`, {
                frame: data.frame,
                hasSpeech: data.hasSpeech,
                volume: data.volume.toFixed(6),
                bufferSize: data.bufferSize
              });
            }
            */
            break;
        }
      };
      
      // Подключаем узлы
      source.connect(audioWorkletNodeRef.current);
      audioWorkletNodeRef.current.connect(audioContextRef.current.destination);
      
      // Запускаем запись в AudioWorklet
      audioWorkletNodeRef.current.port.postMessage({
        type: 'start_recording'
      });
      
      console.log('🎵 AudioWorklet узел создан и запущен для Cloudinary');
      
    } catch (error) {
      console.error('❌ Ошибка создания AudioWorklet узла:', error);
      throw error;
    }
  }, []);

  // Конвертация Float32Array в WAV формат
  const convertFloat32ToWav = useCallback((float32Array, sampleRate) => {
    try {
      // Создаем WAV файл в памяти
      const wavBuffer = new ArrayBuffer(44 + float32Array.length * 2);
      const view = new DataView(wavBuffer);
      
      // WAV заголовок
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + float32Array.length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, float32Array.length * 2, true);
      
      // Конвертируем Float32 в Int16
      let offset = 44;
      for (let i = 0; i < float32Array.length; i++) {
        const sample = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
      
      // Конвертируем в base64
      const uint8Array = new Uint8Array(wavBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
      
    } catch (error) {
      console.error('❌ Ошибка конвертации в WAV:', error);
      return '';
    }
  }, []);

  // Отправка аудио чанка через WebSocket
  const sendAudioChunk = useCallback((audioData) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Конвертируем Float32Array в WAV формат
      const wavData = convertFloat32ToWav(audioData, 48000);
      
      const message = {
        type: "speech_to_speech",
        voice_id: selectedVoiceRef.current,
        sample_rate: 48000,
        audio_data: wavData, // WAV данные в base64
        data_length: wavData.length
      };
      
      console.log('📤 Отправляем WebSocket сообщение для Cloudinary:', message);
      websocketRef.current.send(JSON.stringify(message));
      console.log('📤 Аудио чанк отправлен через WebSocket для Cloudinary');
      
      // Обновляем статистику
      setStreamStats(prev => ({
        ...prev,
        sentChunks: prev.sentChunks + 1,
        totalSentData: prev.totalSentData + wavData.length
      }));
      
      // Добавляем в историю отправленных чанков
      setAudioChunks(prev => [...prev, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        counter: streamStats.sentChunks + 1,
        size: wavData.length,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('❌ Ошибка отправки аудио чанка:', error);
    }
  }, [streamStats.sentChunks, convertFloat32ToWav]);

  // Начало записи
  const startRecording = useCallback(async (voiceId) => {
    try {
      setError(null);
      setIsProcessing(true);
      selectedVoiceRef.current = voiceId;
      isRecordingRef.current = true;
      
      connectWebSocket();
      
      // 🎵 Загружаем AudioWorklet
      await loadAudioWorklet();
      
      // Получаем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 🎵 Создаем AudioWorklet узел
      await createAudioWorkletNode(stream);
      
      setIsRecording(true);
      console.log('🎤 Запись начата с AudioWorklet для Cloudinary загрузки');
      
    } catch (error) {
      console.error('❌ Ошибка начала записи:', error);
      setError('Ошибка доступа к микрофону');
      setIsProcessing(false);
    }
  }, [connectWebSocket, loadAudioWorklet, createAudioWorkletNode]);

  // Остановка записи
  const stopRecording = useCallback(() => {
    try {
      // 🎵 Останавливаем AudioWorklet
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.port.postMessage({
          type: 'stop_recording'
        });
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      
      // Останавливаем поток
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Закрываем WebSocket
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      
      // ☁️ Очищаем очередь загрузки
      uploadQueueRef.current = [];
      isUploadingRef.current = false;
      
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsProcessing(false);
      
      console.log('⏹️ Запись остановлена, AudioWorklet отключен, очередь Cloudinary очищена');
      
    } catch (error) {
      console.error('❌ Ошибка остановки записи:', error);
    }
  }, []);

  // Отправка фразы
  const sendPhrase = useCallback(async (audioBuffer) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Объединяем все чанки в одну фразу
      const combinedAudio = audioBuffer.flat();
      
      // Конвертируем в WAV
      const wavData = convertFloat32ToWav(combinedAudio, 48000);
      
      const message = {
        type: "speech_to_speech",
        voice_id: selectedVoiceRef.current,
        sample_rate: 48000,
        audio_data: wavData,
        data_length: wavData.length,
        is_phrase: true
      };
      
      console.log('📤 Отправляем фразу для Cloudinary:', {
        chunks: audioBuffer.length,
        totalSamples: combinedAudio.length,
        wavSize: wavData.length
      });
      
      websocketRef.current.send(JSON.stringify(message));
      
      // Обновляем статистику
      setStreamStats(prev => ({
        ...prev,
        sentChunks: prev.sentChunks + 1,
        totalSentData: prev.totalSentData + wavData.length
      }));
      
      // Добавляем в историю
      setAudioChunks(prev => [...prev, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        counter: streamStats.sentChunks + 1,
        size: wavData.length,
        type: 'phrase',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('❌ Ошибка отправки фразы:', error);
    }
  }, [streamStats.sentChunks, convertFloat32ToWav]);

  // 🎵 Обработка аудио чанка от AudioWorklet
  const processAudioChunk = useCallback((audioData, hasSpeech) => {
    // Обновляем статистику детекции речи
    setStreamStats(prev => ({
      ...prev,
      totalChunks: prev.totalChunks + 1,
      speechDetected: prev.speechDetected + (hasSpeech ? 1 : 0),
      silenceDetected: prev.silenceDetected + (hasSpeech ? 0 : 1)
    }));
    
    // Отправляем только если есть речь и WebSocket открыт
    if (hasSpeech && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      console.log('🎤 Отправляем аудио чанк с речью для Cloudinary');
      sendAudioChunk(audioData);
    }
    // Убираем логирование тишины - оно слишком частое
  }, [sendAudioChunk]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isProcessing,
    isUploading,
    streamStats,
    audioChunks,
    processedChunks,
    uploadedFiles,
    error,
    startRecording,
    stopRecording
  };
};
