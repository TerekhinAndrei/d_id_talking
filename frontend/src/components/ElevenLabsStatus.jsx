import React, { useState, useEffect } from 'react';
import { useElevenLabs } from '../hooks/useElevenLabs';

const ElevenLabsStatus = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const { testAuth, error, clearState } = useElevenLabs();

  const checkAuthStatus = async () => {
    try {
      setIsChecking(true);
      clearState();

      const response = await testAuth();
      
      setAuthStatus({
        success: response.success,
        message: response.message,
        data: response.data
      });
      
      setLastChecked(new Date());
    } catch (error) {
      setAuthStatus({
        success: false,
        message: error.message,
        data: null
      });
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check auth status on component mount
    checkAuthStatus();
  }, []);

  const getStatusIcon = () => {
    if (isChecking) return '⏳';
    if (!authStatus) return '❓';
    return authStatus.success ? '✅' : '❌';
  };

  const getStatusColor = () => {
    if (isChecking) return '#ffc107';
    if (!authStatus) return '#6c757d';
    return authStatus.success ? '#28a745' : '#dc3545';
  };

  const getStatusText = () => {
    if (isChecking) return 'Проверка...';
    if (!authStatus) return 'Не проверено';
    return authStatus.success ? 'Подключено' : 'Ошибка подключения';
  };

  return (
    <div className="elevenlabs-status">
      <div className="status-header">
        <h4>ElevenLabs Статус</h4>
        <button 
          onClick={checkAuthStatus}
          disabled={isChecking}
          className="refresh-status-btn"
        >
          {isChecking ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="status-content">
        <div className="status-indicator">
          <span 
            className="status-icon"
            style={{ color: getStatusColor() }}
          >
            {getStatusIcon()}
          </span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {authStatus && (
          <div className="status-details">
            <p className="status-message">{authStatus.message}</p>
            
            {authStatus.data && (
              <div className="status-data">
                <div className="data-item">
                  <strong>Статус:</strong> {authStatus.data.status}
                </div>
                {authStatus.data.voices_count && (
                  <div className="data-item">
                    <strong>Доступно голосов:</strong> {authStatus.data.voices_count}
                  </div>
                )}
                {authStatus.data.timestamp && (
                  <div className="data-item">
                    <strong>Время проверки:</strong> {new Date(authStatus.data.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {lastChecked && (
          <div className="last-checked">
            Последняя проверка: {lastChecked.toLocaleString()}
          </div>
        )}

        {error && (
          <div className="status-error">
            <strong>Ошибка:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElevenLabsStatus;
