# D-ID WebSocket Streaming Frontend

Интерактивная демонстрация WebSocket стриминга с D-ID API для создания говорящих аватаров в реальном времени.

## 🚀 Быстрый старт

### Предварительные требования

1. **Node.js** (версия 16 или выше)
2. **Активный бэкенд сервер** (FastAPI)
3. **Валидные API ключи**:
   - D-ID API ключ
   - ElevenLabs API ключ

### Установка и запуск

```bash
# Переход в директорию фронтенда
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── components/
│   │   └── DIdWebSocketStream.jsx    # Основной компонент стрима
│   ├── hooks/
│   │   └── useWebSocket.js           # React hook для WebSocket
│   ├── utils/
│   │   └── audioHandler.js           # Обработчик аудио
│   ├── App.jsx                       # Главный компонент
│   └── App.css                       # Стили
├── public/
└── package.json
```

## 🎯 Возможности

### ✅ Реализовано

- **WebSocket подключение** к D-ID API
- **Текст в речь** (Text-to-Speech) с выбором голоса
- **Речь в речь** (Speech-to-Speech) с загрузкой аудио файлов
- **Управление громкостью** и отключение звука
- **Автоматическое переподключение** при разрыве соединения
- **Визуальные индикаторы** статуса подключения
- **Очередь аудио** для последовательного воспроизведения
- **Тестирование аудио** с генерацией тестового сигнала
- **Адаптивный дизайн** для мобильных устройств

### 🔄 В процессе

- Интеграция с существующим WebRTC компонентом
- Расширенные настройки голоса
- Сохранение настроек в localStorage
- Экспорт/импорт конфигурации

## 🛠️ Использование

### 1. Настройка подключения

```javascript
// В App.jsx
const [sessionId, setSessionId] = useState('test-session-123');
const [sourceUrl, setSourceUrl] = useState('https://example.com/avatar.jpg');
const [presenterType, setPresenterType] = useState('talk');
```

### 2. Подключение компонента

```javascript
import { DIdWebSocketStream } from './components/DIdWebSocketStream';

<DIdWebSocketStream
  sessionId={sessionId}
  sourceUrl={sourceUrl}
  presenterType={presenterType}
/>
```

### 3. Использование WebSocket hook

```javascript
import { useWebSocket } from './hooks/useWebSocket';

const { isConnected, sendMessage, messages, error } = useWebSocket(sessionId);
```

## 📡 WebSocket API

### Типы сообщений

#### Инициализация стрима
```javascript
{
  "type": "init_stream",
  "source_url": "https://example.com/avatar.jpg",
  "presenter_type": "talk"
}
```

#### Текст в речь
```javascript
{
  "type": "text_to_speech",
  "text": "Привет! Это тестовое сообщение.",
  "voice_id": "en-US-JennyNeural"
}
```

#### Речь в речь
```javascript
{
  "type": "speech_to_speech",
  "audio_data": "base64_encoded_audio",
  "voice_id": "en-US-JennyNeural"
}
```

### Ответы сервера

#### Инициализация
```javascript
{
  "type": "stream_initialized",
  "session_id": "session_123",
  "status": "ready"
}
```

#### Аудио данные
```javascript
{
  "type": "audio_data",
  "data": "base64_encoded_audio_data",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Ошибки
```javascript
{
  "type": "error",
  "message": "Описание ошибки",
  "code": "ERROR_CODE"
}
```

## 🔊 Аудио обработка

### AudioHandler класс

```javascript
import { AudioHandler } from './utils/audioHandler';

const audioHandler = new AudioHandler();
await audioHandler.init();

// Добавление в очередь
audioHandler.addToQueue(base64AudioData);

// Управление громкостью
audioHandler.setVolume(0.8);

// Отключение звука
audioHandler.mute();
audioHandler.unmute();

// Тестирование
await audioHandler.testAudio();
```

### Поддерживаемые форматы

- **Воспроизведение**: MP3, WAV, OGG, WebM
- **Загрузка**: Все аудио форматы браузера
- **Кодирование**: Base64 для передачи по WebSocket

## 🎨 Кастомизация

### Стили компонента

```css
.d-id-websocket-stream {
  /* Основной контейнер */
}

.status-indicator {
  /* Индикаторы статуса */
}

.controls {
  /* Панель управления */
}

.message-list {
  /* Список сообщений */
}
```

### Темы

Поддерживаются светлая и темная темы через CSS переменные:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #ffffff;
  --text-color: #333333;
}
```

## 🧪 Тестирование

### Unit тесты

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage
```

### Интеграционные тесты

```bash
# E2E тесты
npm run test:e2e
```

### Ручное тестирование

1. **Подключение**: Проверьте индикатор статуса
2. **Инициализация**: Дождитесь "Инициализирован: Да"
3. **Текст в речь**: Введите текст и нажмите "Озвучить"
4. **Аудио файл**: Загрузите аудио файл для обработки
5. **Громкость**: Используйте слайдер для регулировки
6. **Тест звука**: Нажмите "Тест звука" для проверки

## 🐛 Отладка

### Логи в консоли

```javascript
// Включение подробных логов
localStorage.setItem('debug', 'true');

// Просмотр в консоли браузера
console.log('WebSocket статус:', isConnected);
console.log('Сообщения:', messages);
```

### Проверка WebSocket

```javascript
// В консоли браузера
const ws = new WebSocket('ws://localhost:8000/ws/stream/test-session');
ws.onopen = () => console.log('WebSocket открыт');
ws.onmessage = (event) => console.log('Получено:', event.data);
ws.onerror = (error) => console.error('Ошибка:', error);
```

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env`:

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_D_ID_API_KEY=your_d_id_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Настройки разработки

```javascript
// vite.config.js
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  }
}
```

## 📱 Поддерживаемые браузеры

- **Chrome** 88+
- **Firefox** 85+
- **Safari** 14+
- **Edge** 88+

### Требования

- WebSocket API
- Web Audio API
- File API
- Base64 поддержка

## 🚀 Развертывание

### Netlify

```bash
# Сборка
npm run build

# Развертывание
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Развертывание
vercel --prod
```

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи: `git checkout -b feature/amazing-feature`
3. Зафиксируйте изменения: `git commit -m 'Add amazing feature'`
4. Отправьте в ветку: `git push origin feature/amazing-feature`
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

- **Документация**: [FRONTEND_INTEGRATION_GUIDE.md](../FRONTEND_INTEGRATION_GUIDE.md)
- **Issues**: Создайте issue в GitHub
- **Discussions**: Используйте GitHub Discussions

---

*Создано для демонстрации возможностей D-ID WebSocket API* 🎭
