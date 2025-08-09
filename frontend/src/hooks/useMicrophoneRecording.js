import { useState, useCallback, useRef, useEffect } from 'react';

export const useMicrophoneRecording = (options = {}) => {
  // Состояния
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamStats, setStreamStats] = useState({
    totalChunks: 0,
    sentChunks: 0,
    processedChunks: 0,
    totalBytes: 0,
    totalSentData: 0,
    processingTime: 0
  });
  const [audioChunks, setAudioChunks] = useState([]);
  const [processedChunks, setProcessedChunks] = useState([]);
  const [error, setError] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const websocketRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  const isRecordingRef = useRef(false);
  
  // Буфер для фраз
  const audioBufferRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/stream`;
      
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('✅ WebSocket соединение установлено');
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Получено WebSocket сообщение:', message);
          
          if (message.type === 'audio_data') {
            playAudioChunk(message.data);
          } else if (message.type === 'error') {
            console.error('❌ WebSocket ошибка:', message.message);
            setError(message.message);
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
      
      console.log('📤 Отправляем WebSocket сообщение:', message);
      websocketRef.current.send(JSON.stringify(message));
      console.log('📤 Аудио чанк отправлен через WebSocket');
      
      // Обновляем статистику
      setStreamStats(prev => ({
        ...prev,
        sentChunks: prev.sentChunks + 1,
        totalSentData: prev.totalSentData + wavData.length
      }));
      
      // Добавляем в историю отправленных чанков
      setAudioChunks(prev => [...prev, {
        id: Date.now(),
        counter: streamStats.sentChunks + 1,
        size: wavData.length,
        timestamp: new Date()
      }]);
      
      // Небольшая задержка между чанками
      setTimeout(() => {}, 100);
      
    } catch (error) {
      console.error('❌ Ошибка отправки аудио чанка:', error);
    }
  }, [streamStats.sentChunks, convertFloat32ToWav]);

  // Воспроизведение полученного аудио
  const playAudioChunk = useCallback(async (audioData) => {
    try {
      console.log('🎵 Получен аудио чанк через WebSocket');
      // Передаём наружу (например, в мост ElevenLabs -> D-ID)
      try {
        if (options && typeof options.onProcessedChunk === 'function') {
          options.onProcessedChunk(audioData);
        }
      } catch (_) {}
      
      // Конвертируем base64 в ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Используем Web Audio API для лучшего качества
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Декодируем аудио данные
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      
      // Создаем источник и воспроизводим
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      console.log('🎵 Аудио воспроизведено через Web Audio API');
      
      // Обновляем статистику
      setStreamStats(prev => ({
        ...prev,
        processedChunks: prev.processedChunks + 1
      }));
      
      // Добавляем в историю обработанных чанков
      setProcessedChunks(prev => [...prev, {
        id: Date.now(),
        counter: streamStats.processedChunks + 1,
        size: audioData.length,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('❌ Ошибка воспроизведения аудио чанка:', error);
    }
  }, [streamStats.processedChunks, options]);

  // Начало записи
  const startRecording = useCallback(async (voiceId) => {
    try {
      setError(null);
      setIsProcessing(true);
      selectedVoiceRef.current = voiceId;
      isRecordingRef.current = true;
      
      connectWebSocket();
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Используем ScriptProcessor для надежности
      console.log('🔄 Создаю ScriptProcessor...');
      const processor = audioContextRef.current.createScriptProcessor(16384, 1, 1); // Увеличиваем размер буфера
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          // Обрабатываем чанк с детекцией речи
          processAudioChunk(Array.from(inputData));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
      console.log('🎤 Запись начата с ScriptProcessor');
      
    } catch (error) {
      console.error('❌ Ошибка начала записи:', error);
      setError('Ошибка доступа к микрофону');
      setIsProcessing(false);
    }
  }, [connectWebSocket, sendAudioChunk]);

  // Остановка записи
  const stopRecording = useCallback(() => {
    try {
      // Останавливаем поток
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Закрываем WebSocket
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsProcessing(false);
      
      console.log('⏹️ Запись остановлена');
      
    } catch (error) {
      console.error('❌ Ошибка остановки записи:', error);
    }
  }, []);

  // Детекция речи
  const detectSpeech = useCallback((audioData) => {
    // Простая детекция по громкости
    const volume = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    const threshold = 0.01; // Порог громкости
    
    return volume > threshold;
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
      
      console.log('📤 Отправляем фразу:', {
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
        id: Date.now(),
        counter: streamStats.sentChunks + 1,
        size: wavData.length,
        type: 'phrase',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('❌ Ошибка отправки фразы:', error);
    }
  }, [streamStats.sentChunks, convertFloat32ToWav]);

  // Обработка аудио чанка с детекцией речи
  const processAudioChunk = useCallback((audioData) => {
    const hasSpeech = detectSpeech(audioData);
    
    if (hasSpeech) {
      // Есть речь - добавляем в буфер
      audioBufferRef.current.push(audioData);
      isSpeakingRef.current = true;
      
      // Сбрасываем таймер тишины
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      // Устанавливаем таймер для отправки фразы
      silenceTimerRef.current = setTimeout(() => {
        if (audioBufferRef.current.length > 0) {
          sendPhrase([...audioBufferRef.current]);
          audioBufferRef.current = [];
          isSpeakingRef.current = false;
        }
      }, 1000); // Отправляем через 1 секунду тишины
      
    } else if (isSpeakingRef.current) {
      // Тишина после речи - добавляем в буфер
      audioBufferRef.current.push(audioData);
    }
  }, [detectSpeech, sendPhrase]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isProcessing,
    streamStats,
    audioChunks,
    processedChunks,
    error,
    startRecording,
    stopRecording
  };
};