import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer';
import ElevenLabsTester from './components/ElevenLabsTester';
import DIdStreamingTester from './components/DIdStreamingTester';
import FileStorageTester from './components/FileStorageTester';


// Hooks
import { useVoices } from './hooks/useVoices';
import { useDIdStreaming } from './hooks/useDIdStreaming';
import { useElevenLabsDidBridge } from './hooks/useElevenLabsDidBridge';
import { useVoiceToAvatar } from './hooks/useVoiceToAvatar';
import { useImageDimensions } from './hooks/useImageDimensions';

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
  const [showFileStorageTester, setShowFileStorageTester] = useState(false);

  
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

  // Voice to Avatar hook for main video player
  const {
    streamState: voiceStreamState,
    setupStream: setupVoiceStream,
    startVoiceToAvatar,
    stopVoiceToAvatar,
    closeStream: closeVoiceStream,
    reset: resetVoiceStream,
    logs: voiceLogs
  } = useVoiceToAvatar('main-video-player', uploadedImageUrl || DEFAULT_AVATAR_URL);

  // Image dimensions hook
  const { dimensions: imageDimensions, isLoading: imageDimensionsLoading } = useImageDimensions(previewUrl);

  // Upload default avatar to D-ID on component mount
  const [defaultAvatarLoaded, setDefaultAvatarLoaded] = useState(false);
  
  useEffect(() => {
    const uploadDefaultAvatar = async () => {
      try {
        console.log('🚀 Uploading default avatar to D-ID...');
        
        // Fetch the default avatar file
        const response = await fetch('/default_avatar.jpg');
        const blob = await response.blob();
        const file = new File([blob], 'default_avatar.jpg', { type: 'image/jpeg' });
        
        // Upload to D-ID using existing file service
        const result = await fileService.uploadImage(file);
        
        if (result && result.data?.url) {
          const dIdAvatarUrl = result.data.url;
          console.log('✅ Default avatar uploaded to D-ID:', dIdAvatarUrl);
          
          // For D-ID streaming, we should use the URL returned by D-ID
          console.log('🔗 Using D-ID URL for streaming:', dIdAvatarUrl);
          
          // Keep preview URL as local for display, but use D-ID URL for streaming
          setPreviewUrl(DEFAULT_AVATAR_URL); // Local URL for display
          setUploadedImageUrl(dIdAvatarUrl); // D-ID URL for streaming
          // Mark as loaded so streaming can proceed
          setDefaultAvatarLoaded(true);
          
        } else {
          console.warn('⚠️ Failed to upload default avatar to D-ID, using local fallback');
          setDefaultAvatarLoaded(true);
        }
      } catch (error) {
        console.error('❌ Error uploading default avatar:', error);
        setDefaultAvatarLoaded(true);
      }
    };
    
    uploadDefaultAvatar();
  }, []);

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
    const imageUrl = result.data?.url || result.data?.secure_url;
    setUploadedImageUrl(imageUrl);
    setPreviewUrl(imageUrl); // Обновляем превью с загруженным изображением
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
      console.log('🚀 Начинаем флоу Voice to Avatar стриминга');
      

      
      // Используем новый хук для автоматической настройки стрима
      console.log('🎬 Запуск автоматической настройки стрима...');
      
      // Определяем URL изображения для стрима
      let streamImageUrl;
      if (selectedImage) {
        // Используем загруженное изображение
        const uploadResult = await fileService.uploadImage(selectedImage);
        streamImageUrl = uploadResult.data?.url || uploadResult.data?.secure_url;
        setUploadedImageUrl(streamImageUrl);
      } else {
        // Используем дефолтное или уже загруженное изображение
        streamImageUrl = uploadedImageUrl || DEFAULT_AVATAR_URL;
      }
      
      const success = await setupVoiceStream(selectedVoice, uploadedImageUrl || streamImageUrl);
      
      if (success) {
        console.log('✅ Voice to Avatar стрим успешно настроен!');
        console.log('🎤 Говорите в микрофон - аватар будет анимироваться с вашим голосом');
        
        // Force video re-render
        setIsVideoReady(true);
      } else {
        throw new Error('Не удалось настроить Voice to Avatar стрим');
      }
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error);
    } finally {
      setIsCreating(false);
      console.log('✅ Stream creation completed');
    }
  };

  const handleCloseStream = async () => {
    try {
      // Останавливаем мост до закрытия стрима
      try { bridge.stop(); } catch (_) {}
      
      // Закрываем Voice to Avatar стрим
      await closeVoiceStream();
      console.log('✅ Voice to Avatar стрим закрыт');
      
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
            stream={voiceStreamState.peerConnection ? (() => {
              // Получаем все треки из peerConnection
              const receivers = voiceStreamState.peerConnection.getReceivers();
              
              // Создаем новый MediaStream из всех треков
              const tracks = receivers
                .map(r => r.track)
                .filter(track => track !== null);
              
              if (tracks.length > 0) {
                const stream = new MediaStream(tracks);
                return stream;
              }
              
              return null;
            })() : null}
            isConnected={voiceStreamState.isConnected}
            connectionStatus={voiceStreamState.status}
            onVideoReady={() => setIsVideoReady(true)}
            className="main-video-player"
            isStreamActive={voiceStreamState.isConnected && voiceStreamState.status === 'connected'}
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
            hasAudioTrack={voiceStreamState.peerConnection ? !!voiceStreamState.peerConnection.getReceivers().find(r => r.track?.kind === 'audio')?.track : false}
            onCreateStream={handleCreateStream}
            onCloseStream={handleCloseStream}
            // Image dimensions
            imageDimensions={imageDimensions}
            imageDimensionsLoading={imageDimensionsLoading}
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
              
              <button 
                className="toggle-tester-btn"
                onClick={() => setShowFileStorageTester(!showFileStorageTester)}
              >
                {showFileStorageTester ? 'Скрыть' : 'Показать'} File Storage Тестер
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
          
          {showFileStorageTester && (
            <FileStorageTester />
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;
