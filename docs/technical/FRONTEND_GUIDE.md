# Руководство по Frontend

## 🏗️ Архитектура Frontend

### Технологический стек
- **React 18** - библиотека для создания пользовательских интерфейсов
- **Vite** - быстрый сборщик проектов
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - utility-first CSS фреймворк
- **React Router** - маршрутизация
- **Axios** - HTTP клиент

### Структура проекта
```
frontend/
├── public/                 # Статические файлы
│   ├── audio-player-worklet.js
│   ├── audio-recorder-worklet.js
│   └── index.html
├── src/
│   ├── components/         # React компоненты
│   │   ├── AudioVisualizer.jsx
│   │   ├── CreateStreamButton.jsx
│   │   ├── MicrophoneInput.jsx
│   │   ├── VideoPlayer.jsx
│   │   └── VoiceSelector.jsx
│   ├── hooks/             # Кастомные хуки
│   │   ├── useDIdStreaming.js
│   │   ├── useElevenLabs.js
│   │   └── useMicrophoneRecording.js
│   ├── services/          # API сервисы
│   │   ├── api.js
│   │   └── audio/
│   ├── contexts/          # React контексты
│   ├── utils/             # Утилиты
│   ├── App.jsx            # Главный компонент
│   └── main.jsx           # Точка входа
├── package.json
└── vite.config.js
```

## 🚀 Установка и настройка

### 1. Установка зависимостей
```bash
cd frontend
npm install
```

### 2. Настройка переменных окружения
```bash
# Создание .env файла
cp .env.example .env

# Редактирование .env
nano .env
```

### 3. Переменные окружения
```env
# API endpoints
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Внешние сервисы
VITE_D_ID_API_KEY=your_d_id_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 4. Запуск в режиме разработки
```bash
npm run dev
```

### 5. Сборка для продакшена
```bash
npm run build
npm run preview
```

## 🧩 Основные компоненты

### MicrophoneInput
Компонент для записи аудио с микрофона.

```jsx
// src/components/MicrophoneInput.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useMicrophoneRecording } from '../hooks/useMicrophoneRecording';

const MicrophoneInput = ({ onAudioRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const { startRecording, stopRecording, audioBlob } = useMicrophoneRecording();

  const handleStartRecording = useCallback(async () => {
    setIsRecording(true);
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    const blob = await stopRecording();
    onAudioRecorded(blob);
  }, [stopRecording, onAudioRecorded]);

  return (
    <div className="microphone-input">
      <button 
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={`record-button ${isRecording ? 'recording' : ''}`}
      >
        {isRecording ? 'Остановить' : 'Записать'}
      </button>
    </div>
  );
};
```

### VoiceSelector
Компонент для выбора голоса ElevenLabs.

```jsx
// src/components/VoiceSelector.jsx
import React, { useState, useEffect } from 'react';
import { useVoices } from '../hooks/useVoices';

const VoiceSelector = ({ onVoiceSelect }) => {
  const { voices, loading, error } = useVoices();
  const [selectedVoice, setSelectedVoice] = useState(null);

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
    onVoiceSelect(voice);
  };

  if (loading) return <div>Загрузка голосов...</div>;
  if (error) return <div>Ошибка загрузки голосов</div>;

  return (
    <div className="voice-selector">
      <select 
        value={selectedVoice?.voice_id || ''} 
        onChange={(e) => {
          const voice = voices.find(v => v.voice_id === e.target.value);
          handleVoiceChange(voice);
        }}
      >
        <option value="">Выберите голос</option>
        {voices.map(voice => (
          <option key={voice.voice_id} value={voice.voice_id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### VideoPlayer
Компонент для воспроизведения видео.

```jsx
// src/components/VideoPlayer.jsx
import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoUrl, onLoad, onError }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        onLoadedData={onLoad}
        onError={onError}
        className="video-element"
      >
        <source src={videoUrl} type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
    </div>
  );
};
```

## 🎣 Кастомные хуки

### useMicrophoneRecording
Хук для записи аудио с микрофона.

```jsx
// src/hooks/useMicrophoneRecording.js
import { useState, useCallback } from 'react';

export const useMicrophoneRecording = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        setAudioBlob(event.data);
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Ошибка записи:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorder) {
        mediaRecorder.onstop = () => {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        mediaRecorder.stop();
      }
    });
  }, [mediaRecorder, audioBlob]);

  return { startRecording, stopRecording, audioBlob };
};
```

### useDIdStreaming
Хук для работы с D-ID streaming API.

```jsx
// src/hooks/useDIdStreaming.js
import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

export const useDIdStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const startStreaming = useCallback(async (imageUrl, audioBlob) => {
    try {
      setIsStreaming(true);
      setError(null);

      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('audio_file', audioBlob);

      const response = await apiClient.post('/api/v1/generate', formData);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { startStreaming, isStreaming, error };
};
```

## 🔧 API сервисы

### Основной API клиент
```jsx
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API методы
export const api = {
  // Генерация видео
  generateVideo: (formData) => apiClient.post('/api/v1/generate', formData),
  
  // Получение статуса
  getStatus: (taskId) => apiClient.get(`/api/v1/status/${taskId}`),
  
  // Получение голосов
  getVoices: () => apiClient.get('/api/v1/voices'),
};
```

### WebSocket сервис
```jsx
// src/services/websocket.js
export class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket соединение установлено');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('WebSocket соединение закрыто');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
    };
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Попытка переподключения ${this.reconnectAttempts}`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

## 🎨 Стилизация

### Tailwind CSS конфигурация
```js
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

### CSS модули
```css
/* src/components/MicrophoneInput.module.css */
.microphoneInput {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.recordButton {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recordButton:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.recordButton.recording {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  animation: pulse 1.5s infinite;
}
```

## 🧪 Тестирование

### Настройка Jest
```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
};
```

### Тестирование компонентов
```jsx
// src/components/__tests__/MicrophoneInput.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MicrophoneInput from '../MicrophoneInput';

describe('MicrophoneInput', () => {
  it('renders record button', () => {
    render(<MicrophoneInput onAudioRecorded={() => {}} />);
    expect(screen.getByText('Записать')).toBeInTheDocument();
  });

  it('changes button text when recording', () => {
    render(<MicrophoneInput onAudioRecorded={() => {}} />);
    const button = screen.getByText('Записать');
    
    fireEvent.click(button);
    expect(screen.getByText('Остановить')).toBeInTheDocument();
  });
});
```

### Тестирование хуков
```jsx
// src/hooks/__tests__/useMicrophoneRecording.test.js
import { renderHook, act } from '@testing-library/react';
import { useMicrophoneRecording } from '../useMicrophoneRecording';

describe('useMicrophoneRecording', () => {
  it('should start recording', async () => {
    const { result } = renderHook(() => useMicrophoneRecording());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.audioBlob).toBeDefined();
  });
});
```

## 🚨 Обработка ошибок

### Error Boundary
```jsx
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>Произошла ошибка в приложении.</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Глобальная обработка ошибок
```jsx
// src/utils/errorHandler.js
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // Отправка ошибки в систему мониторинга
  if (process.env.NODE_ENV === 'production') {
    // Sentry или другая система мониторинга
  }
  
  // Показ пользователю
  return {
    message: error.message || 'Произошла неизвестная ошибка',
    type: 'error',
  };
};
```

## 📊 Производительность

### React.memo для оптимизации
```jsx
// src/components/OptimizedComponent.jsx
import React, { memo } from 'react';

const OptimizedComponent = memo(({ data, onAction }) => {
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});

export default OptimizedComponent;
```

### Lazy loading компонентов
```jsx
// src/App.jsx
import React, { Suspense, lazy } from 'react';

const VideoPlayer = lazy(() => import('./components/VideoPlayer'));
const VoiceSelector = lazy(() => import('./components/VoiceSelector'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Загрузка...</div>}>
        <VideoPlayer />
        <VoiceSelector />
      </Suspense>
    </div>
  );
}
```

## 🐛 Устранение неполадок

### Частые проблемы

1. **Ошибки CORS**
   - Проверьте настройки backend
   - Убедитесь в правильности API URL

2. **Проблемы с микрофоном**
   - Проверьте разрешения браузера
   - Убедитесь в подключении микрофона

3. **Ошибки WebSocket**
   - Проверьте URL WebSocket
   - Убедитесь в доступности сервера

### Debug режим
```bash
# Включение debug режима
export DEBUG=true
npm run dev
```

### Инструменты разработчика
- React Developer Tools
- Redux DevTools (если используется Redux)
- Network tab для отладки API запросов

## 👥 Авторы

### Основные разработчики:

**Андрей Терехин** - [andrei@terekhindt.com](mailto:andrei@terekhindt.com)
- **Роль**: Основной разработчик
- **Области ответственности**:
  - Графика и визуализация
  - Анимация аватаров
  - Общий функционал (совместно с Антоном)

**Антон Свитский** - [svitskiy@gmail.com](mailto:svitskiy@gmail.com)
- **Роль**: Разработчик
- **Области ответственности**:
  - Запись и воспроизведение аудио
  - Обработка звука
  - Общий функционал (совместно с Андреем)

### Распределение задач:
- **Андрей Терехин**: Графика, визуализация, анимация аватаров
- **Антон Свитский**: Запись, воспроизведение, обработка аудио
- **Совместно**: Остальной функционал (в зависимости от загрузки)

Для вопросов по frontend разработке обращайтесь к авторам по их областям ответственности.
