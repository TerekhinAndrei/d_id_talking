import React from 'react';

const CreateStreamButton = ({ 
  selectedImage, 
  selectedVoice, 
  isCreating, 
  isStreamActive,
  hasAudioTrack,
  onCreateStream,
  onCloseStream
}) => {
  console.log('🔘 CreateStreamButton props:', {
    isCreating,
    isStreamActive,
    hasSelectedVoice: !!selectedVoice,
    hasAudioTrack
  });
  
  const isDisabled = !selectedVoice || isCreating;

  return (
    <div className="section">
      <h2>Создать стрим</h2>
      <p className="text-muted mb-3">
        Нажмите кнопку ниже, чтобы создать интерактивный видео-стрим с выбранным голосом. 
        {!selectedImage && ' Будет использовано изображение по умолчанию.'}
        {isStreamActive && hasAudioTrack && ' 🎤 Микрофон активен - говорите!'}
      </p>
      
      <button 
        className={`btn ${isStreamActive ? 'btn-danger' : 'btn-primary'} ${isCreating ? 'creating' : ''}`}
        onClick={isStreamActive ? onCloseStream : onCreateStream}
        disabled={isDisabled && !isStreamActive}
      >
        {isCreating ? (
          <>
            <span className="loading-spinner">⏳</span>
            Создание стрима...
          </>
        ) : isStreamActive ? (
          <>
            {hasAudioTrack && <span className="audio-indicator">🎤</span>}
            Остановить стрим
          </>
        ) : (
          'Создать стрим'
        )}
      </button>
      
      {!selectedVoice && (
        <p className="text-muted mt-2">
          ⚠️ Сначала выберите голос
        </p>
      )}
      
      {!selectedImage && selectedVoice && (
        <p className="text-muted mt-2">
          ℹ️ Будет использовано изображение по умолчанию
        </p>
      )}
      
      {isStreamActive && hasAudioTrack && (
        <p className="text-success mt-2">
          🎤 Микрофон активен - ваш голос передается в D-ID
        </p>
      )}
    </div>
  );
};

export default CreateStreamButton;
