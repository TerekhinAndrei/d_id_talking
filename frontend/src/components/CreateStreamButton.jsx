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
        'Остановить стрим'
      ) : (
        'Создать стрим'
      )}
    </button>
  );
};

export default CreateStreamButton;
