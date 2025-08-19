import React from 'react';
import ImageUpload from './ImageUpload';
import VoiceSelector from './VoiceSelector';
import CreateStreamButton from './CreateStreamButton';

const VideoControls = ({
  isConnected,
  stream,
  isMuted,
  toggleMute,
  uploadError,
  // Элементы управления
  selectedImage,
  previewUrl,
  onImageSelect,
  onImageRemove,
  onUploadSuccess,
  onUploadError,
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
  onCloseStream,
  // Zoom controls
  zoomLevel,
  onZoomChange
}) => {
  return (
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
              compact={true}
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
              isStreamActive={isConnected}
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
  );
};

export default VideoControls;
