import React, { useEffect, useRef } from 'react';
import './VideoPlayer.css';
import VideoControls from './VideoControls';
import VideoOverlay from './VideoOverlay';
import { useVideoStream } from '../hooks/useVideoStream';
import { useVideoState } from '../hooks/useVideoState';

const VideoPlayer = ({ 
  stream, 
  isConnected, 
  onVideoReady,
  className = "",
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
  
  // Используем кастомные хуки для разделения ответственности
  const { 
    videoError, 
    handleVideoError 
  } = useVideoState();
  
  const {
    isMuted,
    toggleMute,
    initializeWaitingVideo,
    handleStreamTransition
  } = useVideoStream(videoRef, stream, isConnected, onVideoReady);

  // Инициализация видео ожидания
  useEffect(() => {
    if (!stream && !isConnected) {
      initializeWaitingVideo();
    }
  }, [stream, isConnected, initializeWaitingVideo]);

  // Обработка изменений стрима
  useEffect(() => {
    if (stream && isConnected) {
      handleStreamTransition();
    }
  }, [stream, isConnected, handleStreamTransition]);

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
        <VideoOverlay 
          stream={stream}
          isConnected={isConnected}
          videoError={videoError}
        />
      </div>

      {/* Панель управления */}
      <VideoControls
        isConnected={isConnected}
        stream={stream}
        isMuted={isMuted}
        toggleMute={toggleMute}
        uploadError={uploadError}
        // Элементы управления
        selectedImage={selectedImage}
        previewUrl={previewUrl}
        onImageSelect={onImageSelect}
        onImageRemove={onImageRemove}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        selectedVoice={selectedVoice}
        voices={voices}
        loadingVoices={loadingVoices}
        voicesError={voicesError}
        isPlaying={isPlaying}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
        isCreating={isCreating}
        hasAudioTrack={hasAudioTrack}
        onCreateStream={onCreateStream}
        onCloseStream={onCloseStream}
      />
    </div>
  );
};

export default VideoPlayer;
