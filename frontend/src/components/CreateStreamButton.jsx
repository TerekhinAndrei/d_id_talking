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
    <button 
      className={`btn ${isStreamActive ? 'btn-danger' : 'btn-primary'} ${isCreating ? 'creating' : ''}`}
      onClick={isStreamActive ? onCloseStream : onCreateStream}
      disabled={isDisabled && !isStreamActive}
    >
      {isCreating ? (
        <>
          <span className="loading-spinner">⏳</span>
          Создание...
        </>
      ) : isStreamActive ? (
        <>
          {hasAudioTrack && <span className="audio-indicator">🎤</span>}
          Остановить
        </>
      ) : (
        'Создать стрим'
      )}
    </button>
  );
};

export default CreateStreamButton;
