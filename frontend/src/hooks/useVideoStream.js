import { useState, useCallback, useEffect } from 'react';

export const useVideoStream = (videoRef, stream, isConnected, onVideoReady) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isWaitingVideoLoaded, setIsWaitingVideoLoaded] = useState(false);

  // Инициализация видео ожидания
  const initializeWaitingVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 Initializing waiting video...');
    
    // Reset video element
    video.srcObject = null;
    video.src = '/Waiting.mp4';
    video.loop = true;
    video.muted = true;
    video.controls = false;
    
    // Add event listeners for debugging
    video.addEventListener('loadstart', () => console.log('📥 Video load started'));
    video.addEventListener('loadeddata', () => console.log('✅ Video data loaded'));
    video.addEventListener('canplay', () => console.log('🎯 Video can play'));
    video.addEventListener('error', (e) => {
      console.error('❌ Video error:', e, video.error);
    });
    
    // Load and play the video when it's ready
    video.muted = true;
    video.load();
    
    // Play when data is loaded
    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {
        console.log('🎬 Waiting video will play when ready');
      });
    }, { once: true });
    
    console.log('🎬 Waiting video initialized');
    setIsWaitingVideoLoaded(true);
    onVideoReady();
  }, [videoRef, onVideoReady]);

  // Обработка перехода к стриму
  const handleStreamTransition = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    console.log('🎬 Transitioning to live stream...');
    
    try {
      // Set new stream
      video.srcObject = stream;
      video.src = '';
      video.loop = false;
      
      // Wait for video to be ready
      const handleStreamReady = () => {
        console.log('✅ Stream is ready to play');
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
        console.log('✅ Successfully transitioned to live stream');
      } catch (playError) {
        console.warn('⚠️ Auto-play failed, but stream is ready:', playError);
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

  // Возврат к видео ожидания при отключении стрима
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if ((!stream || !isConnected) && isWaitingVideoLoaded) {
      console.log('🔄 Returning to waiting video');
      
      const transitionToWaiting = async () => {
        try {
          video.style.opacity = '0.5';
          await new Promise(resolve => setTimeout(resolve, 300));
          
          video.srcObject = null;
          video.src = '/Waiting.mp4';
          video.loop = true;
          video.muted = true;
          
          video.addEventListener('loadeddata', () => {
            video.play().catch(() => {
              console.log('🎬 Waiting video will play when ready');
            });
          }, { once: true });
          
          video.style.opacity = '1';
          console.log('✅ Returning to waiting video');
        } catch (error) {
          console.warn('⚠️ Error returning to waiting video:', error);
          video.style.opacity = '1';
        }
      };

      transitionToWaiting();
    }
  }, [stream, isConnected, isWaitingVideoLoaded, videoRef]);

  // Управление звуком на основе статуса стрима
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && isConnected) {
      const audioTracks = stream.getAudioTracks();
      console.log('🎵 Audio tracks in stream:', audioTracks.length);
      
      if (audioTracks.length > 0) {
        video.muted = false;
        setIsMuted(false);
        console.log('🔊 Unmuted video for active stream with audio');
      } else {
        console.log('⚠️ Stream has no audio tracks, keeping muted');
        video.muted = true;
        setIsMuted(true);
      }
    } else {
      video.muted = true;
      console.log('🔇 Muted video for waiting state');
    }
  }, [stream, isConnected, videoRef]);

  // Ручное переключение звука
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    
    console.log(`🔊 Manual ${newMutedState ? 'muted' : 'unmuted'} video`);
  }, [videoRef]);

  return {
    isMuted,
    toggleMute,
    initializeWaitingVideo,
    handleStreamTransition
  };
};
