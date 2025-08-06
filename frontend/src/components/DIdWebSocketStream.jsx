import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { AudioHandler } from '../utils/audioHandler';

export const DIdWebSocketStream = ({ sourceUrl, presenterType = 'talk' }) => {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('en-US-JennyNeural');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const audioHandlerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Используем временный sessionId для подключения к WebSocket
  const tempSessionId = 'temp-' + Math.random().toString(36).substr(2, 9);
  const { isConnected, sendMessage, messages, error, disconnect, clearMessages } = useWebSocket(tempSessionId);

  useEffect(() => {
    // Инициализация аудио обработчика
    const initAudio = async () => {
      audioHandlerRef.current = new AudioHandler();
      const success = await audioHandlerRef.current.init();
      
      if (success) {
        console.log('Аудио обработчик инициализирован');
      } else {
        console.error('Ошибка инициализации аудио обработчика');
      }
    };

    initAudio();

    // Инициализация стрима при подключении
    if (isConnected && !isInitialized) {
      initializeStream();
    }
  }, [isConnected]);

  const initializeStream = () => {
    setIsLoading(true);
    
    const success = sendMessage({
      type: 'init_stream',
      source_url: sourceUrl,
      presenter_type: presenterType
    });

    if (!success) {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = () => {
    if (!text.trim()) return;

    setIsLoading(true);
    
    const success = sendMessage({
      type: 'text_to_speech',
      text: text,
      voice_id: voiceId
    });

    if (success) {
      setText('');
    }
    setIsLoading(false);
  };

  const handleSpeechToSpeech = async (audioFile) => {
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1]; // Убираем data:audio/...;base64,
      
      const success = sendMessage({
        type: 'speech_to_speech',
        audio_data: base64Data,
        voice_id: voiceId
      });

      if (!success) {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(audioFile);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      handleSpeechToSpeech(file);
    } else {
      alert('Пожалуйста, выберите аудио файл');
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioHandlerRef.current) {
      audioHandlerRef.current.setVolume(newVolume);
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioHandlerRef.current) {
      if (newMutedState) {
        audioHandlerRef.current.mute();
      } else {
        audioHandlerRef.current.unmute();
      }
    }
  };

  const handleTestAudio = async () => {
    if (audioHandlerRef.current) {
      await audioHandlerRef.current.testAudio();
    }
  };

  // Обработка входящих сообщений
  useEffect(() => {
    messages.forEach(message => {
      switch (message.type) {
        case 'stream_initialized':
          setIsInitialized(true);
          setIsLoading(false);
          setSessionId(message.session_id);
          setStreamId(message.stream_id);
          console.log('Стрим инициализирован:', message.session_id, message.stream_id);
          break;
          
        case 'audio_data':
          if (audioHandlerRef.current) {
            audioHandlerRef.current.addToQueue(message.data);
          }
          setIsLoading(false);
          break;
          
        case 'error':
          console.error('Ошибка от сервера:', message.message);
          setIsLoading(false);
          break;
      }
    });
  }, [messages]);

  return (
    <div className="d-id-websocket-stream">
      <div className="status">
        <h3>D-ID WebSocket Stream</h3>
        <div className="status-indicators">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Подключен' : '🔴 Отключен'}
          </span>
          <span className={`status-indicator ${isInitialized ? 'initialized' : 'not-initialized'}`}>
            {isInitialized ? '✅ Инициализирован' : '⏳ Ожидание'}
          </span>
          {sessionId && (
            <span className="status-indicator session-id">
              Session: {sessionId.substring(0, 8)}...
            </span>
          )}
          {streamId && (
            <span className="status-indicator stream-id">
              Stream: {streamId.substring(0, 8)}...
            </span>
          )}
          {isLoading && <span className="status-indicator loading">⏳ Загрузка...</span>}
        </div>
        {error && <p className="error">Ошибка: {error}</p>}
      </div>

      <div className="controls">
        <div className="text-input">
          <h4>Текст в речь</h4>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите текст для озвучивания..."
            rows={3}
            disabled={!isConnected || !isInitialized}
          />
          <div className="voice-controls">
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={!isConnected || !isInitialized}
            >
              <option value="en-US-JennyNeural">Jenny (English)</option>
              <option value="en-US-GuyNeural">Guy (English)</option>
              <option value="ru-RU-SvetlanaNeural">Svetlana (Russian)</option>
              <option value="ru-RU-DmitryNeural">Dmitry (Russian)</option>
            </select>
            <button
              onClick={handleTextToSpeech}
              disabled={!isConnected || !isInitialized || !text.trim() || isLoading}
              className="primary-button"
            >
              {isLoading ? 'Обработка...' : 'Озвучить текст'}
            </button>
          </div>
        </div>

        <div className="audio-input">
          <h4>Речь в речь</h4>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || !isInitialized || isLoading}
            className="secondary-button"
          >
            Загрузить аудио файл
          </button>
        </div>

        <div className="audio-controls">
          <h4>Аудио настройки</h4>
          <div className="volume-control">
            <label>Громкость:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={!isConnected}
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <div className="mute-control">
            <button
              onClick={handleMuteToggle}
              disabled={!isConnected}
              className={isMuted ? 'muted' : 'unmuted'}
            >
              {isMuted ? '🔇 Включить звук' : '🔊 Выключить звук'}
            </button>
            <button
              onClick={handleTestAudio}
              disabled={!isConnected}
              className="test-button"
            >
              🎵 Тест звука
            </button>
          </div>
        </div>

        <div className="session-controls">
          <button
            onClick={clearMessages}
            className="clear-button"
          >
            Очистить сообщения
          </button>
          <button
            onClick={disconnect}
            className="disconnect-button"
          >
            Отключиться
          </button>
        </div>
      </div>

      <div className="messages">
        <h4>Сообщения ({messages.length})</h4>
        <div className="message-list">
          {messages.length === 0 ? (
            <p className="no-messages">Нет сообщений</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-header">
                  <strong>{msg.type}</strong>
                  <span className="message-time">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {msg.type === 'audio_data' ? (
                    <span>Аудио данные получены ({msg.data?.length || 0} байт)</span>
                  ) : (
                    <pre>{JSON.stringify(msg, null, 2)}</pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .d-id-websocket-stream {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          max-width: 800px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .status {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .status h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .status-indicators {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-indicator.connected {
          background: #d4edda;
          color: #155724;
        }
        
        .status-indicator.disconnected {
          background: #f8d7da;
          color: #721c24;
        }
        
        .status-indicator.initialized {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        .status-indicator.not-initialized {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-indicator.loading {
          background: #e2e3e5;
          color: #383d41;
        }
        
        .status-indicator.session-id {
          background: #e2e3e5;
          color: #495057;
          font-family: monospace;
        }
        
        .status-indicator.stream-id {
          background: #d1ecf1;
          color: #0c5460;
          font-family: monospace;
        }
        
        .error {
          color: #dc3545;
          margin-top: 10px;
          padding: 8px;
          background: #f8d7da;
          border-radius: 4px;
        }
        
        .controls {
          margin-bottom: 20px;
        }
        
        .controls h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }
        
        .text-input, .audio-input, .audio-controls, .session-controls {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }
        
        textarea {
          width: 100%;
          margin-bottom: 10px;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
          background: white;
          color: #333;
        }
        
        textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        textarea::placeholder {
          color: #6c757d;
        }
        
        .voice-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: white;
          color: #333;
        }
        
        select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .primary-button {
          background: #007bff;
          color: white;
        }
        
        .primary-button:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .secondary-button {
          background: #6c757d;
          color: white;
        }
        
        .secondary-button:hover:not(:disabled) {
          background: #545b62;
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .volume-control input[type="range"] {
          flex: 1;
        }
        
        .mute-control {
          display: flex;
          gap: 10px;
        }
        
        .muted {
          background: #dc3545;
          color: white;
        }
        
        .unmuted {
          background: #28a745;
          color: white;
        }
        
        .test-button {
          background: #ffc107;
          color: #212529;
        }
        
        .clear-button {
          background: #6c757d;
          color: white;
        }
        
        .disconnect-button {
          background: #dc3545;
          color: white;
        }
        
        .session-controls {
          display: flex;
          gap: 10px;
        }
        
        .messages {
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
        
        .messages h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }
        
        .message-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }
        
        .no-messages {
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        
        .message {
          margin: 10px;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }
        
        .message.error {
          border-left-color: #dc3545;
        }
        
        .message.audio_data {
          border-left-color: #28a745;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .message-time {
          font-size: 12px;
          color: #6c757d;
        }
        
        .message-content {
          font-size: 14px;
        }
        
        .message-content pre {
          margin: 0;
          white-space: pre-wrap;
          font-size: 12px;
          color: #495057;
        }
      `}</style>
    </div>
  );
};
