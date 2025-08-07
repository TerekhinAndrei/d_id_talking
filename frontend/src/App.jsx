import React, { useState } from 'react';
import './App.css';

// Components
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import VoiceSelector from './components/VoiceSelector';
import CreateStreamButton from './components/CreateStreamButton';
import Features from './components/Features';
import Technologies from './components/Technologies';
import StatusGrid from './components/StatusGrid';
import ElevenLabsTester from './components/ElevenLabsTester';

// Hooks
import { useVoices } from './hooks/useVoices';
import { useDIdStreaming } from './hooks/useDIdStreaming';

// Constants
import { DEFAULT_AVATAR_URL } from './constants';

// Services
import { apiService } from './services/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR_URL);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showElevenLabsTester, setShowElevenLabsTester] = useState(false);

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

  const handleCreateStream = async () => {
    if (!selectedVoice) {
      alert('Сначала выберите голос');
      return;
    }

    try {
      console.log('🚀 Начинаем полный флоу D-ID стриминга');
      
      // Используем загруженное изображение или изображение по умолчанию
      const imageUrl = selectedImage ? previewUrl : DEFAULT_AVATAR_URL;
      console.log('📸 Используем изображение:', selectedImage ? 'загруженное пользователем' : 'по умолчанию');
      
      // Step 1: Create stream
      console.log('📸 Создание стрима с изображением');
      const streamResult = await createStream(imageUrl);
      
      if (!streamResult.success) {
        throw new Error('Не удалось создать стрим');
      }
      
      console.log('✅ Стрим создан:', streamResult.streamId);
      
      // Step 2: Start stream (simplified SDP answer)
      console.log('🔗 Запуск стрима');
      const sdpAnswer = streamResult.sdpOffer.replace(/a=sendonly/g, 'a=recvonly');
      const startResult = await startStream(sdpAnswer);
      
      if (!startResult.success) {
        throw new Error('Не удалось запустить стрим');
      }
      
      console.log('✅ Стрим запущен');
      
      // Step 3: Submit ICE candidate (simplified)
      console.log('🌐 Отправка ICE candidate');
      const iceResult = await submitIceCandidate(
        'candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host',
        '0',
        0
      );
      
      if (!iceResult.success) {
        console.warn('⚠️ ICE candidate не отправлен, но продолжаем');
      } else {
        console.log('✅ ICE candidate отправлен');
      }
      
      // Step 4: Create talk stream
      console.log('🎤 Создание talk стрима');
      const talkText = "Привет! Это тестовый стрим с D-ID API.";
      const talkResult = await createTalk(talkText, selectedVoice);
      
      if (!talkResult.success) {
        throw new Error('Не удалось создать talk стрим');
      }
      
      console.log('✅ Talk стрим создан:', talkResult.talkId);
      
      // Success message
      const imageInfo = selectedImage ? 'с загруженным изображением' : 'с изображением по умолчанию';
      alert(`🎉 Стрим успешно создан ${imageInfo}!\n\nСтатус: ${talkResult.status}\nTalk ID: ${talkResult.talkId}\n\nСтрим готов к воспроизведению!`);
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error);
      alert(`Ошибка при создании стрима: ${error.message}`);
    } finally {
      // Reset state after some time
      setTimeout(() => {
        resetState();
      }, 5000);
    }
  };

  const handleCloseStream = async () => {
    try {
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

        <main>
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

          {/* Секция выбора голоса */}
          <div className="section">
            <h2>Голос</h2>
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

          {/* ElevenLabs Tester Section */}
          <div className="section">
            <div className="section-header">
              <h2>ElevenLabs API Тестирование</h2>
              <button 
                className="toggle-tester-btn"
                onClick={() => setShowElevenLabsTester(!showElevenLabsTester)}
              >
                {showElevenLabsTester ? 'Скрыть' : 'Показать'} Тестер
              </button>
            </div>
            
            {showElevenLabsTester && (
              <ElevenLabsTester />
            )}
          </div>

          <div className="section">
            <h2>Добро пожаловать</h2>
            <p>Это приложение для создания интерактивных видео-стримов с использованием D-ID API и ElevenLabs.</p>
          </div>

          <StatusGrid />
          <Features />
          <Technologies />
        </main>
      </div>
    </div>
  );
}

export default App;
