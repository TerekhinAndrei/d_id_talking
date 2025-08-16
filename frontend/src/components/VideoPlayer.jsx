import React, { useEffect, useRef, useState } from 'react';
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
  const [placeholderOpacity, setPlaceholderOpacity] = useState(0);
  
  // Используем кастомные хуки для разделения ответственности
  const { 
    videoError, 
    handleVideoError 
  } = useVideoState();
  
  const {
    isMuted,
    toggleMute,
    initializeWaitingVideo,
    handleStreamTransition,
    // Добавляем функции для тестирования
    testShowStream,
    testShowWaiting,
    shouldShowStream,
    shouldShowWaiting,
    testMode,
    testStreamActive,
    isPlaying: isTestVideoPlaying
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
                      <div className="video-container" style={{ border: '2px solid red', minHeight: '400px' }}>
          {/* Основной видеоэлемент для стрима */}
          <video
            ref={videoRef}
            className="video-element"
            onError={handleVideoError}
            playsInline
            autoPlay
            loop
            muted
            controls={shouldShowStream}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 1,
              zIndex: 1,
              objectFit: 'contain',
              border: '2px solid blue'
            }}
            src="/Waiting.mp4"
          />
          
          {/* Видео ожидания */}
          <video 
            className="placeholder-video"
            autoPlay 
            playsInline
            loop
            muted
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: placeholderOpacity,
              zIndex: 2,
              objectFit: 'contain',
              border: '2px solid green'
            }}
            src={testMode && testStreamActive ? "/Test.mp4" : "/Waiting.mp4"}
            onLoadStart={() => console.log('🎬 Загрузка видео:', testMode && testStreamActive ? "Test.mp4" : "Waiting.mp4")}
            onLoadedData={() => {
              console.log('✅ Видео загружено:', testMode && testStreamActive ? "Test.mp4" : "Waiting.mp4");
              const video = document.querySelector('.placeholder-video');
              if (video) {
                console.log('📏 Размеры видео:', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  offsetWidth: video.offsetWidth,
                  offsetHeight: video.offsetHeight,
                  clientWidth: video.clientWidth,
                  clientHeight: video.clientHeight
                });
              }
            }}
            onError={(e) => {
              console.error('❌ Ошибка загрузки видео:', e.target.error);
              console.error('❌ Видео элемент:', e.target);
              console.error('❌ Src:', e.target.src);
            }}
            onCanPlay={() => console.log('🎯 Видео готово к воспроизведению:', testMode && testStreamActive ? "Test.mp4" : "Waiting.mp4")}
            onPlay={() => console.log('▶️ Видео начало воспроизведение')}
            onPause={() => console.log('⏸️ Видео приостановлено')}
            onEnded={() => console.log('🏁 Видео завершилось')}
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

                        {/* Тестовые кнопки для переключения видеослоев */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: 'white', 
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '2px 6px', 
                      borderRadius: '3px',
                      textAlign: 'center'
                    }}>
                      {testMode ? '🧪 ТЕСТОВЫЙ РЕЖИМ' : '🎬 ОБЫЧНЫЙ РЕЖИМ'}
                    </div>
                    {testMode && (
                      <div style={{ 
                        fontSize: '9px', 
                        color: 'white', 
                        background: 'rgba(0,0,0,0.7)', 
                        padding: '2px 6px', 
                        borderRadius: '3px',
                        textAlign: 'center'
                      }}>
                        {testStreamActive ? '📺 Test.mp4' : '🎬 Waiting.mp4'} {isTestVideoPlaying ? '▶️' : '⏸️'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={testShowWaiting}
                      style={{
                        padding: '8px 12px',
                        background: shouldShowWaiting ? '#ff6b6b' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🎬 Waiting.mp4 {shouldShowWaiting && '(активно)'}
                    </button>
                    <button 
                      onClick={testShowStream}
                      style={{
                        padding: '8px 12px',
                        background: shouldShowStream ? '#4ecdc4' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📺 Test.mp4 {shouldShowStream && '(активно)'}
                    </button>
                    </div>
                    
                    {/* Слайдер opacity для второго слоя */}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '8px', 
                      borderRadius: '4px',
                      minWidth: '200px'
                    }}>
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'white', 
                        marginBottom: '4px',
                        textAlign: 'center'
                      }}>
                        🎚️ Opacity слоя 2 (зеленый): {Math.round(placeholderOpacity * 100)}%
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={placeholderOpacity}
                        onChange={(e) => setPlaceholderOpacity(parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          height: '20px',
                          background: 'transparent',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
    </div>
  );
};

export default VideoPlayer;
