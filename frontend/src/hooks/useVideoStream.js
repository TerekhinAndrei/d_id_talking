import { useState, useCallback, useEffect } from 'react';

export const useVideoStream = (videoRef, stream, isConnected, onVideoReady) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isWaitingVideoLoaded, setIsWaitingVideoLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testStreamActive, setTestStreamActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Инициализация видео ожидания (теперь только для заглушки)
  const initializeWaitingVideo = useCallback(() => {
    setIsWaitingVideoLoaded(true);
    setIsInitialized(true);
    onVideoReady();
  }, [onVideoReady, isInitialized]);

  // Обработка перехода к стриму
  const handleStreamTransition = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !stream) return;


    
    // Сброс состояния инициализации при переходе к стриму
    setIsInitialized(false);
    
    try {
      // Set new stream
      video.srcObject = stream;
      video.src = '';
      video.loop = false;
      

      
      // Wait for video to be ready
      const handleStreamReady = () => {

        if (onVideoReady) {
          onVideoReady();
        }
      };

      const handleStreamError = (error) => {
        console.error('❌ Video stream error:', error);
      };

      video.addEventListener('loadedmetadata', handleStreamReady);
      video.addEventListener('error', handleStreamError);
      
      // Try to play the stream
      try {
        await video.play();
      } catch (playError) {
        console.warn('⚠️ Auto-play failed, but stream is ready:', playError);
        
        // Try to play with user interaction
        const playWithUserInteraction = async () => {
          try {
            await video.play();
          } catch (e) {
            console.warn('⚠️ Still cannot play video:', e);
          }
        };
        
        // Add click listener to enable playback
        const handleClick = () => {
          playWithUserInteraction();
          document.removeEventListener('click', handleClick);
        };
        document.addEventListener('click', handleClick);
        
        handleStreamReady();
      }

      // Cleanup
      return () => {
        video.removeEventListener('loadedmetadata', handleStreamReady);
        video.removeEventListener('error', handleStreamError);
      };
    } catch (error) {
      console.error('❌ Error transitioning to stream:', error);
    }
  }, [videoRef, stream, onVideoReady]);

  // Возврат к видео ожидания при отключении стрима (теперь управляется CSS)
  useEffect(() => {
    if (!stream || !isConnected) {
      setIsInitialized(false);
    }
  }, [stream, isConnected]);

  // Управление звуком на основе статуса стрима
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && isConnected) {
      const audioTracks = stream.getAudioTracks();

      
      if (audioTracks.length > 0) {
        video.muted = false;
        setIsMuted(false);

      } else {
        video.muted = true;
        setIsMuted(true);
      }
    } else {
      video.muted = true;
    }
  }, [stream, isConnected, videoRef]);

  // Ручное переключение звука
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  }, [videoRef]);

  // Тестовые функции для переключения видеослоев
  const testShowWaiting = useCallback(() => {
    setTestMode(true);
    setTestStreamActive(false);
    setIsPlaying(false);
    
    // Принудительно перезагружаем видео
    const video = document.querySelector('.placeholder-video');
    if (video) {
      video.load();
      // Пытаемся воспроизвести с задержкой
      setTimeout(() => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          setIsPlaying(false);
        });
      }, 100);
    }
  }, []);

  const testShowStream = useCallback(() => {
    setTestMode(true);
    setTestStreamActive(true);
    setIsPlaying(false);
    
    // Принудительно перезагружаем видео
    const video = document.querySelector('.placeholder-video');
    if (video) {
      video.load();
      // Пытаемся воспроизвести с задержкой
      setTimeout(() => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          setIsPlaying(false);
        });
      }, 100);
    }
  }, []);

  // Определяем текущее состояние для отображения
  const shouldShowStream = testMode ? testStreamActive : (isConnected && stream);
  const shouldShowWaiting = testMode ? !testStreamActive : (!isConnected || !stream);

  return {
    isMuted,
    toggleMute,
    initializeWaitingVideo,
    handleStreamTransition,
    testShowStream,
    testShowWaiting,
    shouldShowStream,
    shouldShowWaiting,
    testMode,
    testStreamActive,
    isPlaying
  };
};
