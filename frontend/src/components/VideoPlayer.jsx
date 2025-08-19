import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';
import VideoControls from './VideoControls';
import VideoOverlay from './VideoOverlay';
import { useVideoStream } from '../hooks/useVideoStream';
import { useVideoState } from '../hooks/useVideoState';
import { useVideoStreamStatus } from '../hooks/useVideoStreamStatus';

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
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1); // Делаем placeholder видимым по умолчанию
  const [zoomLevel, setZoomLevel] = useState(1.2); // Добавляем состояние для zoom
  
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
  } = useVideoStream(videoRef, stream, isConnected, onVideoReady);

  // Используем хук для определения статуса воспроизведения видеострима
  const isVideoStreamPlaying = useVideoStreamStatus('main-video-player');

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

  // Автоматическое управление прозрачностью main-video-player на основе состояния стрима
  useEffect(() => {
    const mainVideo = document.getElementById('main-video-player');
    if (mainVideo) {
      if (isVideoStreamPlaying) {
        // Стрим активен - показываем видео, скрываем placeholder
        mainVideo.style.transition = 'opacity 0.5s ease-in-out';
        mainVideo.style.opacity = 1;
        mainVideo.style.display = 'block';
        setPlaceholderOpacity(0); // Скрываем placeholder
      } else {
        // Стрим неактивен - оставляем последний кадр видимым
        // Убираем transition чтобы избежать анимации исчезновения
        mainVideo.style.transition = 'none';
        mainVideo.style.opacity = 1;
        mainVideo.style.display = 'block';
        setPlaceholderOpacity(1); // Показываем placeholder
      }
    }
  }, [isVideoStreamPlaying]);

  // Принудительно запускаем placeholder видео
  useEffect(() => {
    const placeholderVideo = document.querySelector('.placeholder-video');
    if (placeholderVideo) {
      console.log('🎬 Attempting to play placeholder video...');
      placeholderVideo.play().then(() => {
        console.log('✅ Placeholder video started playing');
      }).catch((error) => {
        console.error('❌ Failed to play placeholder video:', error);
      });
    }
  }, []);
  
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
            controls={true}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0, // Начальная прозрачность, управляется автоматически
              zIndex: 3, // Увеличиваем z-index чтобы main-video-player был поверх placeholder
              objectFit: 'contain',
              border: '2px solid blue',
              display: 'block' // Принудительно показываем для тестирования
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
              transition: 'opacity 0.5s ease-in-out',
              zIndex: 2,
              objectFit: 'contain',
              border: '2px solid green',
              transform: `scale(${zoomLevel})`, // Применяем zoom
              transformOrigin: 'center top' // Прижимаем верхнюю границу
            }}
            src="/Waiting.mp4"
            onLoadStart={() => console.log('🎬 Загрузка видео: Waiting.mp4')}
            onLoadedData={() => {
              console.log('✅ Видео загружено: Waiting.mp4');
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
              console.error('❌ Network state:', e.target.networkState);
              console.error('❌ Ready state:', e.target.readyState);
            }}
            onCanPlay={() => console.log('🎯 Видео готово к воспроизведению: Waiting.mp4')}
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

        {/* Индикатор статуса видеострима */}
        <div className="stream-status-indicator">
          <div className={`stream-status-dot ${isVideoStreamPlaying ? 'playing' : 'stopped'}`}></div>
          <span className="stream-status-text">
            {isVideoStreamPlaying ? 'Стрим активен' : 'Стрим неактивен'}
          </span>
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
