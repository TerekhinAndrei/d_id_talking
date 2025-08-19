import { useState, useEffect, useRef } from 'react';

/**
 * Хук для определения статуса воспроизведения видеострима D-ID
 * @param {string} videoElementId - ID видеоэлемента
 * @returns {boolean} - true если видеострим воспроизводится, false в противном случае
 */
export const useVideoStreamStatus = (videoElementId = 'main-video-player') => {
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  const videoRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const lastTimeRef = useRef(0);
  const stuckFrameCountRef = useRef(0);

  useEffect(() => {
    const checkVideoStatus = () => {
      const videoElement = document.getElementById(videoElementId);
      
      if (!videoElement) {
        setIsStreamPlaying(false);
        return;
      }

      // Проверяем, что это именно D-ID стрим, а не placeholder видео
      const hasVideoTrack = videoElement.srcObject && 
                           videoElement.srcObject.active && 
                           videoElement.srcObject.getVideoTracks().length > 0 &&
                           !videoElement.srcObject.getVideoTracks()[0].muted;

      // Проверяем наличие и активность аудиотрека
      const hasActiveAudioTrack = videoElement.srcObject && 
                                 videoElement.srcObject.getAudioTracks().length > 0 &&
                                 videoElement.srcObject.getAudioTracks()[0].enabled &&
                                 !videoElement.srcObject.getAudioTracks()[0].muted;

      const isDidStream = hasVideoTrack;

      // Сбрасываем счетчики при изменении стрима
      if (!isDidStream) {
        lastTimeRef.current = 0;
        stuckFrameCountRef.current = 0;
      }

      // Проверяем, что видео воспроизводится
      const isPlaying = !videoElement.paused && 
                       !videoElement.ended && 
                       videoElement.readyState >= 2 && // HAVE_CURRENT_DATA
                       videoElement.currentTime > 0;

      // Проверяем, что видео не заглушка (не Waiting.mp4)
      const isNotPlaceholder = !videoElement.src || 
                              !videoElement.src.includes('Waiting.mp4');

      // Проверяем, что видео не зависло на последнем кадре
      const currentTime = videoElement.currentTime;
      
      // Проверяем, что видео не зависло на последнем кадре
      const timeChanged = Math.abs(currentTime - lastTimeRef.current) > 0.01; // Проверяем изменение времени
      
      if (timeChanged) {
        // Время изменилось - видео воспроизводится
        stuckFrameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      } else {
        // Время не изменилось - возможно зависло
        stuckFrameCountRef.current++;
      }
      
      // Считаем видео зависшим, если время не менялось более 2 секунд (4 проверки по 500мс)
      // В начальном состоянии даем небольшую отсрочку
      const isNotStuck = stuckFrameCountRef.current < 4 || lastTimeRef.current === 0;

      // Дополнительная проверка: если видео зависло, проверяем наличие активного аудио
      const hasAudioWhenStuck = stuckFrameCountRef.current >= 4 ? hasActiveAudioTrack : true;

      // Логирование для отладки (только при проблемах с аудио)
      if (stuckFrameCountRef.current >= 4 && !hasActiveAudioTrack) {
        console.log('🔇 Video stream stuck - no active audio track detected');
        if (videoElement.srcObject) {
          console.log('Audio tracks:', videoElement.srcObject.getAudioTracks().map(track => ({
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            kind: track.kind
          })));
        }
      }

      const streamStatus = isDidStream && isPlaying && isNotPlaceholder && isNotStuck && hasAudioWhenStuck;
      
      setIsStreamPlaying(streamStatus);
    };

    // Проверяем статус сразу
    checkVideoStatus();

    // Устанавливаем интервал для периодической проверки
    checkIntervalRef.current = setInterval(checkVideoStatus, 500);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [videoElementId]);

  return isStreamPlaying;
};
