import { useState, useEffect, useCallback } from 'react';
import { dIdStreamingService, StreamingStatus, VideoStream } from '../services/streaming/DIdStreamingService';

export const useDIdStreaming = () => {
  const [status, setStatus] = useState<StreamingStatus>(dIdStreamingService.getStatus());
  const [videoStream, setVideoStream] = useState<VideoStream>(dIdStreamingService.getVideoStream());

  useEffect(() => {
    // Подписываемся на изменения статуса
    const unsubscribeStatus = dIdStreamingService.onStatusChange(setStatus);
    
    // Подписываемся на изменения видео потока
    const unsubscribeVideo = dIdStreamingService.onVideoStreamChange(setVideoStream);

    return () => {
      unsubscribeStatus();
      unsubscribeVideo();
    };
  }, []);

  // Создание стрима
  const createStream = useCallback(async (imageUrl: string, description?: string) => {
    console.log('🔍 useDIdStreaming.createStream called with:', { imageUrl, description });
    const result = await dIdStreamingService.createStream(imageUrl, description);
    console.log('🔍 useDIdStreaming.createStream result:', result);
    return result;
  }, []);

  // Запуск стрима
  const startStream = useCallback(async () => {
    return await dIdStreamingService.startStream();
  }, []);

  // Создание talk с текстом
  const createTalkWithText = useCallback(async (text: string, voiceId?: string) => {
    return await dIdStreamingService.createTalkWithText(text, voiceId);
  }, []);

  // Создание talk с аудио
  const createTalkWithAudio = useCallback(async (audioUrl: string, voiceId?: string) => {
    return await dIdStreamingService.createTalkWithAudio(audioUrl, voiceId);
  }, []);

  // Закрытие стрима
  const closeStream = useCallback(async () => {
    return await dIdStreamingService.closeStream();
  }, []);

  return {
    // Состояние
    status,
    videoStream,
    
    // Методы
    createStream,
    startStream,
    createTalkWithText,
    createTalkWithAudio,
    closeStream,
    
    // Удобные геттеры
    isConnected: status.isConnected,
    isCreating: status.step === 'creating',
    isStarting: status.step === 'starting',
    isConnected: status.step === 'connected',
    isTalking: status.step === 'talking',
    isClosing: status.step === 'closing',
    hasError: status.step === 'error',
    error: status.error
  };
};
