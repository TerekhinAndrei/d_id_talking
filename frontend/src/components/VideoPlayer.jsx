import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  stream, 
  isConnected, 
  connectionStatus,
  onVideoReady,
  className = "",
  isStreamActive = false
}) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [isWaitingVideoLoaded, setIsWaitingVideoLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showOverlay, setShowOverlay] = useState(false);

  // Status messages mapping
  const statusMessages = {
    'idle': '',
    'creating': 'Создание аватара...',
    'connecting': 'Подключение к D-ID...',
    'connected': 'Видеопоток запущен',
    'talking': 'Генерация речи...',
    'error': 'Ошибка подключения'
  };

  console.log('🎬 VideoPlayer props:', {
    hasStream: !!stream,
    isConnected,
    connectionStatus,
    isStreamActive
  });

  // Initialize waiting video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Only initialize waiting video if we don't have a stream
    if (stream || isConnected) return;

    const initializeWaitingVideo = () => {
      console.log('🎬 Initializing waiting video...');
      
      // Reset video element
      video.srcObject = null;
      video.src = '/Waiting.mp4'; // Vite serves public files from root
      video.loop = true;
      video.muted = true;
      video.controls = false;
      
      // Add event listeners for debugging
      video.addEventListener('loadstart', () => console.log('📥 Video load started'));
      video.addEventListener('loadeddata', () => console.log('✅ Video data loaded'));
      video.addEventListener('canplay', () => console.log('🎯 Video can play'));
      video.addEventListener('error', (e) => {
        console.error('❌ Video error:', e, video.error);
        setMessage('Не удалось загрузить видео ожидания');
        setMessageType('error');
        setShowOverlay(true);
      });
      
      // Load and play the video when it's ready
      video.muted = true;
      video.load();
      
      // Play when data is loaded
      video.addEventListener('loadeddata', () => {
        video.play().catch(() => {
          // Ignore play() errors - video will play when it can
          console.log('🎬 Waiting video will play when ready');
        });
      }, { once: true }); // Remove listener after first use
      
      console.log('🎬 Waiting video initialized');
      onVideoReady();
    };

    // Load waiting video on component mount
    if (!stream && !isConnected) {
      initializeWaitingVideo();
    }
  }, [stream, isConnected]);

  // Handle stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Only transition to stream if we have both stream and connection
    if (!stream || !isConnected) {
      console.log('🎬 Skipping stream transition - missing stream or connection:', {
        hasStream: !!stream,
        isConnected,
        streamType: stream ? typeof stream : 'null'
      });
      return;
    }

    console.log('🎬 Setting up video stream:', stream);
    console.log('🎬 Stream details:', {
      id: stream.id,
      active: stream.active,
      tracks: stream.getTracks().length,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length
    });
    setIsLoading(true);
    setVideoError(null);

    const handleStreamReady = () => {
      console.log('✅ Stream is ready to play');
      setIsLoading(false);
      if (onVideoReady) {
        onVideoReady();
      }
    };

    const handleStreamError = (error) => {
      console.error('❌ Video stream error:', error);
      setIsLoading(false);
      setVideoError('Ошибка воспроизведения видео');
    };

    // Simple transition to live stream
    const transitionToStream = async () => {
      try {
        console.log('🎬 Transitioning to live stream...');
        
        // Set new stream
        video.srcObject = stream;
        video.src = '';
        video.loop = false;
        // muted will be set by the useEffect above
        
        // Wait for video to be ready
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
      } catch (error) {
        console.error('❌ Error transitioning to stream:', error);
        handleStreamError(error);
      }
    };

    transitionToStream();

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleStreamReady);
      video.removeEventListener('error', handleStreamError);
    };
  }, [stream, onVideoReady]);

  // Handle going back to waiting video when stream disconnects
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Return to waiting video if no stream or not connected
    if ((!stream || !isConnected) && isWaitingVideoLoaded) {
      console.log('🔄 Returning to waiting video');
      
      // Smooth transition back to waiting video
      const transitionToWaiting = async () => {
        try {
          video.style.opacity = '0.5';
          await new Promise(resolve => setTimeout(resolve, 300));
          
          video.srcObject = null;
          video.src = '/Waiting.mp4'; // Vite serves public files from root
          video.loop = true;
          video.muted = true;
          
          // Play when data is loaded
          video.addEventListener('loadeddata', () => {
            video.play().catch(() => {
              // Ignore play() errors - video will play when it can
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
  }, [stream, isConnected, isWaitingVideoLoaded]);

  // Handle mute/unmute based on stream status
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && isConnected) {
      // Unmute when we have stream and connection
      video.muted = false;
      console.log('🔊 Unmuted video for active stream');
    } else {
      // Keep muted for waiting video
      video.muted = true;
      console.log('🔇 Muted video for waiting state');
    }
  }, [stream, isConnected]);

  // Removed handleVideoClick as user doesn't want click interaction

  const handleVideoError = useCallback((error) => {
    console.error('❌ Video element error:', error);
    setVideoError('Ошибка воспроизведения видео');
    setIsLoading(false);
  }, []);

  return (
    <div className={`video-player ${className}`}>
      {/* Status Messages */}
      {statusMessages[connectionStatus] && (
        <div className="status-message">
          <div className="status-content">
            {isLoading && <div className="loading-spinner" />}
            <span className="status-text">{statusMessages[connectionStatus]}</span>
          </div>
        </div>
      )}

      {/* Message Overlay */}
      {showOverlay && message && (
        <div className="message-overlay">
          <div className="message-content">
            <h3>{messageType === 'error' ? '⚠️ Ошибка' : 'ℹ️ Информация'}</h3>
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          onError={handleVideoError}
          playsInline
          controls={isConnected && stream}
        />
        
        {/* Video Overlay */}
        <div className="video-overlay">
          {videoError && (
            <div className="error-overlay">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{videoError}</span>
              </div>
            </div>
          )}
          
          {!stream && !isConnected && !videoError && (
            <div className="waiting-overlay">
              <div className="waiting-content">
                <span className="waiting-text">Ожидание сессии...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Controls Info */}
      <div className="video-info">
        <div className="video-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'waiting'}`}>
            {isConnected ? '🔴 В эфире' : '⏸️ Ожидание'}
          </span>
          {stream && (
            <span className="stream-info">
              Прямой эфир с D-ID
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
