import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button 
          className="btn btn-primary mt-2"
          onClick={onRetry}
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
