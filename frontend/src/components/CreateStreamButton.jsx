import React from 'react';

const CreateStreamButton = ({ 
  selectedImage, 
  selectedVoice, 
  isCreating, 
  onCreateStream 
}) => {
  const isDisabled = !selectedVoice || isCreating;

  return (
    <div className="section">
      <h2>Создать стрим</h2>
      <p className="text-muted mb-3">
        Нажмите кнопку ниже, чтобы создать интерактивный видео-стрим с выбранным голосом. 
        {!selectedImage && ' Будет использовано изображение по умолчанию.'}
      </p>
      
      <button 
        className={`btn btn-primary ${isCreating ? 'creating' : ''}`}
        onClick={onCreateStream}
        disabled={isDisabled}
      >
        {isCreating ? (
          <>
            <span className="loading-spinner">⏳</span>
            Создание стрима...
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
    </div>
  );
};

export default CreateStreamButton;
