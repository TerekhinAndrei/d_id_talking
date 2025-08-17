import React, { useState, useRef } from 'react';
import { useDIdVideoTalks } from '../hooks/useDIdVideoTalks';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const DIdVideoTalksDemo: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState('Привет! Это тестовое сообщение для D-ID Talks API.');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    isCreating,
    isMonitoring,
    error,
    currentTalkId,
    currentStatus,
    videoUrl,
    createAndMonitorVideoTalkWithText,
    createAndMonitorVideoTalkWithAudio,
    createAndMonitorVideoTalkWithFiles,
    cancelVideoTalk,
    reset,
    isCompleted,
    isFailed
  } = useDIdVideoTalks({
    onStatusUpdate: (status, data) => {
      console.log('Status update:', status, data);
    },
    onSuccess: (result) => {
      console.log('Talk completed successfully:', result);
    },
    onError: (error) => {
      console.error('Talk error:', error);
    }
  });

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateTalkWithText = async () => {
    if (!imageUrl) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    try {
      await createAndMonitorVideoTalkWithText(imageUrl, text, {
        voiceId: 'en-US-JennyNeural'
      });
    } catch (error) {
      console.error('Error creating video talk with text:', error);
    }
  };

  const handleCreateTalkWithAudio = async () => {
    if (!imageUrl || !audioUrl) {
      alert('Пожалуйста, выберите изображение и аудио файл');
      return;
    }

    try {
      await createAndMonitorVideoTalkWithAudio(imageUrl, audioUrl);
    } catch (error) {
      console.error('Error creating video talk with audio:', error);
    }
  };

  const handleCreateTalkWithFiles = async () => {
    if (!imageFile || !audioFile) {
      alert('Пожалуйста, выберите изображение и аудио файл');
      return;
    }

    try {
      await createAndMonitorVideoTalkWithFiles(imageFile, audioFile);
    } catch (error) {
      console.error('Error creating video talk with files:', error);
    }
  };

  const handleCancel = async () => {
    if (currentTalkId) {
      try {
        await cancelVideoTalk(currentTalkId);
      } catch (error) {
        console.error('Error cancelling video talk:', error);
      }
    }
  };

  const handleReset = () => {
    reset();
    setImageFile(null);
    setAudioFile(null);
    setImageUrl('');
    setAudioUrl('');
    setText('Привет! Это тестовое сообщение для D-ID Talks API.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">🎬 D-ID Video Talks API Demo</h1>

      {/* Статус */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">📊 Статус</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Состояние:</span>
            <div className="flex items-center gap-2">
              {isLoading && <span className="text-blue-500">⏳ Загрузка...</span>}
              {isCreating && <span className="text-yellow-500">🎬 Создание...</span>}
              {isMonitoring && <span className="text-green-500">👀 Мониторинг...</span>}
              {isCompleted && <span className="text-green-600">✅ Завершено</span>}
              {isFailed && <span className="text-red-600">❌ Ошибка</span>}
              {!isLoading && !isCreating && !isMonitoring && !isCompleted && !isFailed && (
                <span className="text-gray-500">⏸️ Ожидание</span>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium">Talk ID:</span>
            <div className="font-mono text-xs break-all">{currentTalkId || '—'}</div>
          </div>
          <div>
            <span className="font-medium">Статус:</span>
            <div className="capitalize">{currentStatus || '—'}</div>
          </div>
          <div>
            <span className="font-medium">Ошибка:</span>
            <div className="text-red-500 text-xs">{error || '—'}</div>
          </div>
        </div>
      </Card>

      {/* Ввод данных */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Изображение */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">🖼️ Изображение</h3>
          <div className="space-y-4">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imageUrl && (
              <div className="mt-4">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Аудио */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">🎵 Аудио</h3>
          <div className="space-y-4">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {audioUrl && (
              <div className="mt-4">
                <audio controls className="w-full">
                  <source src={audioUrl} />
                  Ваш браузер не поддерживает аудио.
                </audio>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Текст */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">📝 Текст</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите текст для озвучивания..."
          className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </Card>

      {/* Кнопки действий */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">🎬 Действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleCreateTalkWithText}
            disabled={!imageUrl || isLoading}
            loading={isCreating}
            className="w-full"
          >
            🎬 Создать с текстом
          </Button>
          
          <Button
            onClick={handleCreateTalkWithAudio}
            disabled={!imageUrl || !audioUrl || isLoading}
            loading={isCreating}
            className="w-full"
          >
            🎵 Создать с аудио URL
          </Button>
          
          <Button
            onClick={handleCreateTalkWithFiles}
            disabled={!imageFile || !audioFile || isLoading}
            loading={isCreating}
            className="w-full"
          >
            📁 Создать с файлами
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Button
            onClick={handleCancel}
            disabled={!currentTalkId || isLoading}
            variant="secondary"
            className="w-full"
          >
            ❌ Отменить
          </Button>
          
          <Button
            onClick={handleReset}
            variant="ghost"
            className="w-full"
          >
            🔄 Сбросить
          </Button>
        </div>
      </Card>

      {/* Результат */}
      {videoUrl && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">🎥 Результат</h3>
          <div className="space-y-4">
            <video 
              controls 
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
              autoPlay
              muted
            >
              <source src={videoUrl} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
            
            <div className="text-center">
              <a
                href={videoUrl}
                download="d-id-talk.mp4"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Скачать видео
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
