import React, { useState, useRef } from 'react';
import './App.css';

// Components
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import VoiceSelector from './components/VoiceSelector';
import CreateStreamButton from './components/CreateStreamButton';
import VideoPlayer from './components/VideoPlayer';
import MicrophoneInput from './components/MicrophoneInput';
import Features from './components/Features';
import Technologies from './components/Technologies';
import StatusGrid from './components/StatusGrid';
import ElevenLabsTester from './components/ElevenLabsTester';

import DIdStreamingTester from './components/DIdStreamingTester';

// Hooks
import { useVoices } from './hooks/useVoices';
import { useDIdStreaming } from './hooks/useDIdStreaming';

// Constants
import { DEFAULT_AVATAR_URL, DEFAULT_VOICE_ID } from './constants';

// Services
import { apiService } from './services/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR_URL);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showElevenLabsTester, setShowElevenLabsTester] = useState(false);
  const [showDIdStreamingTester, setShowDIdStreamingTester] = useState(false);
  
  // Video streaming state
  const [videoStream, setVideoStream] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Microphone streaming state
  const [microphoneStatus, setMicrophoneStatus] = useState('idle');
  const [processedAudio, setProcessedAudio] = useState(null);
  
  // Microphone ref
  const microphoneRef = useRef(null);

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

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setPreviewUrl(DEFAULT_AVATAR_URL);
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
    setProcessedAudio(audioBlob);
    // Here you could integrate with D-ID streaming or other systems
  };

  const handleMicrophoneError = (error) => {
    console.error('🎤 Microphone error:', error);
    // Handle microphone errors - could show user notification
  };

  const handleMicrophoneStatusChange = (status) => {
    console.log('🎤 Microphone status changed:', status);
    setMicrophoneStatus(status);
  };

  const uploadDefaultImage = async () => {
    try {
      console.log('📤 Загружаем дефолтное изображение в Cloudinary...');
      
      // Получаем дефолтное изображение как файл
      const defaultImageUrl = `http://localhost:5177${DEFAULT_AVATAR_URL}`;
      console.log('📸 Загружаем дефолтное изображение с URL:', defaultImageUrl);
      console.log('📸 window.location.origin:', window.location.origin);
      console.log('📸 DEFAULT_AVATAR_URL:', DEFAULT_AVATAR_URL);
      
      const response = await fetch(defaultImageUrl);
      console.log('📸 Fetch response status:', response.status);
      console.log('📸 Fetch response ok:', response.ok);
      if (!response.ok) {
        throw new Error(`Failed to fetch default image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'default_avatar.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await apiService.uploadToCloudinary(formData);
      console.log('📥 Получен ответ от Cloudinary для дефолтного изображения:', uploadResponse);
      
      if (uploadResponse.success && uploadResponse.url) {
        console.log('✅ Дефолтное изображение загружено в Cloudinary:', uploadResponse.url);
        return uploadResponse.url;
      } else {
        throw new Error('Не удалось загрузить дефолтное изображение в Cloudinary');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки дефолтного изображения:', error);
      throw error;
    }
  };

  const handleCreateStream = async () => {
    if (!selectedVoice) {
      alert('Сначала выберите голос');
      return;
    }

    try {
      console.log('🚀 Начинаем флоу D-ID стриминга (до Step 3 включительно)');
      
      let imageUrl;
      
      // ВСЕГДА загружаем изображение в Cloudinary
      if (selectedImage) {
        console.log('📸 Загружаем локальное изображение пользователя в Cloudinary...');
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        try {
          console.log('📤 Отправляем пользовательское изображение в Cloudinary...');
          const uploadResponse = await apiService.uploadToCloudinary(formData);
          console.log('📥 Получен ответ от Cloudinary:', uploadResponse);
          
          if (uploadResponse.success && uploadResponse.url) {
            imageUrl = uploadResponse.url;
            console.log('✅ Пользовательское изображение загружено в Cloudinary:', imageUrl);
          } else {
            throw new Error('Не удалось загрузить пользовательское изображение');
          }
        } catch (uploadError) {
          console.warn('⚠️ Ошибка загрузки пользовательского изображения, загружаем дефолтное:', uploadError);
          imageUrl = await uploadDefaultImage();
        }
      } else {
        console.log('📸 Загружаем дефолтное изображение в Cloudinary...');
        imageUrl = await uploadDefaultImage();
      }
      
      console.log('📸 Используем изображение:', selectedImage ? 'загруженное пользователем' : 'по умолчанию');
      
      // Step 1: Create stream - EXACT SAME AS DIdStreamingTester
      console.log('📸 Создание стрима с изображением:', imageUrl);
      const streamResult = await createStream(imageUrl);
      console.log('📥 Результат создания стрима:', streamResult);
      
      if (!streamResult.success) {
        throw new Error('Не удалось создать стрим');
      }
      
      console.log('✅ Стрим создан:', streamResult.streamId);
      
      // Step 2: Start stream - EXACT SAME AS DIdStreamingTester
      console.log('🔗 Запуск стрима');
      const startResult = await startStream(
        streamResult.sdpOffer,
        streamResult.iceServers,
        streamResult.streamId,
        streamResult.sessionId
      );
      
      if (!startResult.success) {
        throw new Error('Не удалось запустить стрим');
      }
      
      console.log('✅ Стрим запущен');
      
      // Step 3: SDP exchange completed - STOP HERE
      console.log('🌐 SDP exchange завершен - стрим готов к работе');
      
      // Force update stream state to show it's active
      console.log('✅ Stream state updated to connected');
      console.log('🔍 Current streamState:', {
        isConnected: streamState.isConnected,
        isActive: streamState.isActive,
        status: streamState.status,
        hasVideoStream: !!streamState.videoStream,
        streamId: streamState.streamId,
        sessionId: streamState.sessionId
      });
      
      // Force re-render by updating a local state
      setIsVideoReady(true);
      
      // Simple success notification without technical details
      const imageInfo = selectedImage ? 'с загруженным изображением' : 'с изображением по умолчанию';
      console.log(`🎉 Стрим успешно создан ${imageInfo} и готов к использованию!`);
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error);
      
      // Показываем понятную ошибку пользователю
      let errorMessage = error.message;
      
      if (error.message.includes('Ошибка подключения к D-ID API')) {
        errorMessage = 'D-ID API временно недоступен. Попробуйте позже.';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Ошибка аутентификации D-ID. Проверьте настройки API.';
      } else if (error.message.includes('Failed to create stream')) {
        errorMessage = 'Не удалось создать стрим. Попробуйте еще раз.';
      }
      
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      // Don't reset state automatically - let user control it
      console.log('✅ Stream creation completed');
    }
  };

  const handleCloseStream = async () => {
    try {
      // Stop microphone if it's active
      if (microphoneRef.current) {
        console.log('🎤 Останавливаем микрофон...');
        microphoneRef.current.stopMicrophone();
      }
      
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
        <Header />

        {/* Block 1: Image Selection + Video */}
        <div className="block-1">
          <div className="image-video-container">
            {/* Секция выбора изображения */}
            <div className="image-section">
              <h2>Изображение (необязательно)</h2>
              <p className="text-muted mb-3">
                Загрузите изображение для стрима или используйте изображение по умолчанию.
              </p>
              <ImageUpload
                selectedImage={selectedImage}
                previewUrl={previewUrl}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
              />
            </div>

            {/* Video Player */}
            <div className="video-section">
              <VideoPlayer
                stream={streamState.videoStream}
                isConnected={streamState.isConnected && streamState.isActive}
                connectionStatus={streamState.status}
                onVideoReady={() => setIsVideoReady(true)}
                className="main-video-player"
                isStreamActive={streamState.isConnected && streamState.isActive && streamState.videoStream}
              />
            </div>
          </div>
        </div>

        {/* Block 2: Stream Controls */}
        <div className="block-2">
          <div className="stream-controls">
            <div className="controls-header">
              <h2>Инструменты управления стримом</h2>
            </div>
            
            <div className="controls-row">
              {/* Кнопка создания стрима */}
              <div className="control-item create-stream-item">
                <CreateStreamButton
                  selectedImage={selectedImage}
                  selectedVoice={selectedVoice}
                  isCreating={streamState.isCreating}
                  isStreamActive={streamState.isConnected && streamState.isActive}
                  onCreateStream={handleCreateStream}
                  onCloseStream={handleCloseStream}
                />
              </div>

              {/* Выбор голоса */}
              <div className="control-item voice-item">
                <label>Голос:</label>
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  voices={voices}
                  loadingVoices={loadingVoices}
                  voicesError={voicesError}
                  isPlaying={isPlaying}
                  onVoiceChange={handleVoiceChange}
                  onPlayVoice={handlePlayVoice}
                  onRetryVoices={retryFetchVoices}
                />
              </div>

              {/* Микрофон */}
              <div className="control-item microphone-item">
                <label>Микрофон:</label>
                <MicrophoneInput
                  ref={microphoneRef}
                  voiceId={selectedVoice}
                  voiceName={voices.find(v => v.voice_id === selectedVoice)?.name}
                  onAudioReceived={handleAudioReceived}
                  onError={handleMicrophoneError}
                  onStatusChange={handleMicrophoneStatusChange}
                  autoPlay={true}
                  autoInitialize={false}
                  chunkDuration={2000}
                />
              </div>

              {/* Статус микрофона */}
              {microphoneStatus !== 'idle' && (
                <div className="control-item status-item">
                  <span className="status-label">Статус:</span>
                  <span className={`status-value ${microphoneStatus}`}>
                    {microphoneStatus}
                  </span>
                  {processedAudio && (
                    <span className="audio-info">
                      ({processedAudio.size} байт)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Block 3: Other Sections */}
        <div className="block-3">
          {/* Статус стрима */}
          {streamState.status !== 'idle' && (
            <div className="section">
              <h2>Статус стрима</h2>
              <div className={`stream-status ${streamState.status}`}>
                <p><strong>Статус:</strong> {streamState.status}</p>
                {streamState.streamId && (
                  <p><strong>Stream ID:</strong> {streamState.streamId}</p>
                )}
                {streamState.error && (
                  <p className="error"><strong>Ошибка:</strong> {streamState.error}</p>
                )}
                {streamState.isConnected && (
                  <button 
                    className="btn btn-secondary"
                    onClick={handleCloseStream}
                  >
                    Закрыть стрим
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Testing Panel Section */}
          <div className="section">
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
              <DIdStreamingTester />
            )}
          </div>

          <div className="section">
            <h2>Добро пожаловать</h2>
            <p>Это приложение для создания интерактивных видео-стримов с использованием D-ID API и ElevenLabs.</p>
          </div>

          <StatusGrid />
          <Features />
          <Technologies />
        </div>
      </div>
    </div>
  );
}

export default App;
