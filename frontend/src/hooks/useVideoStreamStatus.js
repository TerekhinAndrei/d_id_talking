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
  const lastNetworkStateRef = useRef(null);
  const lastReadyStateRef = useRef(null);
  const consecutiveChecksRef = useRef(0);

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
        consecutiveChecksRef.current = 0;
        lastNetworkStateRef.current = null;
        lastReadyStateRef.current = null;
      }

      // Проверяем, что видео воспроизводится
      const isPlaying = !videoElement.paused && 
                       !videoElement.ended && 
                       videoElement.readyState >= 2 && // HAVE_CURRENT_DATA
                       videoElement.currentTime > 0;

      // Дополнительные проверки состояния сети и готовности
      const networkState = videoElement.networkState;
      const readyState = videoElement.readyState;
      
      // Проверяем, что сеть активна и данные загружаются
      const isNetworkActive = networkState === 1 || networkState === 2; // NETWORK_LOADING или NETWORK_IDLE
      
      // Проверяем, что видео готово к воспроизведению
      const isReady = readyState >= 2; // HAVE_CURRENT_DATA или выше
      
      // Проверяем изменения в состоянии сети/готовности
      const networkStateChanged = networkState !== lastNetworkStateRef.current;
      const readyStateChanged = readyState !== lastReadyStateRef.current;
      
      if (networkStateChanged || readyStateChanged) {
        consecutiveChecksRef.current = 0;
        lastNetworkStateRef.current = networkState;
        lastReadyStateRef.current = readyState;
      } else {
        consecutiveChecksRef.current++;
      }
      
      // Считаем видео неактивным, если состояние не меняется слишком долго
      const isStateDynamic = consecutiveChecksRef.current < 10; // 5 секунд без изменений

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
      
      // Считаем видео зависшим, если время не менялось более 1 секунды (5 проверок по 200мс)
      const isNotStuck = stuckFrameCountRef.current < 5;

      // Дополнительная проверка: если видео зависло, проверяем наличие активного аудио
      const hasAudioWhenStuck = stuckFrameCountRef.current >= 5 ? hasActiveAudioTrack : true;

      // Проверка WebRTC состояния
      const isWebRTCActive = videoElement.srcObject && 
                           videoElement.srcObject.active && 
                           videoElement.srcObject.getTracks().some(track => 
                             track.readyState === 'live' && track.enabled
                           );

      // Агрессивная проверка: если видео зависло, требуем активный WebRTC
      const isWebRTCValid = stuckFrameCountRef.current >= 5 ? isWebRTCActive : true;

      // Логирование отключено для чистоты консоли
      // if (stuckFrameCountRef.current >= 5) {
      //   console.log('🔍 Video stream analysis:', {
      //     timeChanged,
      //     stuckFrameCount: stuckFrameCountRef.current,
      //     hasActiveAudioTrack,
      //     isWebRTCActive,
      //     networkState,
      //     readyState,
      //     consecutiveChecks: consecutiveChecksRef.current,
      //     isStateDynamic
      //   });
      //   
      //   if (videoElement.srcObject) {
      //     console.log('WebRTC tracks:', videoElement.srcObject.getTracks().map(track => ({
      //       kind: track.kind,
      //       enabled: track.enabled,
      //       muted: track.muted,
      //       readyState: track.readyState
      //     })));
      //   }
      // }

      const streamStatus = isDidStream && 
                          isPlaying && 
                          isNotPlaceholder && 
                          isNotStuck && 
                          hasAudioWhenStuck && 
                          isWebRTCValid && 
                          isStateDynamic;
      
      setIsStreamPlaying(streamStatus);
    };

    // Проверяем статус сразу
    checkVideoStatus();

    // Устанавливаем интервал для периодической проверки
    checkIntervalRef.current = setInterval(checkVideoStatus, 200);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [videoElementId]);

  return isStreamPlaying;
};
