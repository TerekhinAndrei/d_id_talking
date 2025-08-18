import { useState, useEffect, useRef } from 'react';

export const useVideoPlayback = (videoRef, stream) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInfo, setPlaybackInfo] = useState({
    readyState: 0,
    currentTime: 0,
    duration: 0,
    paused: true,
    hasStream: false
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef?.current;
    
    if (!videoElement || !stream) {
      setIsPlaying(false);
      return;
    }

    // Проверяем состояние видео каждые 500ms (реже для производительности)
    intervalRef.current = setInterval(() => {
      const info = {
        readyState: videoElement.readyState,
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
        paused: videoElement.paused,
        hasStream: !!videoElement.srcObject
      };

      // Определяем, проигрывается ли видео
      const playing = info.readyState >= 2 && // HAVE_CURRENT_DATA
                     info.currentTime > 0 && 
                     !info.paused &&
                     info.hasStream;

      setPlaybackInfo(info);
      setIsPlaying(playing);
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      }
    };
  }, [videoRef, stream]);

  return { isPlaying, playbackInfo };
};
