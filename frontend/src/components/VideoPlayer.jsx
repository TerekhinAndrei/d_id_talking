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
  onCloseStream,
  // Image dimensions
  imageDimensions,
  imageDimensionsLoading
}) => {
  const videoRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.2); // Добавляем состояние для zoom
  const [videoPlayerSize, setVideoPlayerSize] = useState({ width: 'auto', height: '400px' }); // Размеры видеоплеера
  
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

  // Простое управление видимостью на основе состояния стрима
  useEffect(() => {
    const mainVideo = document.getElementById('main-video-player');
    if (mainVideo) {
      if (isVideoStreamPlaying) {
        // Стрим активен - показываем main-video
        mainVideo.style.opacity = 1;
        mainVideo.style.zIndex = 3;
      } else {
        // Стрим неактивен - скрываем main-video
        mainVideo.style.opacity = 0;
        mainVideo.style.zIndex = 1;
      }
    }
  }, [isVideoStreamPlaying]);

  // Принудительно запускаем placeholder видео
  useEffect(() => {
    const placeholderVideo = document.querySelector('.placeholder-video');
    if (placeholderVideo) {
      placeholderVideo.play().catch((error) => {
        console.error('❌ Failed to play placeholder video:', error);
      });
    }
  }, []);

  // Обновляем размеры видеоплеера на основе размеров изображения
  useEffect(() => {
    if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      // Вычисляем оптимальные размеры с сохранением пропорций
      const maxWidth = 800; // Максимальная ширина
      const maxHeight = 400; // Максимальная высота
      
      let { width, height } = imageDimensions;
      
      // Если изображение больше максимальных размеров, масштабируем его
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const newSize = {
        width: `${width}px`,
        height: `${height}px`
      };
      setVideoPlayerSize(newSize);
      
      // Принудительно устанавливаем размеры через JavaScript для надежности
      setTimeout(() => {
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
          videoContainer.style.width = newSize.width;
          videoContainer.style.height = newSize.height;
          videoContainer.style.aspectRatio = 'auto';
        }
      }, 100);
    } else {
      // Возвращаемся к дефолтным размерам
      setVideoPlayerSize({ width: 'auto', height: '400px' });
    }
  }, [imageDimensions]);
  
  return (
    <div className={`video-player ${className}`}>
      {/* Видео контейнер */}
                      <div 
                        className="video-container" 
                        style={{ 
                          border: '2px solid red', 
                          minHeight: '400px',
                          width: videoPlayerSize.width,
                          height: videoPlayerSize.height,
                          maxWidth: '100%',
                          margin: '0 auto',
                          aspectRatio: 'auto !important',
                          '--video-width': videoPlayerSize.width,
                          '--video-height': videoPlayerSize.height,
                          '--video-aspect-ratio': imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : '16 / 9'
                        }}
                      >
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
              opacity: 1, // Всегда видимый
              zIndex: isVideoStreamPlaying ? 1 : 3, // Меняем z-index в зависимости от состояния
              objectFit: 'contain',
              border: '2px solid green',
              transform: `scale(${zoomLevel})`, // Применяем zoom
              transformOrigin: 'center top' // Прижимаем верхнюю границу
            }}
            src="/Waiting.mp4"
            onLoadStart={() => {}}
            onLoadedData={() => {}}
            onError={(e) => {
              console.error('❌ Ошибка загрузки видео:', e.target.error);
              console.error('❌ Видео элемент:', e.target);
              console.error('❌ Src:', e.target.src);
              console.error('❌ Network state:', e.target.networkState);
              console.error('❌ Ready state:', e.target.readyState);
            }}
            onCanPlay={() => {}}
            onPlay={() => {}}
            onPause={() => {}}
            onEnded={() => {}}
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



        {/* Индикатор загрузки размеров изображения */}
        {imageDimensionsLoading && (
          <div className="image-dimensions-loading-indicator">
            <span>Загрузка размеров изображения...</span>
          </div>
        )}




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
