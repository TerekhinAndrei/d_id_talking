import React, { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDIdStreaming } from '../hooks/useDIdStreaming';
import { useDIdMicrophoneTalk } from '../hooks/useDIdMicrophoneTalk';

const DIdStreamingTester = ({ selectedVoice }) => {
  // Используем основной хук для D-ID streaming
  const {
    streamState,
    createStream: createStreamHook,
    startStream: startStreamHook,
    createTalk: createTalkHook,
    closeStream: closeStreamHook,
    resetState: resetStreamState
  } = useDIdStreaming();

  const [testState, setTestState] = useState({
    step: 0,
    logs: [],
    talkMode: 'text', // 'text' or 'audio'
    audioUrl: 'https://res.cloudinary.com/daeoqig4w/video/upload/v1754932884/d_id_talking/audio/audio_processed_audio_1754932883244.mp3.mp3'
  });

  // Состояние для управления видимостью заглушки
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  // Таймер для автоматического показа заглушки
  const placeholderTimerRef = useRef(null);

  // Используем хук для микрофонного talk
  const {
    isProcessing: isMicProcessing,
    isRecording: isMicRecording,
    isUploading: isMicUploading,
    isSendingToDid,
    error: micError,
    logs: micLogs,
    streamStats: micStats,
    uploadedFiles: micUploadedFiles,
    didUploadQueue,
    createTalkMic,
    stopTalkMic,
    clearState: clearMicState
  } = useDIdMicrophoneTalk();

  const addLog = useCallback((message, type = 'info') => {
    setTestState(prev => ({
      ...prev,
      logs: [...prev.logs, { message, type, timestamp: new Date().toISOString() }]
    }));
  }, []);

  const resetTest = useCallback(() => {
    resetStreamState();
    setTestState({
      step: 0,
      logs: [],
      talkMode: 'text',
      audioUrl: 'https://res.cloudinary.com/daeoqig4w/video/upload/v1754770303/1-second-of-silence_l1un5v.mp3'
    });
  }, [resetStreamState]);

  // Step 1: Create a new stream
  const createStream = useCallback(async () => {
    try {
      addLog('🚀 Step 1: Creating new stream...', 'info');
      
      const imageUrl = 'https://res.cloudinary.com/daeoqig4w/image/upload/v1754601773/ced034aa-4c77-4d02-a762-fb16bcb25d75.jpg';
      
      // Проверяем, существует ли изображение
      addLog('🔍 Проверяем доступность изображения...', 'info');
      try {
        const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageCheck.ok) {
          addLog(`❌ Изображение не найдено: ${imageUrl}`, 'error');
          addLog('⚠️ Статус: 404 - Resource not found', 'error');
          return;
        }
        addLog('✅ Изображение доступно', 'success');
      } catch (imageError) {
        addLog(`❌ Ошибка проверки изображения: ${imageError.message}`, 'error');
        return;
      }
      
      const result = await createStreamHook(imageUrl);
      
      if (result.success) {
        addLog('✅ Stream created successfully!', 'success');
        addLog(`📊 Stream ID: ${result.streamId}`, 'info');
        addLog(`📊 Session ID: ${result.sessionId}`, 'info');
        addLog(`📊 Has SDP Offer: ${!!result.sdpOffer}`, 'info');
        addLog(`📊 Has ICE Servers: ${!!result.iceServers}`, 'info');
        
        setTestState(prev => ({
          ...prev,
          step: 1
        }));
      } else {
        addLog(`❌ Failed to create stream: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error creating stream: ${error.message}`, 'error');
    }
  }, [createStreamHook, addLog]);

  // Step 2: Start the stream (WebRTC setup)
  const startStream = useCallback(async () => {
    try {
      addLog('🔗 Step 2: Starting stream with WebRTC...', 'info');
      
      if (!streamState.sdpOffer || !streamState.iceServers) {
        addLog('❌ Missing SDP offer or ICE servers', 'error');
        return;
      }

      const result = await startStreamHook(
        streamState.streamId,
        streamState.sessionId,
        streamState.sdpOffer,
        streamState.iceServers
      );

      if (result.success) {
        addLog('✅ Stream started successfully!', 'success');
        setTestState(prev => ({
          ...prev,
          step: 2
        }));
      } else {
        addLog(`❌ Failed to start stream: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error starting stream: ${error.message}`, 'error');
    }
  }, [streamState, startStreamHook, addLog]);

  // Step 4: Create talk stream
  const createTalk = useCallback(async () => {
    try {
      addLog('🎤 Step 4: Creating talk stream...', 'info');
      
      const voiceId = selectedVoice?.voice_id || selectedVoice?.id || 'en-US-JennyNeural';
      
      const result = await createTalkHook(
        streamState.streamId,
        streamState.sessionId,
        voiceId
      );

      if (result.success) {
        addLog('✅ Talk stream created successfully!', 'success');
        addLog(`📝 Voice ID: ${voiceId}`, 'info');
        setTestState(prev => ({ ...prev, step: 4 }));
      } else {
        addLog(`❌ Failed to create talk: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error creating talk: ${error.message}`, 'error');
    }
  }, [streamState, selectedVoice, createTalkHook, addLog]);

  // Step 4: Create talk stream with audio
  const createTalkAudio = useCallback(async () => {
    try {
      addLog('🎵 Step 4: Creating talk stream with audio...', 'info');
      
      // Используем API напрямую для аудио, так как в хуке нет специального метода
      const response = await apiService.createDIdTalkAudio(
        streamState.streamId,
        streamState.sessionId,
        testState.audioUrl,
        "en-US-JennyNeural"
      );

      if (response.success) {
        addLog('✅ Talk stream with audio created successfully!', 'success');
        addLog(`🎵 Audio URL: ${testState.audioUrl}`, 'info');
        addLog(`📋 Talk ID: ${response.talk_id || 'N/A'}`, 'info');
        setTestState(prev => ({ ...prev, step: 4 }));
      } else {
        addLog(`❌ Failed to create talk with audio: ${response.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error creating talk with audio: ${error.message}`, 'error');
    }
  }, [streamState, testState.audioUrl, addLog]);

  // useEffect для управления таймером заглушки
  useEffect(() => {
    const video = document.getElementById('test-video');
    if (!video) return;

    const startPlaceholderTimer = () => {
      // Очищаем предыдущий таймер
      if (placeholderTimerRef.current) {
        clearTimeout(placeholderTimerRef.current);
      }
      
      // Запускаем новый таймер на 2 секунды
      placeholderTimerRef.current = setTimeout(() => {
        console.log('🎬 Таймер истек, показываем заглушку');
        setShowPlaceholder(true);
      }, 2000);
    };

    const stopPlaceholderTimer = () => {
      if (placeholderTimerRef.current) {
        clearTimeout(placeholderTimerRef.current);
        placeholderTimerRef.current = null;
      }
    };

    // Обработчики событий
    const handlePlay = () => {
      console.log('🎬 Основное видео начало воспроизведение, скрываем заглушку');
      setShowPlaceholder(false);
      stopPlaceholderTimer();
    };

    const handlePause = () => {
      console.log('🎬 Основное видео приостановлено, показываем заглушку');
      setShowPlaceholder(true);
      startPlaceholderTimer();
    };

    const handleEnded = () => {
      console.log('🎬 Основное видео завершилось, показываем заглушку');
      setShowPlaceholder(true);
      stopPlaceholderTimer();
    };

    const handleWaiting = () => {
      console.log('🎬 Основное видео ждет данные, показываем заглушку');
      setShowPlaceholder(true);
      startPlaceholderTimer();
    };

    const handleTimeUpdate = () => {
      // Проверяем, не закончилось ли видео
      if (video.duration > 0 && video.currentTime >= video.duration - 0.1) {
        console.log('🎬 Основное видео в конце, показываем заглушку');
        setShowPlaceholder(true);
        stopPlaceholderTimer();
      }
    };

    const handleStalled = () => {
      console.log('🎬 Основное видео остановилось, показываем заглушку');
      setShowPlaceholder(true);
      startPlaceholderTimer();
    };

    // Добавляем обработчики
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('stalled', handleStalled);

    // Запускаем таймер по умолчанию
    startPlaceholderTimer();

    // Очистка при размонтировании
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('stalled', handleStalled);
      stopPlaceholderTimer();
    };
  }, []);

  // useEffect для установки видео потока в элемент
  useEffect(() => {
    if (streamState.videoStream) {
      const videoElement = document.getElementById('test-video');
      if (videoElement) {
        videoElement.srcObject = streamState.videoStream;
        addLog('🎬 Video stream set to video element', 'success');
      }
    }
  }, [streamState.videoStream, addLog]);

  // Step 4: Create talk stream with microphone
  const handleCreateTalkMic = useCallback(async () => {
    try {
      addLog('🎤 Step 4: Creating talk stream with microphone...', 'info');
      addLog('🔍 Checking prerequisites...', 'info');
      
      // Проверяем необходимые условия
      if (!streamState.streamId) {
        addLog('❌ Stream ID not available', 'error');
        return;
      }
      
      if (!streamState.sessionId) {
        addLog('❌ Session ID not available', 'error');
        return;
      }
      
      if (!streamState.isConnected) {
        addLog('❌ WebRTC connection not established', 'error');
        return;
      }
      
      if (!selectedVoice) {
        addLog('❌ Voice not selected', 'error');
        return;
      }
      
      addLog('✅ All prerequisites met', 'success');
      addLog(`🎵 Selected voice: ${selectedVoice}`, 'info');
      
      // Используем новый хук для микрофонного talk
      await createTalkMic(streamState.streamId, streamState.sessionId, selectedVoice);
      
    } catch (error) {
      addLog(`❌ Error creating talk with microphone: ${error.message}`, 'error');
      addLog(`🔍 Error details: ${error.stack || 'No stack trace available'}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [streamState, selectedVoice, createTalkMic, addLog]);

  // Step 5: Close stream
  const closeStream = useCallback(async () => {
    try {
      addLog('🔚 Step 5: Closing stream...', 'info');
      
      await closeStreamHook();

      addLog('✅ Stream closed successfully!', 'success');
      setTestState(prev => ({ ...prev, step: 0 }));

    } catch (error) {
      addLog(`❌ Error closing stream: ${error.message}`, 'error');
    }
  }, [closeStreamHook, addLog]);

  return (
    <div className="d-id-streaming-tester">
      <h2>🎬 D-ID Streaming Tester</h2>
      
      <div className="test-controls">
        <button 
          onClick={createStream}
          disabled={testState.step > 0}
          className="test-btn"
        >
          Step 1: Create Stream
        </button>
        
        <button 
          onClick={startStream}
          disabled={testState.step < 1 || testState.step > 1}
          className="test-btn"
        >
          Step 2: Start Stream
        </button>
        
        <button 
          onClick={createTalk}
          disabled={testState.step < 2 || !streamState.isConnected}
          className="test-btn"
        >
          Create Talk (Text)
        </button>
        
        <button 
          onClick={createTalkAudio}
          disabled={testState.step < 2 || !streamState.isConnected}
          className="test-btn"
        >
          Create Talk (Audio)
        </button>
        
        <button 
          onClick={handleCreateTalkMic}
          disabled={testState.step < 2 || !streamState.isConnected || !selectedVoice || isMicProcessing}
          className="test-btn"
        >
          {isMicRecording ? 'Stop Talk (Mic)' : 'Create Talk (Mic)'}
        </button>
        
        {micError && micError.includes('429') && (
          <button 
            onClick={() => {
              addLog('🔄 Ручной повтор после ошибки 429...', 'info');
              // Очищаем ошибку и позволяем пользователю повторить
              clearMicState();
            }}
            className="test-btn retry"
          >
            🔄 Повторить после 429
          </button>
        )}
        
        <button 
          onClick={closeStream}
          disabled={!streamState.streamId}
          className="test-btn"
        >
          Close Stream
        </button>
        
        <button 
          onClick={resetTest}
          className="test-btn reset"
        >
          Reset Test
        </button>
      </div>

      <div className="test-status">
        <h3>📊 Test Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">Current Step:</span>
            <span className="value">{testState.step}/5</span>
          </div>
          <div className="status-item">
            <span className="label">Stream ID:</span>
            <span className="value">{streamState.streamId || 'N/A'}</span>
          </div>
                           <div className="status-item">
                   <span className="label">Session ID:</span>
                   <span className="value">
                     {streamState.sessionId ? 
                       streamState.sessionId.length > 50 ? 
                         `${streamState.sessionId.substring(0, 50)}...` : 
                         streamState.sessionId 
                       : 'N/A'
                     }
                   </span>
                 </div>
          <div className="status-item">
            <span className="label">WebRTC Connected:</span>
            <span className="value">{streamState.isConnected ? '✅ Yes' : '❌ No'}</span>
          </div>
        </div>
      </div>

      <div className="audio-settings">
        <h3>🎵 Audio Settings</h3>
        <div className="audio-input">
          <label htmlFor="audioUrl">Audio URL:</label>
          <input
            type="text"
            id="audioUrl"
            value={testState.audioUrl}
            onChange={(e) => setTestState(prev => ({ ...prev, audioUrl: e.target.value }))}
            placeholder="Enter audio URL"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          <small>Default: 1 second of silence from Cloudinary</small>
        </div>
      </div>

      {testState.error && (
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{testState.error}</p>
        </div>
      )}

      <div className="video-container" style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '400px', 
        aspectRatio: '1 / 1', // Квадратные пропорции как у аватара
        margin: '0 auto',
        backgroundColor: '#000',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Основной видеоэлемент */}
        <video 
          id="test-video"
          autoPlay 
          playsInline
          controls
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            zIndex: 1,
            objectFit: 'contain', // Сохраняет пропорции для корректного воспроизведения
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
            objectFit: 'fill', // Заполняет весь контейнер без сохранения пропорций
            backgroundColor: '#000'
          }}
          src="/Waiting.mp4"
        />
      </div>

      {/* Микрофонный talk статус */}
      {isMicRecording && (
        <div className="mic-status">
          <h3>🎤 Microphone Talk Status</h3>
          <div className="status-grid">
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
            <div className="error-message">
              <h4>❌ Microphone Error</h4>
              <p>{micError}</p>
            </div>
          )}
          
          <div className="mic-logs">
            <h4>📝 Microphone Logs</h4>
            <div className="logs">
              {micLogs.slice(-10).map((log, index) => (
                <div key={`mic-log-${log.timestamp}-${index}`} className={`log-entry ${log.type}`}>
                  <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Очередь D-ID файлов */}
          {didUploadQueue.length > 0 && (
            <div className="did-queue">
              <h4>🎬 D-ID Queue ({didUploadQueue.length} files)</h4>
              <div className="queue-list">
                {didUploadQueue.slice(0, 5).map((file, index) => (
                  <div key={`did-queue-${file.id}-${file.timestamp}`} className="queue-item">
                    <span className="queue-number">#{index + 1}</span>
                    <span className="queue-url">{file.url.split('/').pop()}</span>
                    <span className="queue-time">
                      {new Date(file.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {didUploadQueue.length > 5 && (
                  <div className="queue-more">
                    ... и еще {didUploadQueue.length - 5} файлов
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="logs-container">
        <h3>📝 Test Logs</h3>
        <div className="logs">
          {testState.logs.map((log, index) => (
            <div key={`test-log-${log.timestamp}-${index}`} className={`log-entry ${log.type}`}>
              <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default DIdStreamingTester;
