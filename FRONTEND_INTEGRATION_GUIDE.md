# Руководство по интеграции DIdWebSocketService с фронтендом

## 📋 Содержание
1. [Обзор архитектуры](#обзор-архитектуры)
2. [API Endpoints](#api-endpoints)
3. [WebSocket интеграция](#websocket-интеграция)
4. [React компоненты](#react-компоненты)
5. [Примеры использования](#примеры-использования)
6. [Обработка ошибок](#обработка-ошибок)
7. [Тестирование](#тестирование)

---

## 🏗️ Обзор архитектуры

### Backend (FastAPI)
```
app/services/d_id_websocket_service.py  # WebSocket сервис
app/api/v1/endpoints/websocket_streaming.py  # WebSocket endpoints
app/core/config.py  # Конфигурация
```

### Frontend (React)
```
frontend/src/services/webrtc.js  # WebRTC клиент
frontend/src/components/WebRTCStream.jsx  # Компонент стрима
frontend/src/components/WebRTCStreaming.jsx  # Контейнер
```

---

## 🔌 API Endpoints

### WebSocket Endpoint
```javascript
// Подключение к WebSocket
const wsUrl = `ws://localhost:8000/ws/stream`;
const ws = new WebSocket(wsUrl);
```

### HTTP Endpoints для управления
```javascript
// Создание сессии
POST /api/v1/websocket/stream
{
  "source_url": "https://example.com/avatar.jpg",
  "presenter_type": "talk"
}

// Получение статуса
GET /api/v1/websocket/stream/{session_id}/status

// Удаление сессии
DELETE /api/v1/websocket/stream/{session_id}
```

---

## 🌐 WebSocket интеграция

### Типы сообщений

#### 1. Инициализация стрима (от клиента)
```javascript
// Отправка
{
  "type": "init_stream",
  "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face",
  "presenter_type": "talk"
}

// Ответ от D-ID API (через сервер)
{
  "type": "stream_initialized",
  "session_id": "d-id-generated-session-id",
  "stream_id": "d-id-generated-stream-id",
  "status": "ready",
  "message": "Stream initialized by D-ID"
}
```

#### 2. Отправка текста для озвучивания
```javascript
// Отправка
{
  "type": "text_to_speech",
  "text": "Привет! Это тестовое сообщение.",
  "voice_id": "en-US-JennyNeural"
}

// Ответ (аудио данные)
{
  "type": "audio_data",
  "data": "base64_encoded_audio_data",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 3. Отправка аудио для озвучивания
```javascript
// Отправка
{
  "type": "speech_to_speech",
  "audio_data": "base64_encoded_audio",
  "voice_id": "en-US-JennyNeural"
}

// Ответ
{
  "type": "audio_data",
  "data": "base64_encoded_processed_audio",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 4. Ошибки
```javascript
{
  "type": "error",
  "message": "Описание ошибки",
  "code": "ERROR_CODE"
}
```

---

## ⚛️ React компоненты

### 1. WebSocket Hook
```javascript
// frontend/src/hooks/useWebSocket.js
import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (tempSessionId) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (!tempSessionId) return;

    const wsUrl = `ws://localhost:8000/ws/stream`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket подключен');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
        
        if (data.type === 'audio_data') {
          // Обработка аудио данных
          handleAudioData(data.data);
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
      }
    };

    websocket.onerror = (error) => {
      setError('Ошибка WebSocket соединения');
      console.error('WebSocket error:', error);
    };

    websocket.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket отключен:', event.code, event.reason);
      
      // Автоматическое переподключение при неожиданном закрытии
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Попытка переподключения...');
          connect();
        }, 3000);
      }
    };

    setWs(websocket);
  }, [tempSessionId]);

  const sendMessage = useCallback((message) => {
    if (ws && isConnected) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        setError('Ошибка отправки сообщения');
        return false;
      }
    } else {
      console.warn('WebSocket не подключен');
      return false;
    }
  }, [ws, isConnected]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close(1000, 'Пользователь отключился');
    }
  }, [ws]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const handleAudioData = useCallback((audioData) => {
    // Здесь можно добавить логику для воспроизведения аудио
    console.log('Получены аудио данные:', audioData.substring(0, 50) + '...');
  }, []);

  useEffect(() => {
    if (tempSessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tempSessionId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    messages,
    error,
    disconnect,
    clearMessages,
    reconnect: connect
  };
};
```

### 2. Аудио обработчик
```javascript
// frontend/src/utils/audioHandler.js
export class AudioHandler {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.volume = 1.0;
    this.isMuted = false;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Восстановление контекста если он приостановлен
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('AudioContext инициализирован:', this.audioContext.state);
      return true;
    } catch (error) {
      console.error('Ошибка инициализации AudioContext:', error);
      return false;
    }
  }

  async playAudio(base64Data) {
    try {
      if (!this.audioContext) {
        console.warn('AudioContext не инициализирован');
        return false;
      }

      // Декодирование base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Декодирование аудио
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      
      // Создание источника
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Создание gain node для контроля громкости
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.isMuted ? 0 : this.volume;
      
      // Подключение цепочки
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Воспроизведение
      source.start(0);
      
      return new Promise((resolve) => {
        source.onended = () => {
          console.log('Аудио воспроизведение завершено');
          resolve();
        };
        
        source.onerror = (error) => {
          console.error('Ошибка воспроизведения аудио:', error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Ошибка воспроизведения аудио:', error);
      return false;
    }
  }

  async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    console.log('Начинаем воспроизведение очереди аудио...');
    
    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift();
      const success = await this.playAudio(audioData);
      
      if (!success) {
        console.warn('Пропускаем неудачное аудио');
      }
    }
    
    this.isPlaying = false;
    console.log('Воспроизведение очереди завершено');
  }

  addToQueue(audioData) {
    this.audioQueue.push(audioData);
    console.log(`Добавлено в очередь аудио. Размер очереди: ${this.audioQueue.length}`);
    this.playAudioQueue();
  }

  clearQueue() {
    this.audioQueue = [];
    console.log('Очередь аудио очищена');
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`Громкость установлена: ${this.volume}`);
  }

  mute() {
    this.isMuted = true;
    console.log('Аудио отключено');
  }

  unmute() {
    this.isMuted = false;
    console.log('Аудио включено');
  }

  getQueueLength() {
    return this.audioQueue.length;
  }

  isQueuePlaying() {
    return this.isPlaying;
  }

  // Метод для тестирования аудио
  async testAudio() {
    try {
      // Создаем простой синусоидальный сигнал для тестирования
      const sampleRate = 44100;
      const duration = 1; // 1 секунда
      const frequency = 440; // 440 Hz (нота A)
      
      const audioBuffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
      
      console.log('Тестовый аудио сигнал воспроизведен');
      return true;
    } catch (error) {
      console.error('Ошибка тестирования аудио:', error);
      return false;
    }
  }
}
```

### 3. Компонент стрима
```javascript
// frontend/src/components/DIdWebSocketStream.jsx
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

      <style jsx>{`
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
```

---

## 📝 Примеры использования

### 1. Базовое использование
```javascript
// App.jsx
import React, { useState } from 'react';
import { DIdWebSocketStream } from './components/DIdWebSocketStream';

function App() {
  const [sourceUrl, setSourceUrl] = useState(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face'
  );
  const [presenterType, setPresenterType] = useState('talk');

  return (
    <div className="App">
      <h1>🎭 D-ID WebSocket Streaming Demo</h1>
      
      <div className="config">
        <label>
          Source URL:
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </label>
      </div>

      <DIdWebSocketStream
        sourceUrl={sourceUrl}
        presenterType={presenterType}
      />
    </div>
  );
}

export default App;
```

### 2. Интеграция с существующим WebRTC
```javascript
// frontend/src/components/WebRTCStream.jsx (обновленная версия)
import React, { useState, useEffect } from 'react';
import { DIdWebSocketStream } from './DIdWebSocketStream';

export const WebRTCStream = ({ roomName, token }) => {
  const [isWebSocketMode, setIsWebSocketMode] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('https://example.com/avatar.jpg');

  // ... существующий WebRTC код ...

  return (
    <div className="webrtc-stream">
      <div className="mode-selector">
        <button
          onClick={() => setIsWebSocketMode(false)}
          className={!isWebSocketMode ? 'active' : ''}
        >
          WebRTC Mode
        </button>
        <button
          onClick={() => setIsWebSocketMode(true)}
          className={isWebSocketMode ? 'active' : ''}
        >
          WebSocket Mode
        </button>
      </div>

      {isWebSocketMode ? (
        <div className="websocket-mode">
          <input
            type="text"
            placeholder="Source URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <DIdWebSocketStream
            sourceUrl={sourceUrl}
            presenterType="talk"
          />
        </div>
      ) : (
        <div className="webrtc-mode">
          {/* Существующий WebRTC код */}
        </div>
      )}
    </div>
  );
};
```

---

## ⚠️ Обработка ошибок

### 1. WebSocket ошибки
```javascript
const handleWebSocketError = (error) => {
  switch (error.code) {
    case 'ECONNREFUSED':
      console.error('Сервер недоступен');
      break;
    case 'NETWORK_ERROR':
      console.error('Ошибка сети');
      break;
    default:
      console.error('Неизвестная ошибка:', error);
  }
};
```

### 2. Аудио ошибки
```javascript
const handleAudioError = (error) => {
  if (error.name === 'NotSupportedError') {
    console.error('Браузер не поддерживает Web Audio API');
  } else if (error.name === 'NotAllowedError') {
    console.error('Доступ к аудио запрещен');
  } else {
    console.error('Ошибка аудио:', error);
  }
};
```

### 3. API ошибки
```javascript
const handleAPIError = (response) => {
  if (response.status === 401) {
    console.error('Неавторизованный доступ');
  } else if (response.status === 404) {
    console.error('Сессия не найдена');
  } else if (response.status === 500) {
    console.error('Внутренняя ошибка сервера');
  }
};
```

---

## 🧪 Тестирование

### 1. Unit тесты
```javascript
// frontend/src/__tests__/DIdWebSocketStream.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DIdWebSocketStream } from '../components/DIdWebSocketStream';

// Mock WebSocket
global.WebSocket = class {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
  }
  
  send(data) {
    this.onmessage({ data: JSON.stringify({
      type: 'stream_initialized',
      session_id: 'd-id-session-123',
      stream_id: 'd-id-stream-456'
    })});
  }
  
  close() {}
};

describe('DIdWebSocketStream', () => {
  test('инициализирует стрим при подключении', async () => {
    render(
      <DIdWebSocketStream
        sourceUrl="https://example.com/avatar.jpg"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Инициализирован: Да')).toBeInTheDocument();
    });
  });

  test('отправляет текст для озвучивания', async () => {
    const mockSend = jest.fn();
    global.WebSocket = class {
      constructor() {
        this.readyState = 1;
      }
      send = mockSend;
      close() {}
    };

    render(
      <DIdWebSocketStream
        sourceUrl="https://example.com/avatar.jpg"
      />
    );

    const textarea = screen.getByPlaceholderText('Введите текст для озвучивания...');
    const button = screen.getByText('Озвучить текст');

    fireEvent.change(textarea, { target: { value: 'Тестовый текст' } });
    fireEvent.click(button);

    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'text_to_speech',
        text: 'Тестовый текст',
        voice_id: 'en-US-JennyNeural'
      })
    );
  });
});
```

### 2. Интеграционные тесты
```javascript
// frontend/src/__tests__/integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DIdWebSocketStream } from '../components/DIdWebSocketStream';

describe('DIdWebSocketStream Integration', () => {
  test('полный цикл работы с аудио', async () => {
    // Тест полного цикла: подключение -> инициализация -> отправка текста -> получение аудио
  });

  test('обработка ошибок сети', async () => {
    // Тест обработки сетевых ошибок
  });
});
```

---

## 🚀 Развертывание

### 1. Backend
```bash
# Запуск сервера
cd /path/to/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend
```bash
# Установка зависимостей
cd frontend
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```

### 3. Переменные окружения
```bash
# .env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📚 Дополнительные ресурсы

- [D-ID API Documentation](https://docs.d-id.com/)
- [WebSocket API Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## ✅ Чек-лист интеграции

- [ ] Настроен WebSocket endpoint на бэкенде
- [ ] Создан React компонент для WebSocket стрима
- [ ] Реализована обработка аудио данных
- [ ] Добавлена обработка ошибок
- [ ] Написаны unit тесты
- [ ] Написаны интеграционные тесты
- [ ] Настроено развертывание
- [ ] Документированы API endpoints
- [ ] Протестирована интеграция с реальными данными
- [ ] Session ID получается от D-ID API автоматически

---

*Руководство создано для интеграции DIdWebSocketService с React фронтендом* 🎯
