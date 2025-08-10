import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

export const useMicrophoneToDidPipeline = (options = {}) => {
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
  const [error, setError] = useState(null);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  const isRecordingRef = useRef(false);
  
  // Буфер для фраз
  const audioBufferRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);

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

  // Загрузка аудио в Cloudinary и отправка в D-ID
  const sendAudioToDid = useCallback(async (audioData) => {
    try {
      console.log('🎤 Отправляем аудио в D-ID...');
      
      // Конвертируем Float32Array в WAV формат
      const wavData = convertFloat32ToWav(audioData, 48000);
      
      // Конвертируем base64 в Blob
      const binaryString = atob(wavData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      
      // Создаем FormData для загрузки
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio_chunk.wav');
      
      // Загружаем в Cloudinary
      console.log('☁️ Загружаем аудио в Cloudinary...');
      const uploadResponse = await apiService.uploadToCloudinary(formData);
      
      if (!uploadResponse.success) {
        throw new Error('Ошибка загрузки в Cloudinary');
      }
      
      const audioUrl = uploadResponse.data.url;
      console.log('✅ Аудио загружено в Cloudinary:', audioUrl);
      
      // Отправляем в D-ID Create Talk
      if (currentStreamId && currentSessionId) {
        console.log('🎬 Отправляем в D-ID Create Talk...');
        const didResponse = await apiService.createDIdTalkAudio(
          currentStreamId,
          currentSessionId,
          audioUrl,
          selectedVoiceRef.current || "en-US-JennyNeural"
        );
        
        if (didResponse.success) {
          console.log('✅ Аудио отправлено в D-ID успешно!');
          
          // Обновляем статистику
          setStreamStats(prev => ({
            ...prev,
            sentChunks: prev.sentChunks + 1,
            totalSentData: prev.totalSentData + wavData.length
          }));
          
          // Вызываем callback если есть
          if (options.onAudioSent) {
            options.onAudioSent(audioUrl, didResponse);
          }
        } else {
          throw new Error(`D-ID ошибка: ${didResponse.error}`);
        }
      } else {
        throw new Error('Stream ID или Session ID не установлены');
      }
      
    } catch (error) {
      console.error('❌ Ошибка отправки аудио в D-ID:', error);
      setError(error.message);
    }
  }, [currentStreamId, currentSessionId, convertFloat32ToWav, options]);

  // Детекция речи
  const detectSpeech = useCallback((audioData) => {
    // Простая детекция по громкости
    const volume = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    const threshold = 0.01; // Порог громкости
    
    return volume > threshold;
  }, []);

  // Отправка фразы в D-ID
  const sendPhraseToDid = useCallback(async (audioBuffer) => {
    if (audioBuffer.length === 0) return;

    try {
      // Объединяем все чанки в одну фразу
      const combinedAudio = audioBuffer.flat();
      
      console.log('🎤 Отправляем фразу в D-ID:', {
        chunks: audioBuffer.length,
        totalSamples: combinedAudio.length
      });
      
      await sendAudioToDid(combinedAudio);
      
    } catch (error) {
      console.error('❌ Ошибка отправки фразы в D-ID:', error);
      setError(error.message);
    }
  }, [sendAudioToDid]);

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
          sendPhraseToDid([...audioBufferRef.current]);
          audioBufferRef.current = [];
          isSpeakingRef.current = false;
        }
      }, 1000); // Отправляем через 1 секунду тишины
      
    } else if (isSpeakingRef.current) {
      // Тишина после речи - добавляем в буфер
      audioBufferRef.current.push(audioData);
    }
  }, [detectSpeech, sendPhraseToDid]);

  // Начало записи
  const startRecording = useCallback(async (voiceId, streamId, sessionId) => {
    try {
      setError(null);
      setIsProcessing(true);
      selectedVoiceRef.current = voiceId;
      setCurrentStreamId(streamId);
      setCurrentSessionId(sessionId);
      isRecordingRef.current = true;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Используем ScriptProcessor для надежности
      console.log('🔄 Создаю ScriptProcessor для D-ID пайплайна...');
      const processor = audioContextRef.current.createScriptProcessor(16384, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        if (isRecordingRef.current) {
          // Обрабатываем чанк с детекцией речи
          processAudioChunk(Array.from(inputData));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
      console.log('🎤 Запись для D-ID пайплайна начата');
      
    } catch (error) {
      console.error('❌ Ошибка начала записи для D-ID:', error);
      setError('Ошибка доступа к микрофону');
      setIsProcessing(false);
    }
  }, [processAudioChunk]);

  // Остановка записи
  const stopRecording = useCallback(() => {
    try {
      // Останавливаем поток
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Очищаем таймеры
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      // Отправляем оставшиеся данные
      if (audioBufferRef.current.length > 0) {
        sendPhraseToDid([...audioBufferRef.current]);
        audioBufferRef.current = [];
      }
      
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsProcessing(false);
      
      console.log('⏹️ Запись для D-ID пайплайна остановлена');
      
    } catch (error) {
      console.error('❌ Ошибка остановки записи для D-ID:', error);
    }
  }, [sendPhraseToDid]);

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
    error,
    currentStreamId,
    currentSessionId,
    startRecording,
    stopRecording
  };
};
