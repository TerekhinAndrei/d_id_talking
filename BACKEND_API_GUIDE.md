# 🚀 Backend API Guide
## Подробное руководство по использованию бэкенда D-ID Talking Head

### 📋 Содержание
1. [Обзор API](#обзор-api)
2. [Базовые настройки](#базовые-настройки)
3. [Health Endpoints](#health-endpoints)
4. [Streaming Endpoints](#streaming-endpoints)
5. [WebRTC Endpoints](#webrtc-endpoints)
6. [Generation Endpoints](#generation-endpoints)
7. [Users Endpoints](#users-endpoints)
8. [Tasks Endpoints](#tasks-endpoints)
9. [WebSocket Endpoints](#websocket-endpoints)
10. [Обработка ошибок](#обработка-ошибок)
11. [Примеры использования](#примеры-использования)

---

## Обзор API

Backend API построен на FastAPI и предоставляет полный набор endpoints для работы с D-ID API, WebRTC стримингом, генерацией видео и управлением пользователями.

### 🔧 Технологии
- **FastAPI** - Современный веб-фреймворк
- **Pydantic** - Валидация данных
- **WebSocket** - Реальное время
- **D-ID API** - Интеграция с D-ID для генерации видео
- **ElevenLabs API** - Интеграция с ElevenLabs для TTS/STS
- **WebRTC** - Потоковая передача аудио/видео
- **aiohttp** - Асинхронные HTTP запросы

### 📡 Базовый URL
```
http://localhost:8000/api/v1
```

---

## Базовые настройки

### 🔑 Переменные окружения
```bash
# D-ID API Settings
D_ID_API_KEY=your-d-id-api-key-here
D_ID_BASE_URL=https://api.d-id.com

# ElevenLabs API Settings
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_DEFAULT_MODEL=eleven_monolingual_v1
ELEVENLABS_STS_MODEL=eleven_multilingual_v2

# Server Settings
PORT=8000
HOST=0.0.0.0
DEBUG=true

# CORS Settings
ALLOWED_HOSTS=["http://localhost:3000", "http://localhost:3001"]
```

### 📋 Headers
```http
Content-Type: application/json
Accept: application/json
```

---

## Health Endpoints

### 🔍 Проверка состояния API

#### GET `/health`
**Описание:** Базовая проверка состояния API

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": 1703123456.789,
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET `/health/detailed`
**Описание:** Подробная проверка состояния всех сервисов

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": 1703123456.789,
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "api": "healthy",
    "database": "unknown",
    "redis": "unknown"
  }
}
```

#### GET `/health/config`
**Описание:** Проверка конфигурации приложения

**Ответ:**
```json
{
  "status": "config_loaded",
  "timestamp": 1703123456.789,
  "config": {
    "project_name": "D-ID Talking Head",
    "version": "1.0.0",
    "environment": "development",
    "api_v1_str": "/api/v1",
    "host": "0.0.0.0",
    "port": 8000,
    "debug": true,
    "database_url_configured": false,
    "redis_url_configured": false,
    "secret_key_configured": true,
    "algorithm": "HS256",
    "access_token_expire_minutes": 30,
    "allowed_hosts": ["http://localhost:3000", "http://localhost:3001"]
  }
}
```

---

## Streaming Endpoints

### 🎬 Управление стримами

#### POST `/streaming/start`
**Описание:** Создание нового стрима

**Запрос:**
```json
{
  "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  "description": "Тестовый стрим"
}
```

**Ответ:**
```json
{
  "success": true,
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "sdp_offer": "v=0\r\no=- 1754579753355781...",
  "ice_servers": [
    {
      "urls": ["stun:stun.cloudflare.com:3478"],
      "username": "g0ae145e29b47ed282809217f470f0a9fb90d85af12ba24f461cceb51d113e03",
      "credential": "ff6f9cb4c36bb043bbe752e7c90a81299ec932c12b037125f1211d93602ec726"
    }
  ],
  "error": null
}
```

#### POST `/streaming/{stream_id}/sdp`
**Описание:** Обмен SDP для WebRTC соединения

**Запрос:**
```json
{
  "answer": {
    "type": "answer",
    "sdp": "v=0\r\no=- 1754579753355781..."
  },
  "session_id": "AWSALB=..."
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "SDP exchange successful",
  "error": null
}
```

#### POST `/streaming/{stream_id}/ice`
**Описание:** Отправка ICE candidate

**Запрос:**
```json
{
  "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
  "sdpMid": "0",
  "sdpMLineIndex": 0,
  "session_id": "AWSALB=..."
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "ICE candidate submitted",
  "error": null
}
```

#### POST `/streaming/{stream_id}/talk`
**Описание:** Создание talk стрима

**Запрос:**
```json
{
  "script": {
    "type": "text",
    "provider": {
      "type": "elevenlabs",
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "input": "Hello! This is a test message."
  },
  "config": {
    "fluent": "false",
    "pad_audio": "0.0"
  },
  "audio_optimization": "2",
  "session_id": "AWSALB=..."
}
```

**Ответ:**
```json
{
  "success": true,
  "talk_id": "tlk_uZ0XLz1M1tzdQkeT_wQM1",
  "status": "started",
  "message": "Talk stream created successfully",
  "error": null
}
```

#### DELETE `/streaming/{stream_id}`
**Описание:** Закрытие стрима

**Запрос:**
```json
{
  "session_id": "AWSALB=..."
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Stream closed successfully",
  "error": null
}
```

### 🎵 ElevenLabs интеграция

#### GET `/streaming/elevenlabs-voices`
**Описание:** Получение списка голосов ElevenLabs

**Ответ:**
```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "Professional female voice"
    }
  ],
  "error": null
}
```

#### POST `/streaming/process-audio`
**Описание:** Обработка аудио через ElevenLabs

**Запрос:**
```json
{
  "audio_data": "base64_encoded_audio_data",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

**Ответ:**
```json
{
  "success": true,
  "processed_audio": "base64_encoded_processed_audio",
  "message": "Audio processed successfully",
  "error": null
}
```

#### POST `/streaming/process-text`
**Описание:** Преобразование текста в речь

**Запрос:**
```json
{
  "text": "Hello! This is a test message.",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "model_id": "eleven_multilingual_v2"
}
```

**Ответ:**
```json
{
  "success": true,
  "audio_data": "base64_encoded_audio_data",
  "message": "Text processed successfully",
  "error": null
}
```

### 🔄 Упрощенные endpoints

#### POST `/streaming/create-stream`
**Описание:** Создание стрима с изображением

**Запрос:**
```json
{
  "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  "image_data": "base64_encoded_image_data"
}
```

#### POST `/streaming/get-sdp`
**Описание:** Получение SDP данных

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=..."
}
```

#### POST `/streaming/submit-sdp-answer`
**Описание:** Отправка SDP answer

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "answer": {
    "type": "answer",
    "sdp": "v=0\r\no=- 1754579753355781..."
  }
}
```

#### POST `/streaming/submit-ice-candidate`
**Описание:** Отправка ICE candidate

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
  "sdpMid": "0",
  "sdpMLineIndex": 0
}
```

#### POST `/streaming/create-talk-stream`
**Описание:** Создание talk стрима

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "script": {
    "type": "text",
    "provider": {
      "type": "elevenlabs",
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "input": "Hello! This is a test message."
  },
  "config": {
    "fluent": "false",
    "pad_audio": "0.0"
  },
  "audio_optimization": "2"
}
```

---

## WebRTC Endpoints

### 🌐 WebRTC управление

#### POST `/webrtc/streams`
**Описание:** Создание WebRTC стрима

**Запрос:**
```json
{
  "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
}
```

**Ответ:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "offer": {
    "type": "offer",
    "sdp": "v=0\r\no=- 1754579753355781..."
  },
  "ice_servers": [
    {
      "urls": ["stun:stun.cloudflare.com:3478"],
      "username": "g0ae145e29b47ed282809217f470f0a9fb90d85af12ba24f461cceb51d113e03",
      "credential": "ff6f9cb4c36bb043bbe752e7c90a81299ec932c12b037125f1211d93602ec726"
    }
  ]
}
```

#### POST `/webrtc/streams/sdp`
**Описание:** Установка WebRTC соединения

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "answer": "v=0\r\no=- 1754579753355781..."
}
```

#### POST `/webrtc/streams/ice`
**Описание:** Отправка ICE candidate

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
  "sdp_mid": "0",
  "sdp_m_line_index": 0
}
```

#### POST `/webrtc/streams/talk`
**Описание:** Создание talk стрима

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=...",
  "script": {
    "type": "text",
    "provider": {
      "type": "elevenlabs",
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "input": "Hello! This is a test message."
  },
  "driver_url": "bank://lively/",
  "config": {
    "fluent": "false",
    "pad_audio": "0.0"
  }
}
```

#### DELETE `/webrtc/streams`
**Описание:** Удаление стрима

**Запрос:**
```json
{
  "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "session_id": "AWSALB=..."
}
```

#### GET `/webrtc/streams/{stream_id}/status`
**Описание:** Получение статуса стрима

**Ответ:**
```json
{
  "status": "success",
  "data": {
    "stream_id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
    "status": "active",
    "created_at": "2025-08-07T15:15:53Z",
    "updated_at": "2025-08-07T15:15:55Z"
  }
}
```

---

## Generation Endpoints

### 🎬 Генерация видео

#### POST `/generation/generate`
**Описание:** Генерация видео с изображением и аудио

**Запрос (multipart/form-data):**
```
image_file: [файл изображения]
audio_file: [файл аудио]
voice_id: "21m00Tcm4TlvDq8ikWAM" (опционально)
```

**Ответ:**
```json
{
  "success": true,
  "task_id": "task_uuid",
  "message": "Video generation task created",
  "estimated_duration": 30
}
```

#### GET `/generation/status/{task_id}`
**Описание:** Получение статуса задачи генерации

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "task_uuid",
    "status": "completed",
    "progress": 100.0,
    "result_url": "https://example.com/video.mp4",
    "created_at": "2025-08-07T15:15:53Z",
    "updated_at": "2025-08-07T15:16:23Z"
  },
  "message": "Task completed successfully"
}
```

### 🎤 ElevenLabs Integration

#### GET `/generation/voices`
**Описание:** Получение списка доступных голосов ElevenLabs

**Ответ:**
```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "Professional female voice"
    },
    {
      "voice_id": "EXAVITQu4vr4xnSDxMaL",
      "name": "Sarah",
      "category": "premade",
      "description": "Young adult woman with a confident and warm tone"
    }
  ]
}
```

#### GET `/generation/test-auth`
**Описание:** Тест аутентификации с ElevenLabs API

**Ответ:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "message": "ElevenLabs authentication successful",
    "voices_count": 48,
    "timestamp": "2025-08-07T17:36:28.525285+00:00"
  },
  "message": "ElevenLabs authentication successful"
}
```

#### POST `/generation/play-voice`
**Описание:** Воспроизведение голоса с предварительным прослушиванием

**Запрос:**
```json
{
  "voice_id": "EXAVITQu4vr4xnSDxMaL",
  "preview_text": "Привет! Это тест голоса."
}
```

**Ответ:**
```json
{
  "success": true,
  "audio_data": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//uQxAA...",
  "format": "mp3",
  "sample_rate": 44100,
  "bitrate": "128k",
  "message": "Voice preview generated successfully"
}
```

#### POST `/generation/tts`
**Описание:** Преобразование текста в речь (Text-to-Speech)

**Запрос:**
```json
{
  "text": "Привет! Это тест TTS.",
  "voice_id": "EXAVITQu4vr4xnSDxMaL"
}
```

**Ответ:**
```json
{
  "success": true,
  "audio_data": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//uQxAA...",
  "format": "mp3",
  "sample_rate": 44100,
  "bitrate": "128k",
  "message": "Text converted to speech successfully"
}
```

#### POST `/generation/sts`
**Описание:** Преобразование речи в речь (Speech-to-Speech)

**Запрос (multipart/form-data):**
```
audio_file: [файл аудио]
voice_id: "EXAVITQu4vr4xnSDxMaL"
```

**Ответ:**
```json
{
  "success": true,
  "audio_data": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//uQxAA...",
  "format": "mp3",
  "sample_rate": 44100,
  "bitrate": "128k",
  "message": "Speech converted successfully"
}
```

#### GET `/generation/voices/validate/{voice_id}`
**Описание:** Валидация голоса

**Ответ:**
```json
{
  "success": true,
  "valid": true,
  "voice": {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "category": "premade"
  }
}
```

#### GET `/generation/voices/{voice_id}`
**Описание:** Получение информации о конкретном голосе

**Ответ:**
```json
{
  "success": true,
  "voice": {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "category": "premade",
    "description": "Professional female voice",
    "settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }
}
```

---

## Users Endpoints

### 👥 Управление пользователями

#### GET `/users/`
**Описание:** Получение списка пользователей

**Параметры:**
- `skip`: int = 0 (пропустить записей)
- `limit`: int = 100 (максимум записей)

**Ответ:**
```json
[
  {
    "id": "user_uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2025-08-07T15:15:53Z",
    "updated_at": "2025-08-07T15:15:53Z"
  }
]
```

#### GET `/users/{user_id}`
**Описание:** Получение пользователя по ID

**Ответ:**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2025-08-07T15:15:53Z",
  "updated_at": "2025-08-07T15:15:53Z"
}
```

#### POST `/users/`
**Описание:** Создание нового пользователя

**Запрос:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "secure_password",
  "is_active": true
}
```

**Ответ:**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2025-08-07T15:15:53Z",
  "updated_at": "2025-08-07T15:15:53Z"
}
```

#### PUT `/users/{user_id}`
**Описание:** Обновление пользователя

**Запрос:**
```json
{
  "email": "newemail@example.com",
  "full_name": "John Smith",
  "is_active": false
}
```

#### DELETE `/users/{user_id}`
**Описание:** Удаление пользователя

**Ответ:** 204 No Content

---

## Tasks Endpoints

### 📋 Управление задачами

#### GET `/tasks/`
**Описание:** Получение списка задач с фильтрацией и пагинацией

**Параметры:**
- `page`: int = 1 (номер страницы)
- `per_page`: int = 20 (записей на страницу)
- `status`: TaskStatus (фильтр по статусу)
- `task_type`: TaskType (фильтр по типу)
- `priority`: TaskPriority (фильтр по приоритету)
- `user_id`: str (фильтр по пользователю)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_uuid",
      "title": "Generate Video",
      "description": "Create talking head video",
      "task_type": "video_generation",
      "priority": "medium",
      "status": "completed",
      "user_id": "user_uuid",
      "created_at": "2025-08-07T15:15:53Z",
      "updated_at": "2025-08-07T15:16:23Z",
      "progress": 100.0,
      "input_data": {
        "image_url": "https://example.com/image.jpg",
        "audio_url": "https://example.com/audio.mp3"
      },
      "estimated_duration": 30,
      "metadata": {}
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "message": "Retrieved 1 tasks"
}
```

#### GET `/tasks/{task_id}`
**Описание:** Получение задачи по ID

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "task_uuid",
    "title": "Generate Video",
    "description": "Create talking head video",
    "task_type": "video_generation",
    "priority": "medium",
    "status": "completed",
    "user_id": "user_uuid",
    "created_at": "2025-08-07T15:15:53Z",
    "updated_at": "2025-08-07T15:16:23Z",
    "progress": 100.0,
    "input_data": {},
    "estimated_duration": 30,
    "metadata": {}
  },
  "message": "Task retrieved successfully"
}
```

#### POST `/tasks/`
**Описание:** Создание новой задачи

**Запрос:**
```json
{
  "title": "Generate Video",
  "description": "Create talking head video",
  "task_type": "video_generation",
  "priority": "medium",
  "user_id": "user_uuid",
  "input_data": {
    "image_url": "https://example.com/image.jpg",
    "audio_url": "https://example.com/audio.mp3"
  },
  "estimated_duration": 30,
  "metadata": {}
}
```

#### PUT `/tasks/{task_id}`
**Описание:** Обновление задачи

**Запрос:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "high",
  "status": "in_progress"
}
```

#### DELETE `/tasks/{task_id}`
**Описание:** Удаление задачи

**Ответ:** 204 No Content

#### GET `/tasks/{task_id}/progress`
**Описание:** Получение прогресса задачи

**Ответ:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_uuid",
    "progress": 75.5,
    "status": "in_progress",
    "current_step": "Processing audio",
    "estimated_remaining": 15
  },
  "message": "Progress retrieved successfully"
}
```

#### POST `/tasks/{task_id}/start`
**Описание:** Запуск задачи

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "task_uuid",
    "status": "in_progress",
    "progress": 0.0,
    "started_at": "2025-08-07T15:15:53Z"
  },
  "message": "Task started successfully"
}
```

#### POST `/tasks/{task_id}/complete`
**Описание:** Завершение задачи

**Запрос:**
```json
{
  "output_data": {
    "video_url": "https://example.com/video.mp4",
    "duration": 30.5
  }
}
```

#### GET `/tasks/stats/overview`
**Описание:** Статистика задач

**Ответ:**
```json
{
  "success": true,
  "data": {
    "total_tasks": 100,
    "completed_tasks": 75,
    "pending_tasks": 15,
    "failed_tasks": 5,
    "in_progress_tasks": 5,
    "average_completion_time": 45.5,
    "success_rate": 0.95
  },
  "message": "Statistics retrieved successfully"
}
```

---

## WebSocket Endpoints

### 🔌 WebSocket соединения

#### WebSocket `/ws/test`
**Описание:** Тестовое WebSocket соединение

**Подключение:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/test');
```

**Сообщения:**
```json
// От сервера при подключении
{
  "type": "connection_status",
  "status": "connected",
  "message": "Test WebSocket connected"
}

// От клиента
{
  "type": "test_message",
  "data": "Hello server"
}

// От сервера в ответ
{
  "type": "test_response",
  "message": "Test message received",
  "data": {
    "type": "test_message",
    "data": "Hello server"
  }
}
```

#### WebSocket `/ws/stream-simple`
**Описание:** Простое WebSocket стриминг

**Подключение:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stream-simple');
```

#### WebSocket `/ws/stream`
**Описание:** Полноценное WebSocket стриминг с D-ID

**Подключение:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stream');
```

**Сообщения:**
```json
// Инициализация стрима
{
  "type": "init_stream",
  "source_url": "https://example.com/image.jpg",
  "presenter_type": "talk"
}

// Текст в речь
{
  "type": "text_to_speech",
  "text": "Hello! This is a test message.",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}

// Речь в речь
{
  "type": "speech_to_speech",
  "audio_data": "base64_encoded_audio",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

---

## Обработка ошибок

### 🔴 HTTP Status Codes

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс создан
- **400 Bad Request** - Неверный запрос
- **401 Unauthorized** - Не авторизован
- **403 Forbidden** - Доступ запрещен
- **404 Not Found** - Ресурс не найден
- **422 Unprocessable Entity** - Ошибка валидации
- **500 Internal Server Error** - Внутренняя ошибка сервера

### 📝 Формат ошибок

```json
{
  "detail": "Описание ошибки",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-08-07T15:15:53Z"
}
```

### 🎯 Типичные ошибки

#### 400 Bad Request
```json
{
  "detail": "Invalid request data",
  "error_code": "VALIDATION_ERROR"
}
```

#### 401 Unauthorized
```json
{
  "detail": "Invalid API key",
  "error_code": "AUTHENTICATION_ERROR"
}
```

#### 404 Not Found
```json
{
  "detail": "Stream not found",
  "error_code": "RESOURCE_NOT_FOUND"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

---

## Примеры использования

### 🚀 Python клиент

```python
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Создание стрима
def create_stream(image_url):
    response = requests.post(f"{BASE_URL}/streaming/start", json={
        "image_url": image_url,
        "description": "Test stream"
    })
    return response.json()

# Обмен SDP
def exchange_sdp(stream_id, session_id, sdp_answer):
    response = requests.post(f"{BASE_URL}/streaming/{stream_id}/sdp", json={
        "answer": {
            "type": "answer",
            "sdp": sdp_answer
        },
        "session_id": session_id
    })
    return response.json()

# Создание talk
def create_talk(stream_id, session_id, text, voice_id):
    response = requests.post(f"{BASE_URL}/streaming/{stream_id}/talk", json={
        "script": {
            "type": "text",
            "provider": {
                "type": "elevenlabs",
                "voice_id": voice_id
            },
            "input": text
        },
        "config": {
            "fluent": "false",
            "pad_audio": "0.0"
        },
        "session_id": session_id
    })
    return response.json()

# ElevenLabs функции
def get_voices():
    """Получение списка голосов ElevenLabs"""
    response = requests.get(f"{BASE_URL}/generation/voices")
    return response.json()

def test_elevenlabs_auth():
    """Тест аутентификации ElevenLabs"""
    response = requests.get(f"{BASE_URL}/generation/test-auth")
    return response.json()

def play_voice(voice_id, preview_text):
    """Воспроизведение голоса"""
    response = requests.post(f"{BASE_URL}/generation/play-voice", json={
        "voice_id": voice_id,
        "preview_text": preview_text
    })
    return response.json()

def text_to_speech(text, voice_id):
    """Преобразование текста в речь"""
    response = requests.post(f"{BASE_URL}/generation/tts", json={
        "text": text,
        "voice_id": voice_id
    })
    return response.json()

def speech_to_speech(audio_file_path, voice_id):
    """Преобразование речи в речь"""
    with open(audio_file_path, 'rb') as audio_file:
        files = {'audio_file': audio_file}
        data = {'voice_id': voice_id}
        response = requests.post(f"{BASE_URL}/generation/sts", files=files, data=data)
    return response.json()

# Использование
stream_data = create_stream("https://example.com/image.jpg")
print(f"Stream created: {stream_data['stream_id']}")

# ElevenLabs примеры
voices = get_voices()
print(f"Available voices: {len(voices['voices'])}")

auth_test = test_elevenlabs_auth()
print(f"Auth status: {auth_test['data']['status']}")

voice_preview = play_voice("EXAVITQu4vr4xnSDxMaL", "Привет! Это тест.")
print(f"Voice preview generated: {len(voice_preview['audio_data'])} chars")

tts_result = text_to_speech("Hello! This is a test.", "EXAVITQu4vr4xnSDxMaL")
print(f"TTS generated: {len(tts_result['audio_data'])} chars")
```

### 🌐 JavaScript клиент

```javascript
const API_BASE = 'http://localhost:8000/api/v1';

// Создание стрима
async function createStream(imageUrl) {
    const response = await fetch(`${API_BASE}/streaming/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_url: imageUrl,
            description: 'Test stream'
        })
    });
    return await response.json();
}

// Обмен SDP
async function exchangeSdp(streamId, sessionId, sdpAnswer) {
    const response = await fetch(`${API_BASE}/streaming/${streamId}/sdp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answer: {
                type: 'answer',
                sdp: sdpAnswer
            },
            session_id: sessionId
        })
    });
    return await response.json();
}

// Создание talk
async function createTalk(streamId, sessionId, text, voiceId) {
    const response = await fetch(`${API_BASE}/streaming/${streamId}/talk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            script: {
                type: 'text',
                provider: {
                    type: 'elevenlabs',
                    voice_id: voiceId
                },
                input: text
            },
            config: {
                fluent: 'false',
                pad_audio: '0.0'
            },
            session_id: sessionId
        })
    });
    return await response.json();
}

// ElevenLabs функции
async function getVoices() {
    const response = await fetch(`${API_BASE}/generation/voices`);
    return await response.json();
}

async function testElevenLabsAuth() {
    const response = await fetch(`${API_BASE}/generation/test-auth`);
    return await response.json();
}

async function playVoice(voiceId, previewText) {
    const response = await fetch(`${API_BASE}/generation/play-voice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            voice_id: voiceId,
            preview_text: previewText
        })
    });
    return await response.json();
}

async function textToSpeech(text, voiceId) {
    const response = await fetch(`${API_BASE}/generation/tts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            voice_id: voiceId
        })
    });
    return await response.json();
}

async function speechToSpeech(audioFile, voiceId) {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('voice_id', voiceId);
    
    const response = await fetch(`${API_BASE}/generation/sts`, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

// Использование
const streamData = await createStream('https://example.com/image.jpg');
console.log(`Stream created: ${streamData.stream_id}`);

// ElevenLabs примеры
const voices = await getVoices();
console.log(`Available voices: ${voices.voices.length}`);

const authTest = await testElevenLabsAuth();
console.log(`Auth status: ${authTest.data.status}`);

const voicePreview = await playVoice('EXAVITQu4vr4xnSDxMaL', 'Привет! Это тест.');
console.log(`Voice preview generated: ${voicePreview.audio_data.length} chars`);

const ttsResult = await textToSpeech('Hello! This is a test.', 'EXAVITQu4vr4xnSDxMaL');
console.log(`TTS generated: ${ttsResult.audio_data.length} chars`);

// Воспроизведение аудио
function playAudioFromBase64(base64Data) {
    const audio = new Audio(`data:audio/mp3;base64,${base64Data}`);
    audio.play();
}

// Пример воспроизведения
playAudioFromBase64(voicePreview.audio_data);
```

### 🔌 WebSocket клиент

```
```