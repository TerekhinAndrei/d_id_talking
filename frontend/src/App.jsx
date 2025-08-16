import React, { useState, useRef } from 'react';
import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer';
import ElevenLabsTester from './components/ElevenLabsTester';
import DIdStreamingTester from './components/DIdStreamingTester';

// Hooks
import { useVoices } from './hooks/useVoices';
import { useDIdStreaming } from './hooks/useDIdStreaming';
import { useElevenLabsDidBridge } from './hooks/useElevenLabsDidBridge';

// Constants
import { DEFAULT_AVATAR_URL, DEFAULT_VOICE_ID } from './constants';

// Services
import { apiService } from './services/api';
import { fileService } from './services/FileService';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR_URL);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showElevenLabsTester, setShowElevenLabsTester] = useState(false);
  const [showDIdStreamingTester, setShowDIdStreamingTester] = useState(false);
  
  // Video streaming state
  const [videoStream, setVideoStream] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // File upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  
  // Microphone streaming state (disabled for D-ID streaming)
  // const [microphoneStatus, setMicrophoneStatus] = useState('idle');
  // const [processedAudio, setProcessedAudio] = useState(null);
  
  // Microphone ref (disabled for D-ID streaming)
  // const microphoneRef = useRef(null);

  const { voices, loadingVoices, voicesError, retryFetchVoices } = useVoices();
  const { 
    streamState, 
    createStream, 
    startStream, 
    submitIceCandidate, 
    createTalk, 
    closeStream,
    resetState 
  } = useDIdStreaming();

  // Unified bridge: ElevenLabs → D-ID (starts/stops with main flow)
  const bridge = useElevenLabsDidBridge();

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadError(null);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setPreviewUrl(DEFAULT_AVATAR_URL);
    setUploadedImageUrl(null);
    setUploadError(null);
  };

  const handleImageUploadSuccess = (result) => {
    console.log('✅ Image uploaded successfully:', result);
    setUploadedImageUrl(result.data?.url || result.data?.secure_url);
    setUploadError(null);
  };

  const handleImageUploadError = (error) => {
    console.error('❌ Image upload failed:', error);
    setUploadError(error);
  };

  const handleVoiceChange = (event) => {
    setSelectedVoice(event.target.value);
  };

  const handlePlayVoice = async () => {
    // Эта функция теперь просто передает управление в VoiceSelector
    // Воспроизведение обрабатывается в компоненте VoiceSelector
    console.log('🎤 Запрос на воспроизведение голоса передан в VoiceSelector');
  };

  // Microphone handlers
  const handleAudioReceived = (audioBlob) => {
    console.log('🔊 Processed audio received:', audioBlob.size, 'bytes');
    // setProcessedAudio(audioBlob);
    // Here you could integrate with D-ID streaming or other systems
  };

  const handleMicrophoneError = (error) => {
    console.error('🎤 Microphone error:', error);
    // Handle microphone errors - could show user notification
  };

  const handleMicrophoneStatusChange = (status) => {
    console.log('🎤 Microphone status changed:', status);
    // setMicrophoneStatus(status);
  };

  const handleCreateStream = async () => {
    try {
      setIsCreating(true);
      console.log('🚀 Начинаем флоу D-ID стриминга (до Step 3 включительно)');
      
      // Upload image to Cloudinary
      let imageUrl;
              if (selectedImage) {
          console.log('📸 Загружаем выбранное пользователем изображение...');
          const uploadResult = await fileService.uploadImage(selectedImage);
          imageUrl = uploadResult.data?.url || uploadResult.data?.secure_url;
        } else {
          console.log('📸 Используем дефолтное изображение...');
          imageUrl = uploadedImageUrl || DEFAULT_AVATAR_URL;
        }
      
      console.log('📸 Используем изображение:', selectedImage ? 'загруженное пользователем' : 'по умолчанию');
      console.log('📸 Создание стрима с изображением:', imageUrl);
      
      // Step 1: Create stream - EXACT SAME AS DIdStreamingTester
      console.log('🎬 Step 1: Creating D-ID stream with image:', imageUrl);
      const streamResult = await createStream(imageUrl);
      console.log(' Результат создания стрима:', streamResult);
      
      if (!streamResult.success) {
        throw new Error('Не удалось создать стрим');
      }
      
      console.log('✅ Стрим создан:', streamResult.streamId);
      
      // Step 2: Start stream - EXACT SAME AS DIdStreamingTester
      console.log('🔗 Запуск стрима');
      const startResult = await startStream(
        streamResult.streamId,
        streamResult.sessionId,
        streamResult.sdpOffer,
        streamResult.iceServers
      );
      
      if (!startResult.success) {
        throw new Error('Не удалось запустить стрим');
      }
      
      console.log('✅ Стрим запущен');
      
      // Step 3: SDP exchange completed
      console.log('🌐 SDP exchange завершен - стрим готов к работе');
      console.log('✅ Stream state updated to connected');
      console.log('🔍 Current streamState:', streamState);
      console.log('🔍 streamState.videoStream:', streamState.videoStream);
      console.log('🔍 streamState.isConnected:', streamState.isConnected);
      
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

      // Force video re-render
      setIsVideoReady(true);
      
      console.log('🎉 Стрим успешно создан и готов к использованию!');
      console.log('🎤 Говорите в микрофон - аватар будет анимироваться с синтезированной речью');
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error);
      // Ошибку уже видно в консоли; состояние хука тут недоступно
    } finally {
      setIsCreating(false);
      console.log('✅ Stream creation completed');
    }
  };

  const handleCloseStream = async () => {
    try {
      // Останавливаем мост до закрытия стрима
      try { bridge.stop(); } catch (_) {}
      // Stop microphone if it's active (now handled by WebRTC)
      // if (microphoneRef.current) {
      //   console.log('🎤 Останавливаем микрофон...');
      //   microphoneRef.current.stopMicrophone();
      // }
      
      await closeStream();
      console.log('✅ Стрим закрыт');
      
      // Reset video stream state
      setVideoStream(null);
      setIsVideoReady(false);
    } catch (error) {
      console.error('❌ Ошибка закрытия стрима:', error);
    }
  };

  return (
    <div className="App">
      <div className="container">
        {/* Заголовок приложения */}
        <div className="app-header">
          <h1 className="app-title">СОЗДАНИЕ АВАТАРА</h1>
          <p className="app-subtitle">Интерактивные видео-стримы с анимированными аватарами</p>
        </div>

        {/* Основной видеоплеер с элементами управления */}
        <div className="main-video-section">
          <VideoPlayer
            stream={streamState.videoStream}
            isConnected={streamState.isConnected && streamState.isActive}
            connectionStatus={streamState.status}
            onVideoReady={() => setIsVideoReady(true)}
            className="main-video-player"
            isStreamActive={streamState.isConnected && streamState.isActive && streamState.videoStream}
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
            isCreating={isCreating}
            hasAudioTrack={!!streamState.audioStream}
            onCreateStream={handleCreateStream}
            onCloseStream={handleCloseStream}
          />
        </div>

        {/* Панель тестирования */}
        <div className="testing-section">
          <div className="section-header">
            <h2>Панель тестирования</h2>
            <div className="tester-buttons">
              <button 
                className="toggle-tester-btn"
                onClick={() => setShowElevenLabsTester(!showElevenLabsTester)}
              >
                {showElevenLabsTester ? 'Скрыть' : 'Показать'} ElevenLabs Тестер
              </button>
              
              <button 
                className="toggle-tester-btn"
                onClick={() => setShowDIdStreamingTester(!showDIdStreamingTester)}
              >
                {showDIdStreamingTester ? 'Скрыть' : 'Показать'} D-ID Streaming Тестер
              </button>
            </div>
          </div>
          
          {showElevenLabsTester && (
            <ElevenLabsTester 
              voices={voices}
              loadingVoices={loadingVoices}
            />
          )}
          
          {showDIdStreamingTester && (
            <DIdStreamingTester selectedVoice={selectedVoice} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
