import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VideoPlayer.css';
import ImageUpload from './ImageUpload';
import VoiceSelector from './VoiceSelector';
import CreateStreamButton from './CreateStreamButton';

const VideoPlayer = ({ 
  stream, 
  isConnected, 
  connectionStatus,
  onVideoReady,
  className = "",
  isStreamActive = false,
  // Элементы управления
  selectedImage,
  previewUrl,
  onImageSelect,
  onImageRemove,
  onUploadSuccess,
  onUploadError,
  uploadError,
  selectedVoice,
  voices,
  loadingVoices,
  voicesError,
  isPlaying,
  onVoiceChange,
  onPlayVoice,
  onRetryVoices,
  isCreating,
  hasAudioTrack,
  onCreateStream,
  onCloseStream
}) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [isWaitingVideoLoaded, setIsWaitingVideoLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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
    
    // Проверяем аудиодорожки
    const audioTracks = stream.getAudioTracks();
    console.log('🎵 Audio tracks found:', audioTracks.length);
    audioTracks.forEach((track, index) => {
      console.log(`🎵 Audio track ${index}:`, {
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
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

    console.log('🔊 Audio control check:', {
      hasStream: !!stream,
      isConnected,
      videoMuted: video.muted,
      streamAudioTracks: stream ? stream.getAudioTracks().length : 0,
      streamVideoTracks: stream ? stream.getVideoTracks().length : 0
    });

    if (stream && isConnected) {
      // Check if stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      console.log('🎵 Audio tracks in stream:', audioTracks.length);
      
      if (audioTracks.length > 0) {
        // Unmute when we have stream and connection with audio
        video.muted = false;
        setIsMuted(false);
        console.log('🔊 Unmuted video for active stream with audio');
      } else {
        console.log('⚠️ Stream has no audio tracks, keeping muted');
        video.muted = true;
        setIsMuted(true);
      }
    } else {
      // Keep muted for waiting video
      video.muted = true;
      console.log('🔇 Muted video for waiting state');
    }
  }, [stream, isConnected]);

  // Handle manual mute/unmute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    
    console.log(`🔊 Manual ${newMutedState ? 'muted' : 'unmuted'} video`);
  }, []);

  const handleVideoError = useCallback((error) => {
    console.error('❌ Video element error:', error);
    setVideoError('Ошибка воспроизведения видео');
    setIsLoading(false);
  }, []);

  return (
    <div className={`video-player ${className}`}>
      {/* Видео контейнер */}
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          onError={handleVideoError}
          playsInline
          controls={isConnected && stream}
        />
        
        {/* Оверлей статуса */}
        <div className="video-overlay">
          {videoError && (
            <div className="error-overlay">
              <span className="error-text">{videoError}</span>
            </div>
          )}
          
          {!stream && !isConnected && !videoError && (
            <div className="waiting-overlay">
              <span className="waiting-text">Ожидание сессии...</span>
            </div>
          )}
        </div>
      </div>

      {/* Компактная панель управления */}
      <div className="control-panel">
        <div className="control-row">
          {/* Статус */}
          <div className="status-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'waiting'}`}></span>
            <span className="status-text">
              {isConnected ? 'В эфире' : 'Ожидание'}
            </span>
          </div>

          {/* Элементы управления */}
          <div className="controls-group">
            {/* Выбор изображения */}
            <div className="image-selector">
              <ImageUpload
                selectedImage={selectedImage}
                previewUrl={previewUrl}
                onImageSelect={onImageSelect}
                onImageRemove={onImageRemove}
                onUploadSuccess={onUploadSuccess}
                onUploadError={onUploadError}
              />
            </div>

            {/* Выбор голоса */}
            <div className="voice-selector">
              <VoiceSelector
                selectedVoice={selectedVoice}
                voices={voices}
                loadingVoices={loadingVoices}
                voicesError={voicesError}
                isPlaying={isPlaying}
                onVoiceChange={onVoiceChange}
                onPlayVoice={onPlayVoice}
                onRetryVoices={onRetryVoices}
              />
            </div>

            {/* Кнопка стрима */}
            <div className="stream-button">
              <CreateStreamButton
                selectedImage={selectedImage}
                selectedVoice={selectedVoice}
                isCreating={isCreating}
                isStreamActive={isStreamActive}
                hasAudioTrack={hasAudioTrack}
                onCreateStream={onCreateStream}
                onCloseStream={onCloseStream}
              />
            </div>
          </div>

          {/* Аудио контроль */}
          {stream && isConnected && (
            <button 
              onClick={toggleMute}
              className="audio-btn"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>

        {/* Ошибки */}
        {uploadError && (
          <div className="error-message">
            {uploadError.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
