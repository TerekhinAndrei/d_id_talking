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

  useEffect(() => {
    const checkVideoStatus = () => {
      const videoElement = document.getElementById(videoElementId);
      
      if (!videoElement) {
        setIsStreamPlaying(false);
        return;
      }

      // Проверяем, что это именно D-ID стрим, а не placeholder видео
      const isDidStream = videoElement.srcObject && 
                         videoElement.srcObject.active && 
                         videoElement.srcObject.getVideoTracks().length > 0 &&
                         !videoElement.srcObject.getVideoTracks()[0].muted;

      // Проверяем, что видео воспроизводится
      const isPlaying = !videoElement.paused && 
                       !videoElement.ended && 
                       videoElement.readyState >= 2 && // HAVE_CURRENT_DATA
                       videoElement.currentTime > 0;

      // Проверяем, что видео не заглушка (не Waiting.mp4)
      const isNotPlaceholder = !videoElement.src || 
                              !videoElement.src.includes('Waiting.mp4');

      const streamStatus = isDidStream && isPlaying && isNotPlaceholder;
      
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
