import React, { useState } from 'react';
import { useVoiceToAvatar } from '../hooks/useVoiceToAvatar';

const VoiceToAvatarTester = ({ selectedVoice }) => {
  const [videoElementId] = useState('voice-to-avatar-video');
  
  const {
    // State
    streamState,
    showPlaceholder,
    
    // Microphone state
    isMicProcessing,
    isMicRecording,
    isMicUploading,
    isSendingToDid,
    micError,
    micLogs,
    micStats,
    micUploadedFiles,
    didUploadQueue,
    
    // Actions
    setupStream,
    startVoiceToAvatar,
    stopVoiceToAvatar,
    closeStream,
    reset,
    
    // Individual steps
    createStream,
    startStream,
    
    // Logs
    logs
  } = useVoiceToAvatar(videoElementId);

  const handleSetupStream = async () => {
    if (!selectedVoice) {
      alert('Пожалуйста, выберите голос');
      return;
    }
    
    await setupStream(selectedVoice);
  };

  const handleStartVoice = async () => {
    if (!selectedVoice) {
      alert('Пожалуйста, выберите голос');
      return;
    }
    
    await startVoiceToAvatar(selectedVoice);
  };

  return (
    <div className="voice-to-avatar-tester">
      <h2>🎤 Voice to Avatar Tester</h2>
      
      {/* Видео контейнер */}
      <div className="video-container" style={{
        width: '400px',
        height: '300px',
        margin: '0 auto',
        backgroundColor: '#000',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Основной видеоэлемент */}
        <video 
          id={videoElementId}
          autoPlay 
          playsInline
          controls
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            zIndex: 1,
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
        />
        
        {/* Заглушка с видео ожидания */}
        <video 
          id="placeholder-video"
          autoPlay 
          playsInline
          loop
          muted
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: showPlaceholder ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 2,
            pointerEvents: 'none',
            objectFit: 'fill',
            backgroundColor: '#000'
          }}
          src="/Waiting.mp4"
        />
      </div>

      {/* Кнопки управления */}
      <div className="controls" style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={handleSetupStream}
          disabled={streamState.isCreating || streamState.isStarting}
          style={{ margin: '5px', padding: '10px 20px' }}
        >
          {streamState.isCreating ? 'Creating...' : streamState.isStarting ? 'Starting...' : '🚀 Setup Stream'}
        </button>
        
        <button 
          onClick={handleStartVoice}
          disabled={!streamState.isConnected || isMicRecording}
          style={{ margin: '5px', padding: '10px 20px' }}
        >
          {isMicRecording ? 'Recording...' : '🎤 Start Voice'}
        </button>
        
        <button 
          onClick={stopVoiceToAvatar}
          disabled={!isMicRecording}
          style={{ margin: '5px', padding: '10px 20px' }}
        >
          🛑 Stop Voice
        </button>
        
        <button 
          onClick={closeStream}
          disabled={streamState.status === 'idle'}
          style={{ margin: '5px', padding: '10px 20px' }}
        >
          🔚 Close Stream
        </button>
        
        <button 
          onClick={reset}
          style={{ margin: '5px', padding: '10px 20px' }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Статус стрима */}
      <div className="stream-status" style={{ marginTop: '20px' }}>
        <h3>📊 Stream Status</h3>
        <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div className="status-item">
            <span className="label">Status:</span>
            <span className="value">{streamState.status}</span>
          </div>
          <div className="status-item">
            <span className="label">Step:</span>
            <span className="value">{streamState.step}</span>
          </div>
          <div className="status-item">
            <span className="label">Connected:</span>
            <span className="value">{streamState.isConnected ? '✅' : '❌'}</span>
          </div>
          <div className="status-item">
            <span className="label">Stream ID:</span>
            <span className="value">{streamState.streamId || 'N/A'}</span>
          </div>
          <div className="status-item">
            <span className="label">Session ID:</span>
            <span className="value">{streamState.sessionId || 'N/A'}</span>
          </div>
          <div className="status-item">
            <span className="label">Error:</span>
            <span className="value">{streamState.error || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Статус микрофона */}
      <div className="mic-status" style={{ marginTop: '20px' }}>
        <h3>🎤 Microphone Status</h3>
        <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div className="status-item">
            <span className="label">Recording:</span>
            <span className="value">{isMicRecording ? '✅ Active' : '❌ Inactive'}</span>
          </div>
          <div className="status-item">
            <span className="label">Uploading:</span>
            <span className="value">{isMicUploading ? '⏳ Uploading...' : '✅ Idle'}</span>
          </div>
          <div className="status-item">
            <span className="label">Files Uploaded:</span>
            <span className="value">{micUploadedFiles.length}</span>
          </div>
          <div className="status-item">
            <span className="label">Total Chunks:</span>
            <span className="value">{micStats.totalChunks}</span>
          </div>
          <div className="status-item">
            <span className="label">Speech Detected:</span>
            <span className="value">{micStats.speechDetected} chunks</span>
          </div>
          <div className="status-item">
            <span className="label">Silence Detected:</span>
            <span className="value">{micStats.silenceDetected} chunks</span>
          </div>
          <div className="status-item">
            <span className="label">D-ID Queue:</span>
            <span className="value">{didUploadQueue.length} files</span>
          </div>
          <div className="status-item">
            <span className="label">Sending to D-ID:</span>
            <span className="value">{isSendingToDid ? '⏳ Processing...' : '✅ Idle'}</span>
          </div>
        </div>
        
        {micError && (
          <div className="error-message" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px' }}>
            <h4>❌ Microphone Error</h4>
            <p>{micError}</p>
          </div>
        )}
      </div>

      {/* Логи */}
      <div className="logs" style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
        <h3>📝 Logs</h3>
        <div className="logs-container" style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {logs.slice(-20).map((log, index) => (
            <div key={`log-${log.timestamp}-${index}`} style={{ 
              marginBottom: '5px', 
              padding: '5px', 
              backgroundColor: log.type === 'error' ? '#ffebee' : 
                             log.type === 'success' ? '#e8f5e8' : 
                             log.type === 'warning' ? '#fff3e0' : '#f5f5f5',
              borderRadius: '3px',
              fontSize: '12px'
            }}>
              <span style={{ color: '#666' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span style={{ marginLeft: '10px' }}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceToAvatarTester;
