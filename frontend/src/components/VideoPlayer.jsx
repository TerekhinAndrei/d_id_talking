import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';
import VideoControls from './VideoControls';
import VideoOverlay from './VideoOverlay';
import { useVideoStream } from '../hooks/useVideoStream';
import { useVideoState } from '../hooks/useVideoState';
import { useVideoPlayback } from '../hooks/useVideoPlayback';

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
  const [zoomLevel, setZoomLevel] = useState(1); // Добавляем состояние для zoom
  
  // Используем кастомные хуки для разделения ответственности
  const { 
    videoError, 
    handleVideoError 
  } = useVideoState();
  
  // Определяем, проигрывается ли видео из стрима
  const { isPlaying: isVideoPlaying, playbackInfo } = useVideoPlayback(videoRef, stream);
  

  
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

  // Управление прозрачностью видео элементов
  useEffect(() => {
    const mainVideo = document.getElementById('main-video-player');
    const placeholderVideo = document.querySelector('.placeholder-video');


    
    if (stream && isConnected) {
      // Управляем прозрачность main-video-player на основе проигрывания видео
      if (mainVideo) {
        const mainVideoOpacity = isVideoPlaying ? 1 : 0;
        mainVideo.style.opacity = mainVideoOpacity;

      }
      
      // Placeholder всегда видимый когда есть стрим
      if (placeholderVideo) {
        placeholderVideo.style.opacity = 1;
        setPlaceholderOpacity(1);
      }
    } else {
      // Нет стрима - скрываем основной видео элемент, показываем placeholder
      if (mainVideo) {
        mainVideo.style.opacity = 0;
      }
      if (placeholderVideo) {
        placeholderVideo.style.opacity = 1;
        setPlaceholderOpacity(1);
      }
    }
  }, [isVideoPlaying, stream, isConnected, playbackInfo]);

  return (
    <div className={`video-player ${className}`}>
      {/* Видео контейнер */}
                      <div className="video-container" style={{ border: '2px solid red', minHeight: '400px' }}>
          {/* Основной видеоэлемент для стрима */}
          <video
            ref={videoRef}
            id="main-video-player"
            className="video-element"
            onError={handleVideoError}
            playsInline
            autoPlay
            muted
            controls={shouldShowStream}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: stream && isConnected ? 1 : 0,
              zIndex: 1,
              objectFit: 'contain',
              border: '2px solid blue'
            }}
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
              border: '2px solid green',
              transform: `scale(${zoomLevel})`, // Применяем zoom
              transformOrigin: 'center center' // Центрируем масштабирование
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

        {/* Zoom слайдер - абсолютное позиционирование внизу */}
        <div className="zoom-slider-overlay">
          <div className="zoom-slider-container">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="zoom-slider"
              title={`Zoom: ${zoomLevel.toFixed(1)}x`}
            />
            <span className="zoom-value">{zoomLevel.toFixed(1)}x</span>
          </div>
        </div>
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
        // Zoom controls
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />

                        {/* Тестовые кнопки отключены */}
                        {/* 
                        <div style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          right: '10px', 
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px'
                        }}>
                          Тестовые кнопки и слайдер opacity отключены
                        </div>
                        */}
    </div>
  );
};

export default VideoPlayer;
