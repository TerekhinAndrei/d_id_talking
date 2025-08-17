import React, { useState, useRef, useEffect } from 'react';
import { useDIdStreaming } from '../hooks/useDIdStreaming';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api/ApiService';

interface DIdStreamingTesterProps {
  onBack?: () => void;
}

const DIdStreamingTester: React.FC<DIdStreamingTesterProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testText, setTestText] = useState('Hello! This is a test message from D-ID streaming.');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { avatarImageUrl, avatarImage, setAvatarImageUrl } = useAppContext();
  const {
    status,
    videoStream,
    createStream,
    startStream,
    createTalkWithText,
    createTalkWithAudio,
    closeStream,
    isConnected,
    isCreating,
    isStarting,
    isTalking,
    hasError,
    error
  } = useDIdStreaming();

  // Добавление логов
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Загрузка изображения в D-ID
  const handleUploadToDId = async () => {
    console.log('🔍 handleUploadToDId called');
    addLog('🔍 handleUploadToDId called');
    
    if (!avatarImage) {
      addLog('❌ No image selected for upload');
      console.log('❌ No avatarImage');
      return;
    }

    addLog(`📁 Uploading file: ${avatarImage.name} (${avatarImage.size} bytes)`);
    addLog('📤 Uploading image to D-ID...');
    
    try {
      console.log('🔍 Calling apiService.uploadImageToDId...');
      const response = await apiService.uploadImageToDId(avatarImage);
      console.log('🔍 Upload response:', response);
      
      if (response.success && response.data?.url) {
        const dIdUrl = response.data.url;
        const dIdFileId = response.data.file_id;
        
        setUploadedImageUrl(dIdUrl);
        setAvatarImageUrl(dIdUrl); // Устанавливаем в контекст
        setUploadedFileId(dIdFileId); // Сохраняем file_id
        addLog(`✅ Image uploaded to D-ID: ${dIdUrl}`);
        addLog(`📋 File ID: ${dIdFileId}`);
        console.log('✅ Upload successful, URL set:', dIdUrl);
        console.log('📋 File ID:', dIdFileId);
        
        // Детальное логирование ответа
        addLog(`📋 Full response data: ${JSON.stringify(response.data)}`);
        console.log('📋 Full response data:', response.data);
      } else {
        addLog('❌ Failed to upload image to D-ID');
        addLog(`📋 Response: ${JSON.stringify(response)}`);
        console.log('❌ Upload failed:', response);
      }
    } catch (error) {
      addLog(`❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Upload error:', error);
    }
  };

  // Выбор файла для загрузки
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addLog(`📁 Selected file: ${file.name}`);
      // Здесь можно добавить логику для обновления контекста
    }
  };

  // Подключение видео потока к элементу
  useEffect(() => {
    if (videoRef.current && videoStream.stream) {
      videoRef.current.srcObject = videoStream.stream;
      addLog('🎬 Video stream connected to player');
    }
  }, [videoStream.stream]);

  // Логирование изменений статуса
  useEffect(() => {
    addLog(`📊 Status changed: ${status.step}`);
    if (error) {
      addLog(`❌ Error: ${error}`);
    }
  }, [status.step, error]);

  // Создание стрима
  const handleCreateStream = async () => {
    console.log('🔍 handleCreateStream called');
    addLog('🔍 handleCreateStream called');
    
    console.log('🔍 avatarImage:', avatarImage);
    console.log('🔍 avatarImageUrl:', avatarImageUrl);
    console.log('🔍 uploadedImageUrl:', uploadedImageUrl);
    console.log('🔍 uploadedFileId:', uploadedFileId);
    
    // Пробуем использовать file_id если доступен, иначе URL
    let imageUrlToUse = uploadedImageUrl || avatarImageUrl;
    
    if (uploadedImageUrl) {
      // Всегда используем S3 URL от D-ID если он доступен
      imageUrlToUse = uploadedImageUrl;
      addLog(`🔍 Using S3 URL from D-ID: ${imageUrlToUse}`);
    } else if (avatarImageUrl) {
      // Fallback на avatarImageUrl если нет загруженного URL
      imageUrlToUse = avatarImageUrl;
      addLog(`🔍 Using fallback URL: ${imageUrlToUse}`);
    }
    
    console.log('🔍 imageUrlToUse:', imageUrlToUse);
    
    if (!imageUrlToUse) {
      addLog('❌ No image URL available');
      addLog('💡 Tip: Upload image to D-ID first using the upload button');
      return;
    }
    
    addLog(`🖼️ Using image URL: ${imageUrlToUse}`);
    
    // Проверяем, что URL валидный и публичный
    try {
      if (imageUrlToUse.startsWith('img_')) {
        addLog('✅ Using D-ID file ID');
        addLog(`🔗 D-ID File ID: ${imageUrlToUse}`);
      } else if (imageUrlToUse.startsWith('s3://')) {
        addLog('✅ Using S3 URL from D-ID');
        addLog(`🔗 S3 Path: ${imageUrlToUse}`);
      } else {
        const url = new URL(imageUrlToUse);
        addLog('✅ Image URL is valid');
        
        // Проверяем, что это HTTP/HTTPS URL
        if (!url.protocol.startsWith('http')) {
          addLog('❌ URL must be HTTP/HTTPS, S3, or D-ID file ID');
          addLog('💡 Tip: Upload image to D-ID first, then use the returned URL');
          return;
        }
        
        addLog(`🌐 Protocol: ${url.protocol}`);
        addLog(`🔗 Host: ${url.host}`);
      }
      
    } catch (error) {
      addLog('❌ Invalid image URL - must be a public URL');
      addLog('💡 Tip: Upload image to D-ID first, then use the returned URL');
      return;
    }
    
    addLog('🚀 Creating stream...');
    addLog(`📤 Sending request to: /api/v1/streaming/start`);
    addLog(`📋 Request data: ${JSON.stringify({ image_url: imageUrlToUse, presenter_id: undefined })}`);
    
    console.log('🔍 Calling createStream with:', imageUrlToUse);
    addLog('🔍 Calling createStream...');
    
    try {
      const success = await createStream(imageUrlToUse, 'Test stream from frontend');
      console.log('🔍 createStream result:', success);
      addLog(`🔍 createStream result: ${success}`);
      
      if (success) {
        addLog('✅ Stream created successfully');
      } else {
        addLog('❌ Failed to create stream');
      }
    } catch (error) {
      console.log('🔍 createStream error:', error);
      addLog(`❌ createStream error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Запуск стрима
  const handleStartStream = async () => {
    addLog('🔗 Starting stream...');
    const success = await startStream();
    if (success) {
      addLog('✅ Stream started successfully');
    } else {
      addLog('❌ Failed to start stream');
    }
  };

  // Создание talk с текстом
  const handleCreateTalkText = async () => {
    addLog('🎤 Creating talk with text...');
    const success = await createTalkWithText(testText);
    if (success) {
      addLog('✅ Talk created successfully');
    } else {
      addLog('❌ Failed to create talk');
    }
  };

  // Закрытие стрима
  const handleCloseStream = async () => {
    addLog('🔚 Closing stream...');
    const success = await closeStream();
    if (success) {
      addLog('✅ Stream closed successfully');
    } else {
      addLog('❌ Failed to close stream');
    }
  };

  // Очистка логов
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="container mx-auto">
        {/* Заголовок с кнопкой возврата */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">D-ID Streaming Tester</h1>
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-outline"
            >
              ← Back to Main
            </button>
          )}
        </div>
        
        {/* Статус */}
        <div className="bg-secondary rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted">Step:</span>
              <span className="ml-2 text-white">{status.step}</span>
            </div>
            <div>
              <span className="text-muted">Connected:</span>
              <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            {status.streamId && (
              <div>
                <span className="text-muted">Stream ID:</span>
                <span className="ml-2 text-white text-xs">{status.streamId}</span>
              </div>
            )}
            {status.sessionId && (
              <div>
                <span className="text-muted">Session ID:</span>
                <span className="ml-2 text-white text-xs">{status.sessionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Управление */}
        <div className="bg-secondary rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>
          
          {/* Загрузка изображения */}
          <div className="mb-4 p-3 bg-bg-primary rounded">
            <h3 className="text-white text-sm mb-2">Image Upload</h3>
            <div className="flex gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm btn-outline"
              >
                📁 Select Image
              </button>
              <button
                onClick={handleUploadToDId}
                disabled={!avatarImage}
                className="btn btn-sm btn-primary disabled:opacity-50"
              >
                📤 Upload to D-ID
              </button>
              <button
                onClick={() => {
                  addLog(`🔍 Current avatarImage: ${avatarImage ? avatarImage.name : 'null'}`);
                  addLog(`🔍 Current avatarImageUrl: ${avatarImageUrl || 'null'}`);
                  addLog(`🔍 Current uploadedImageUrl: ${uploadedImageUrl || 'null'}`);
                  addLog(`🔍 Current uploadedFileId: ${uploadedFileId || 'null'}`);
                }}
                className="btn btn-sm btn-outline"
              >
                🔍 Debug Info
              </button>
            </div>
            {uploadedImageUrl && (
              <div className="text-xs text-green-400">
                ✅ Uploaded: {uploadedImageUrl.substring(0, 50)}...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={handleCreateStream}
              disabled={isCreating || (!uploadedImageUrl && !avatarImageUrl)}
              className="btn btn-primary disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Stream'}
            </button>
            
            <button
              onClick={handleStartStream}
              disabled={isStarting || status.step === 'idle'}
              className="btn btn-primary disabled:opacity-50"
            >
              {isStarting ? 'Starting...' : 'Start Stream'}
            </button>
          </div>

          {/* Debug info for button state */}
          <div className="text-xs text-muted mb-2">
            <div>isCreating: {isCreating.toString()}</div>
            <div>uploadedImageUrl: {uploadedImageUrl ? 'yes' : 'no'}</div>
            <div>avatarImageUrl: {avatarImageUrl ? 'yes' : 'no'}</div>
            <div>Button disabled: {(isCreating || (!uploadedImageUrl && !avatarImageUrl)).toString()}</div>
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Test Text:</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-2 bg-bg-primary border border-border-primary rounded text-white"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreateTalkText}
              disabled={!isConnected || isTalking}
              className="btn btn-accent disabled:opacity-50"
            >
              {isTalking ? 'Talking...' : 'Talk with Text'}
            </button>
            
            <button
              onClick={handleCloseStream}
              disabled={status.step === 'idle'}
              className="btn btn-danger disabled:opacity-50"
            >
              Close Stream
            </button>
          </div>
        </div>

        {/* Видео плеер */}
        <div className="bg-secondary rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Video Player</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-black rounded"
          />
        </div>

        {/* Логи */}
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Logs</h2>
            <button
              onClick={clearLogs}
              className="btn btn-sm btn-outline"
            >
              Clear
            </button>
          </div>
          <div className="bg-bg-primary rounded p-3 h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted text-sm">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs text-white mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DIdStreamingTester;
