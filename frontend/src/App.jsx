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
import VoiceChanger from './components/VoiceChanger';

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
  const [showVoiceChanger, setShowVoiceChanger] = useState(false);
  
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
      console.log('🚀 Начинаем полный флоу D-ID стриминга');
      
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
      
      // Step 1: Create stream
      console.log('📸 Создание стрима с изображением:', imageUrl);
      const streamResult = await createStream(imageUrl);
      console.log('📥 Результат создания стрима:', streamResult);
      
      if (!streamResult.success) {
        throw new Error('Не удалось создать стрим');
      }
      
      console.log('✅ Стрим создан:', streamResult.streamId);
      
      // Step 2: Start stream (simplified SDP answer)
      console.log('🔗 Запуск стрима');
      const sdpAnswer = streamResult.sdpOffer.replace(/a=sendonly/g, 'a=recvonly');
      const startResult = await startStream(sdpAnswer, streamResult.streamId, streamResult.sessionId);
      
      if (!startResult.success) {
        throw new Error('Не удалось запустить стрим');
      }
      
      console.log('✅ Стрим запущен');
      
      // Use updated session ID from start result
      const currentSessionId = startResult.sessionId || streamResult.sessionId;
      
      // Step 3: Submit ICE candidate (simplified)
      console.log('🌐 Отправка ICE candidate');
      const iceResult = await submitIceCandidate(
        'candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host',
        '0',
        0,
        streamResult.streamId,
        currentSessionId
      );
      
      if (!iceResult.success) {
        console.warn('⚠️ ICE candidate не отправлен, но продолжаем');
      } else {
        console.log('✅ ICE candidate отправлен');
      }
      
      // Use latest session ID
      const latestSessionId = (iceResult && iceResult.sessionId) || currentSessionId;
      
      // Step 4: Create talk stream
      console.log('🎤 Создание talk стрима');
      
      // Use audio script format like in the working test panel
      const audioScript = {
        type: "audio",
        audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
      };
      
      const talkResult = await createTalk(audioScript, selectedVoice, streamResult.streamId, latestSessionId);
      
      if (!talkResult.success) {
        throw new Error('Не удалось создать talk стрим');
      }
      
      console.log('✅ Talk стрим создан:', talkResult.talk_id || talkResult.talkId);
      console.log('✅ Полный процесс D-ID стриминга завершен успешно!');
      
      // Initialize microphone after successful stream creation
      if (microphoneRef.current) {
        console.log('🎤 Инициализируем микрофон для стриминга...');
        try {
          await microphoneRef.current.startMicrophone();
          console.log('✅ Микрофон инициализирован и готов к стримингу');
        } catch (error) {
          console.warn('⚠️ Не удалось инициализировать микрофон:', error);
        }
      }
      
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
      // Reset state after some time
      setTimeout(() => {
        resetState();
      }, 5000);
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
    } catch (error) {
      console.error('❌ Ошибка закрытия стрима:', error);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <Header />

        <main className="main-layout">
          {/* Left Panel - Controls */}
          <div className="control-panel">
            {/* Секция выбора изображения */}
            <div className="section">
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

            {/* Выбор голоса */}
            <div className="section">
              <h2>Выбор голоса</h2>
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

            {/* Микрофон для реального времени стриминга */}
            <div className="section">
              <h2>Голосовой стриминг</h2>
              <MicrophoneInput
                ref={microphoneRef}
                voiceId={selectedVoice}
                voiceName={voices.find(v => v.voice_id === selectedVoice)?.name}
                onAudioReceived={handleAudioReceived}
                onError={handleMicrophoneError}
                onStatusChange={handleMicrophoneStatusChange}
                autoPlay={true}
                autoInitialize={false} // Отключаем автоматическую инициализацию
                chunkDuration={2000}
              />
              {microphoneStatus !== 'idle' && (
                <div className="mic-status-info">
                  <p><strong>Статус микрофона:</strong> {microphoneStatus}</p>
                  {processedAudio && (
                    <p><strong>Последнее аудио:</strong> {processedAudio.size} байт</p>
                  )}
                </div>
              )}
            </div>

            {/* Кнопка создания стрима */}
            <CreateStreamButton
              selectedImage={selectedImage}
              selectedVoice={selectedVoice}
              isCreating={streamState.isCreating}
              onCreateStream={handleCreateStream}
            />

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
          </div>

          {/* Right Panel - Video Player */}
          <div className="video-panel">
            <VideoPlayer
              stream={videoStream}
              isConnected={streamState.isConnected}
              connectionStatus={streamState.status}
              onVideoReady={() => setIsVideoReady(true)}
              className="main-video-player"
              isStreamActive={streamState.isConnected && videoStream}
            />
          </div>
        </main>

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
              
              <button 
                className="toggle-tester-btn"
                onClick={() => setShowVoiceChanger(!showVoiceChanger)}
              >
                {showVoiceChanger ? 'Скрыть' : 'Показать'} Voice Changer
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
          
          {showVoiceChanger && (
            <VoiceChanger />
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
  );
}

export default App;
