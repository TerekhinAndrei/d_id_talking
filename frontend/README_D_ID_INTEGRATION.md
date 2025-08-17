# D-ID API Integration Guide

## 📋 Обзор

В проекте реализована интеграция с двумя различными API D-ID:

1. **🎥 D-ID Streaming API** - для живых стримов в реальном времени
2. **🎬 D-ID Video Talks API** - для создания готовых видео

## 🎥 D-ID Streaming API (Живые стримы)

### Назначение
Создание живых стримов в реальном времени с использованием WebRTC.

### Основные компоненты

#### Сервис
```typescript
import { dIdStreamingService } from '../services';

// Создание стрима
const stream = await dIdStreamingService.createStream(imageUrl, description);

// Подключение к стриму
await dIdStreamingService.connect(streamId, sessionId, sdpAnswer);

// Отправка текста для озвучивания
await dIdStreamingService.sendText(streamId, sessionId, text, voiceId);

// Отправка аудио для воспроизведения
await dIdStreamingService.sendAudio(streamId, sessionId, audioUrl);
```

#### React хук
```typescript
import { useDIdStreaming } from '../hooks';

const {
  isConnected,
  streamId,
  sessionId,
  createStream,
  connect,
  sendText,
  sendAudio,
  disconnect
} = useDIdStreaming();
```

#### API методы (ApiService)
- `createDIdStream()` - создание стрима
- `startDIdStream()` - запуск стрима
- `createDIdStreamTalk()` - отправка текста в стрим
- `createDIdStreamTalkAudio()` - отправка аудио в стрим
- `submitDIdIceCandidate()` - ICE кандидаты
- `closeDIdStream()` - закрытие стрима

### Использование
```typescript
// Создание и подключение к стриму
const stream = await createStream(imageUrl, "Описание стрима");
await connect(stream.streamId, stream.sessionId, sdpAnswer);

// Отправка текста для озвучивания
await sendText(stream.streamId, stream.sessionId, "Привет, мир!", "en-US-JennyNeural");

// Отправка аудио для воспроизведения
await sendAudio(stream.streamId, stream.sessionId, "https://example.com/audio.mp3");
```

---

## 🎬 D-ID Video Talks API (Создание видео)

### Назначение
Создание готовых видео с анимированными говорящими головами.

### Основные компоненты

#### Сервис
```typescript
import { dIdVideoTalksService } from '../services';

// Создание видео с текстом
const videoTalk = await dIdVideoTalksService.createVideoTalkWithText(
  imageUrl, 
  "Текст для озвучивания",
  { voiceId: "en-US-JennyNeural" }
);

// Создание видео с аудио
const videoTalk = await dIdVideoTalksService.createVideoTalkWithAudio(
  imageUrl, 
  audioUrl
);

// Создание видео с файлами (автозагрузка)
const videoTalk = await dIdVideoTalksService.createVideoTalkWithFiles(
  imageFile, 
  audioFile
);
```

#### React хук
```typescript
import { useDIdVideoTalks } from '../hooks';

const {
  isLoading,
  videoUrl,
  createAndMonitorVideoTalkWithText,
  createAndMonitorVideoTalkWithAudio,
  createAndMonitorVideoTalkWithFiles,
  cancelVideoTalk
} = useDIdVideoTalks();
```

#### API методы (ApiService)
- `createDIdVideoTalk()` - создание видео talk с произвольным script
- `createDIdVideoTalkWithText()` - создание видео с текстом
- `createDIdVideoTalkWithAudio()` - создание видео с аудио
- `createDIdVideoTalkWithFiles()` - создание видео с файлами
- `getDIdVideoTalkStatus()` - получение статуса
- `monitorDIdVideoTalkStatus()` - мониторинг статуса
- `cancelDIdVideoTalk()` - отмена создания

### Использование
```typescript
// Создание видео с текстом и мониторинг
const result = await createAndMonitorVideoTalkWithText(
  imageUrl,
  "Привет, это тестовое видео!",
  { voiceId: "en-US-JennyNeural" }
);

// Получение URL готового видео
const videoUrl = result.finalStatus.data.result_url;

// Создание видео с файлами
const result = await createAndMonitorVideoTalkWithFiles(
  imageFile,
  audioFile,
  { stitch: true }
);
```

---

## 🔄 Ключевые различия

| Аспект | D-ID Streaming API | D-ID Video Talks API |
|--------|-------------------|---------------------|
| **Тип** | Живые стримы | Готовые видео |
| **Время** | Реальное время | Асинхронная обработка |
| **Результат** | WebRTC поток | URL готового видео |
| **Использование** | Интерактивные приложения | Создание контента |
| **Сложность** | Высокая (WebRTC) | Средняя (HTTP API) |

## 📁 Структура файлов

### Streaming API
```
services/
├── streaming/
│   └── DIdStreamingService.ts
hooks/
├── useDIdStreaming.ts
components/
├── DIdStreamingTester.tsx
```

### Video Talks API
```
services/
├── dIdVideoTalksService.ts
hooks/
├── useDIdVideoTalks.ts
components/
├── DIdVideoTalksDemo.tsx
```

### Общие
```
services/
├── api/
│   └── ApiService.ts (содержит методы для обоих API)
types/
└── index.ts (типы для обоих API)
```

## 🚀 Быстрый старт

### Для живых стримов
```typescript
import { useDIdStreaming } from '../hooks';

function StreamingComponent() {
  const { createStream, connect, sendText } = useDIdStreaming();
  
  const handleStartStream = async () => {
    const stream = await createStream(imageUrl, "Мой стрим");
    await connect(stream.streamId, stream.sessionId, sdpAnswer);
    await sendText(stream.streamId, stream.sessionId, "Привет!");
  };
}
```

### Для создания видео
```typescript
import { useDIdVideoTalks } from '../hooks';

function VideoComponent() {
  const { createAndMonitorVideoTalkWithText, videoUrl } = useDIdVideoTalks();
  
  const handleCreateVideo = async () => {
    await createAndMonitorVideoTalkWithText(
      imageUrl,
      "Текст для видео",
      { voiceId: "en-US-JennyNeural" }
    );
  };
  
  return (
    <div>
      <button onClick={handleCreateVideo}>Создать видео</button>
      {videoUrl && <video src={videoUrl} controls />}
    </div>
  );
}
```

## ⚠️ Важные замечания

1. **Не путайте API**: Streaming API для живых стримов, Video Talks API для готовых видео
2. **Разные эндпоинты**: Streaming использует `/api/v1/streaming/*`, Video Talks использует `/api/v1/d-id-talks/*`
3. **Разные сервисы**: Используйте соответствующие сервисы и хуки
4. **Разные типы**: У каждого API свои типы данных и интерфейсы

## 🎯 Рекомендации

- **Для интерактивных приложений** → используйте D-ID Streaming API
- **Для создания контента** → используйте D-ID Video Talks API
- **Для тестирования** → используйте соответствующие демо компоненты
- **Для продакшена** → настройте webhook'и для Video Talks API
