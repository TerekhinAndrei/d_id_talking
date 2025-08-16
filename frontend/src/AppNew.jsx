import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { useStreamingStore } from './store/streamingStore';
import { useVoices, useStreamOperations } from './api/queries';
import { fileService } from './services/FileService';
import { useElevenLabsDidBridge } from './hooks/useElevenLabsDidBridge';
import { DEFAULT_AVATAR_URL, DEFAULT_VOICE_ID } from './constants';

// Компоненты
import VideoPlayer from './components/VideoPlayer';
import ElevenLabsTester from './components/ElevenLabsTester';
import DIdStreamingTester from './components/DIdStreamingTester';

// Новые компоненты (будут созданы позже)
// import ImageUpload from './components/new/ImageUpload';
// import VoiceSelector from './components/new/VoiceSelector';
// import StreamControls from './components/new/StreamControls';
// import TestingPanel from './components/new/TestingPanel';
import StatusPanel from './components/new/StatusPanel';

function AppNew() {
  // === STORES ===
  const {
    // Состояние приложения
    selectedImage,
    previewUrl,
    uploadedImageUrl,
    uploadError,
    selectedVoice,
    isCreating,
    isPlaying,
    isVideoReady,
    showElevenLabsTester,
    showDIdStreamingTester,
    
    // Действия
    setSelectedImage,
    setPreviewUrl,
    setUploadedImageUrl,
    setUploadError,
    setSelectedVoice,
    setCreating,
    setPlaying,
    setVideoReady,
    toggleElevenLabsTester,
    toggleDIdStreamingTester,
    clearImage,
    reset: resetApp
  } = useAppStore();

  const {
    // Состояние стриминга
    streamId,
    sessionId,
    videoStream,
    isConnected,
    isActive,
    status,
    error: streamingError,
    
    // Действия стриминга
    createStream: createStreamAction,
    startStream: startStreamAction,
    createTalk: createTalkAction,
    closeStream: closeStreamAction,
    reset: resetStreaming
  } = useStreamingStore();

  // === API HOOKS ===
  const { voices, loadingVoices, voicesError, retryFetchVoices } = useVoices();
  const { createStream, startStream, createTalk, closeStream, isLoading: apiLoading } = useStreamOperations();

  // === BRIDGE ===
  const bridge = useElevenLabsDidBridge();

  // === HANDLERS ===

  // Обработка выбора изображения
  const handleImageSelect = useCallback((file) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadError(null);
  }, [setSelectedImage, setPreviewUrl, setUploadError]);

  // Обработка удаления изображения
  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(DEFAULT_AVATAR_URL);
    setUploadedImageUrl(null);
    setUploadError(null);
  }, [setSelectedImage, setPreviewUrl, setUploadedImageUrl, setUploadError]);

  // Обработка успешной загрузки изображения
  const handleImageUploadSuccess = useCallback((result) => {
    console.log('✅ Image uploaded successfully:', result);
    setUploadedImageUrl(result.data?.url || result.data?.secure_url);
    setUploadError(null);
  }, [setUploadedImageUrl, setUploadError]);

  // Обработка ошибки загрузки изображения
  const handleImageUploadError = useCallback((error) => {
    console.error('❌ Image upload failed:', error);
    setUploadError(error);
  }, [setUploadError]);

  // Обработка изменения голоса
  const handleVoiceChange = useCallback((voice) => {
    setSelectedVoice(voice);
  }, [setSelectedVoice]);

  // Обработка воспроизведения голоса
  const handlePlayVoice = useCallback(() => {
    console.log('🎤 Запрос на воспроизведение голоса передан в VoiceSelector');
  }, []);

  // Создание стрима
  const handleCreateStream = useCallback(async () => {
    try {
      setCreating(true);
      console.log('🚀 Начинаем флоу D-ID стриминга');
      
      // Загружаем изображение в Cloudinary
      let imageUrl;
      if (selectedImage) {
        console.log('📸 Загружаем выбранное пользователем изображение...');
        const uploadResult = await fileService.uploadImage(selectedImage);
        imageUrl = uploadResult.data?.url || uploadResult.data?.secure_url;
      } else {
        console.log('📸 Используем дефолтное изображение...');
        imageUrl = uploadedImageUrl || DEFAULT_AVATAR_URL;
      }
      
      console.log('📸 Используем изображение:', imageUrl);
      
      // Шаг 1: Создаем стрим
      console.log('🎬 Step 1: Creating D-ID stream');
      const streamResult = await createStreamAction(imageUrl);
      console.log('✅ Стрим создан:', streamResult.streamId);
      
      // Шаг 2: Запускаем стрим
      console.log('🔗 Step 2: Starting stream');
      const startResult = await startStreamAction(
        streamResult.streamId,
        streamResult.sessionId,
        streamResult.sdpOffer,
        streamResult.iceServers
      );
      
      console.log('✅ Стрим запущен');
      
      // Шаг 3: SDP exchange завершен
      console.log('🌐 SDP exchange завершен - стрим готов к работе');
      
      // Автоматически запускаем мост ElevenLabs → D-ID
      try {
        await bridge.start({
          streamId: streamResult.streamId,
          sessionId: streamResult.sessionId,
          voiceId: selectedVoice
        });
        console.log('🔊 Мост ElevenLabs → D-ID запущен');
      } catch (e) {
        console.warn('⚠️ Не удалось запустить мост ElevenLabs → D-ID:', e);
      }

      // Обновляем состояние видео
      setVideoReady(true);
      
      console.log('🎉 Стрим успешно создан и готов к использованию!');
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error);
    } finally {
      setCreating(false);
      console.log('✅ Stream creation completed');
    }
  }, [
    selectedImage,
    uploadedImageUrl,
    selectedVoice,
    setCreating,
    setVideoReady,
    createStreamAction,
    startStreamAction,
    bridge
  ]);

  // Закрытие стрима
  const handleCloseStream = useCallback(async () => {
    try {
      // Останавливаем мост до закрытия стрима
      try { bridge.stop(); } catch (_) {}
      
      await closeStreamAction();
      console.log('✅ Стрим закрыт');
      
      // Сбрасываем состояние видео
      setVideoReady(false);
    } catch (error) {
      console.error('❌ Ошибка закрытия стрима:', error);
    }
  }, [closeStreamAction, setVideoReady, bridge]);

  // Сброс всего состояния
  const handleReset = useCallback(() => {
    resetApp();
    resetStreaming();
    try { bridge.stop(); } catch (_) {}
  }, [resetApp, resetStreaming, bridge]);

  return (
    <div className="App">
      <motion.div 
        className="container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Заголовок приложения */}
        <motion.div 
          className="app-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="app-title">СОЗДАНИЕ АВАТАРА</h1>
          <p className="app-subtitle">Интерактивные видео-стримы с анимированными аватарами</p>
        </motion.div>

        {/* Основной видеоплеер с элементами управления */}
        <motion.div 
          className="main-video-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <VideoPlayer
            stream={videoStream}
            isConnected={isConnected && isActive}
            connectionStatus={status}
            onVideoReady={() => setVideoReady(true)}
            className="main-video-player"
            isStreamActive={isConnected && isActive && videoStream}
            // Элементы управления
            selectedImage={selectedImage}
            previewUrl={previewUrl}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onUploadSuccess={handleImageUploadSuccess}
            onUploadError={handleImageUploadError}
            uploadError={uploadError}
            selectedVoice={selectedVoice}
            voices={voices}
            loadingVoices={loadingVoices}
            voicesError={voicesError}
            isPlaying={isPlaying}
            onVoiceChange={handleVoiceChange}
            onPlayVoice={handlePlayVoice}
            onRetryVoices={retryFetchVoices}
            isCreating={isCreating || apiLoading}
            hasAudioTrack={!!videoStream}
            onCreateStream={handleCreateStream}
            onCloseStream={handleCloseStream}
          />
        </motion.div>

        {/* Панель тестирования */}
        <motion.div 
          className="testing-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="section-header">
            <h2>Панель тестирования</h2>
            <div className="tester-buttons">
              <motion.button 
                className="toggle-tester-btn"
                onClick={toggleElevenLabsTester}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showElevenLabsTester ? 'Скрыть' : 'Показать'} ElevenLabs Тестер
              </motion.button>
              
              <motion.button 
                className="toggle-tester-btn"
                onClick={toggleDIdStreamingTester}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showDIdStreamingTester ? 'Скрыть' : 'Показать'} D-ID Streaming Тестер
              </motion.button>
            </div>
          </div>
          
          <AnimatePresence>
            {showElevenLabsTester && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ElevenLabsTester 
                  voices={voices}
                  loadingVoices={loadingVoices}
                />
              </motion.div>
            )}
            
            {showDIdStreamingTester && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DIdStreamingTester selectedVoice={selectedVoice} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Панель статуса новой архитектуры */}
        <motion.div 
          className="status-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <StatusPanel />
        </motion.div>

        {/* Кнопка сброса */}
        <motion.div 
          className="reset-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button 
            className="reset-btn"
            onClick={handleReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Сбросить все
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default AppNew;
