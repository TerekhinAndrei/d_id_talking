import React from 'react';

const CreateStreamButton = ({ 
  selectedImage, 
  selectedVoice, 
  isCreating, 
  isStreamActive,
  onCreateStream,
  onCloseStream
}) => {
  console.log('🔘 CreateStreamButton props:', {
    isCreating,
    isStreamActive,
    hasSelectedVoice: !!selectedVoice
  });
  
  const isDisabled = !selectedVoice || isCreating;

  return (
    <div className="section">
      <h2>Создать стрим</h2>
      <p className="text-muted mb-3">
        Нажмите кнопку ниже, чтобы создать интерактивный видео-стрим с выбранным голосом. 
        {!selectedImage && ' Будет использовано изображение по умолчанию.'}
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
          'Остановить стрим'
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
    </div>
  );
};

export default CreateStreamButton;
