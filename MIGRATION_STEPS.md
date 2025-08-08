# Детальный план миграции API

## Подготовка (30 минут)

### 1. Создать резервные копии
```bash
# Создать ветку для миграции
git checkout -b api-restructure-migration

# Создать резервные копии текущих файлов
cp app/api/v1/endpoints/generation.py app/api/v1/endpoints/generation.py.backup
cp app/api/v1/endpoints/streaming.py app/api/v1/endpoints/streaming.py.backup
cp app/api/v1/endpoints/webrtc.py app/api/v1/endpoints/webrtc.py.backup
cp frontend/src/services/api.js frontend/src/services/api.js.backup
```

### 2. Создать новые файлы эндпоинтов
```bash
# Создать новые файлы
touch app/api/v1/endpoints/voices.py
touch app/api/v1/endpoints/tts.py
touch app/api/v1/endpoints/video.py
touch app/api/v1/endpoints/storage.py
```

---

## Этап 1: Создание voices.py (1 час)

### 1.1 Создать базовую структуру
```python
# app/api/v1/endpoints/voices.py
"""
Voice management endpoints
"""
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException

from app.models.common import Voice, GetVoicesResponse
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

logger = logging.getLogger(__name__)
router = APIRouter(tags=["voices"])

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "tts_service": container.get_tts_service(),
        "config_provider": config_provider
    }
```

### 1.2 Перенести эндпоинты голосов из generation.py
```python
@router.get("/", response_model=Dict[str, Any])
async def get_voices(services: Dict[str, Any] = Depends(get_services)):
    """Get list of available voices"""
    # Копировать код из generation.py

@router.get("/{voice_id}", response_model=Dict[str, Any])
async def get_voice(voice_id: str, services: Dict[str, Any] = Depends(get_services)):
    """Get specific voice information"""
    # Копировать код из generation.py

@router.get("/{voice_id}/validate", response_model=Dict[str, Any])
async def validate_voice(voice_id: str, services: Dict[str, Any] = Depends(get_services)):
    """Validate voice ID"""
    # Копировать код из generation.py

@router.get("/test-auth", response_model=Dict[str, Any])
async def test_elevenlabs_auth(services: Dict[str, Any] = Depends(get_services)):
    """Test ElevenLabs authentication"""
    # Копировать код из generation.py
```

---

## Этап 2: Создание tts.py (1 час)

### 2.1 Создать базовую структуру
```python
# app/api/v1/endpoints/tts.py
"""
Text-to-Speech and Speech-to-Speech endpoints
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form

from app.models.common import TTSRequest, PlayVoiceRequest
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

logger = logging.getLogger(__name__)
router = APIRouter(tags=["tts"])

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "tts_service": container.get_tts_service(),
        "config_provider": config_provider
    }
```

### 2.2 Перенести TTS эндпоинты
```python
@router.post("/text-to-speech", response_model=Dict[str, Any])
async def text_to_speech(request: TTSRequest, services: Dict[str, Any] = Depends(get_services)):
    """Convert text to speech"""
    # Копировать код из generation.py

@router.post("/speech-to-speech", response_model=Dict[str, Any])
async def speech_to_speech(
    audio: UploadFile = File(...),
    voice_id: str = Form(...),
    voice_settings: Optional[str] = Form(None),
    services: Dict[str, Any] = Depends(get_services)
):
    """Convert speech to speech (voice changer)"""
    # Копировать код из generation.py

@router.post("/play-voice", response_model=Dict[str, Any])
async def play_voice(request: PlayVoiceRequest, services: Dict[str, Any] = Depends(get_services)):
    """Play voice preview"""
    # Копировать код из generation.py
```

---

## Этап 3: Создание video.py (1 час)

### 3.1 Создать базовую структуру
```python
# app/api/v1/endpoints/video.py
"""
Video generation endpoints
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks

from app.models.common import VideoGenerationRequest
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

logger = logging.getLogger(__name__)
router = APIRouter(tags=["video"])

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "video_generator": container.get_video_generator(),
        "storage_service": container.get_storage_service(),
        "task_manager": container.get_task_manager(),
        "audio_processor": container.get_audio_processor(),
        "config_provider": config_provider
    }
```

### 3.2 Перенести видео эндпоинты
```python
@router.post("/generate", response_model=Dict[str, Any])
async def generate_video(
    image_file: UploadFile = File(...),
    audio_file: UploadFile = File(...),
    voice_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    services: Dict[str, Any] = Depends(get_services)
):
    """Generate video from image and audio files"""
    # Копировать код из generation.py

@router.get("/status/{task_id}", response_model=Dict[str, Any])
async def get_task_status(task_id: str, services: Dict[str, Any] = Depends(get_services)):
    """Get video generation task status"""
    # Копировать код из generation.py
```

---

## Этап 4: Создание storage.py (30 минут)

### 4.1 Создать базовую структуру
```python
# app/api/v1/endpoints/storage.py
"""
File storage endpoints
"""
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile

from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

logger = logging.getLogger(__name__)
router = APIRouter(tags=["storage"])

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "storage_service": container.get_storage_service(),
        "config_provider": config_provider
    }
```

### 4.2 Перенести upload эндпоинты
```python
@router.post("/upload/image", response_model=Dict[str, Any])
async def upload_image(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload image file"""
    # Копировать код из streaming.py

@router.post("/upload/audio", response_model=Dict[str, Any])
async def upload_audio(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload audio file"""
    # Создать новый эндпоинт
```

---

## Этап 5: Обновление api.py (30 минут)

### 5.1 Обновить импорты
```python
# app/api/v1/api.py
from app.api.v1.endpoints import health, users, tasks, voices, tts, video, streaming, storage
```

### 5.2 Обновить роутеры
```python
# Новая структура роутеров
api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(voices.router, prefix="/voices", tags=["voices"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(streaming.router, prefix="/streaming", tags=["streaming"])
api_router.include_router(storage.router, prefix="/storage", tags=["storage"])
```

---

## Этап 6: Очистка streaming.py (1 час)

### 6.1 Удалить дублирующие эндпоинты
```python
# Удалить из streaming.py:
# - /elevenlabs-voices (перенесен в voices)
# - /process-text (перенесен в tts)
# - /stream-audio (перенесен в tts)
# - /voice-changer-stream (перенесен в tts)
# - /upload/image (перенесен в storage)
```

### 6.2 Оставить только WebRTC стриминг
```python
# Оставить в streaming.py:
# - /start
# - /{stream_id}/sdp
# - /{stream_id}/ice
# - /{stream_id}/talk
# - /{stream_id} (DELETE)
# - /{stream_id}/status
# - /sessions
```

---

## Этап 7: Обновление фронтенда (2 часа)

### 7.1 Обновить API сервис
```javascript
// frontend/src/services/api.js

// Voices
async getVoices() {
  return this.request('/voices');
}

async getVoice(voiceId) {
  return this.request(`/voices/${voiceId}`);
}

async validateVoice(voiceId) {
  return this.request(`/voices/${voiceId}/validate`);
}

async testElevenLabsAuth() {
  return this.request('/voices/test-auth');
}

// TTS
async textToSpeech(text, voiceId, settings = null) {
  return this.request('/tts/text-to-speech', {
    method: 'POST',
    body: JSON.stringify({ text, voice_id: voiceId, voice_settings: settings }),
  });
}

async speechToSpeech(audioFile, voiceId, settings = null) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('voice_id', voiceId);
  if (settings) {
    formData.append('voice_settings', JSON.stringify(settings));
  }
  return this.request('/tts/speech-to-speech', {
    method: 'POST',
    body: formData,
  });
}

async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
  return this.request('/tts/play-voice', {
    method: 'POST',
    body: JSON.stringify({ voice_id: voiceId, text: previewText }),
  });
}

// Video
async generateVideo(imageFile, audioFile, voiceId = null, settings = null) {
  const formData = new FormData();
  formData.append('image_file', imageFile);
  formData.append('audio_file', audioFile);
  if (voiceId) {
    formData.append('voice_id', voiceId);
  }
  if (settings) {
    formData.append('voice_settings', JSON.stringify(settings));
  }
  return this.request('/video/generate', {
    method: 'POST',
    body: formData,
  });
}

async getTaskStatus(taskId) {
  return this.request(`/video/status/${taskId}`);
}

// Storage
async uploadToCloudinary(formData) {
  return this.request('/storage/upload/image', {
    method: 'POST',
    body: formData,
  });
}
```

### 7.2 Обновить хуки
```javascript
// frontend/src/hooks/useVoices.js
const response = await fetch('/api/v1/voices');
```

---

## Этап 8: Тестирование (2 часа)

### 8.1 Тестировать новые эндпоинты
```bash
# Тест voices
curl -X GET "http://localhost:8000/api/v1/voices"

# Тест tts
curl -X POST "http://localhost:8000/api/v1/tts/text-to-speech" \
  -H "Content-Type: application/json" \
  -d '{"text":"Привет","voice_id":"EXAVITQu4vr4xnSDxMaL"}'

# Тест video
curl -X GET "http://localhost:8000/api/v1/video/status/test-task"

# Тест storage
curl -X POST "http://localhost:8000/api/v1/storage/upload/image" \
  -F "file=@test_image.jpg"
```

### 8.2 Тестировать фронтенд
- [ ] Загрузка голосов
- [ ] TTS/STS
- [ ] Генерация видео
- [ ] Стриминг
- [ ] Загрузка файлов

---

## Этап 9: Очистка (1 час)

### 9.1 Удалить старые эндпоинты
```python
# Удалить из generation.py:
# - /voices
# - /voices/{voice_id}
# - /voices/validate/{voice_id}
# - /test-auth
# - /tts
# - /sts
# - /play-voice
# - /generate
# - /status/{task_id}
```

### 9.2 Удалить дублирующие эндпоинты
```python
# Удалить из streaming.py:
# - /elevenlabs-voices
# - /process-text
# - /stream-audio
# - /voice-changer-stream
# - /upload/image
```

### 9.3 Удалить webrtc.py (если дублирует streaming)
```bash
# Если webrtc.py дублирует функциональность streaming.py
rm app/api/v1/endpoints/webrtc.py
```

---

## Этап 10: Документация (30 минут)

### 10.1 Обновить README
```markdown
# API Endpoints

## Voices
- `GET /api/v1/voices/` - Get all voices
- `GET /api/v1/voices/{voice_id}` - Get voice info
- `GET /api/v1/voices/{voice_id}/validate` - Validate voice
- `GET /api/v1/voices/test-auth` - Test authentication

## TTS
- `POST /api/v1/tts/text-to-speech` - Convert text to speech
- `POST /api/v1/tts/speech-to-speech` - Convert speech to speech
- `POST /api/v1/tts/play-voice` - Play voice preview

## Video
- `POST /api/v1/video/generate` - Generate video
- `GET /api/v1/video/status/{task_id}` - Get task status

## Streaming
- `POST /api/v1/streaming/start` - Start stream
- `POST /api/v1/streaming/{stream_id}/sdp` - Exchange SDP
- `POST /api/v1/streaming/{stream_id}/ice` - Exchange ICE
- `DELETE /api/v1/streaming/{stream_id}` - Close stream

## Storage
- `POST /api/v1/storage/upload/image` - Upload image
- `POST /api/v1/storage/upload/audio` - Upload audio
```

### 10.2 Создать миграционный гайд
```markdown
# API Migration Guide

## Changes
- Voices moved from `/generation/voices` to `/voices/`
- TTS moved from `/generation/tts` to `/tts/text-to-speech`
- STS moved from `/generation/sts` to `/tts/speech-to-speech`
- Video generation moved from `/generation/generate` to `/video/generate`
- Upload moved from `/streaming/upload/image` to `/storage/upload/image`

## Breaking Changes
- All voice-related endpoints now use `/voices/` prefix
- All TTS endpoints now use `/tts/` prefix
- All video endpoints now use `/video/` prefix
- All storage endpoints now use `/storage/` prefix
```

---

## Проверочный список

### Перед миграцией:
- [ ] Создать резервные копии
- [ ] Создать ветку для миграции
- [ ] Протестировать текущую функциональность

### После миграции:
- [ ] Все новые эндпоинты работают
- [ ] Фронтенд использует новые пути
- [ ] Старые эндпоинты удалены
- [ ] Дублирование устранено
- [ ] Тесты проходят
- [ ] Документация обновлена

### Финальная проверка:
- [ ] Загрузка голосов работает
- [ ] TTS/STS работает
- [ ] Генерация видео работает
- [ ] Стриминг работает
- [ ] Загрузка файлов работает
- [ ] Нет ошибок в консоли
- [ ] Нет дублирующих эндпоинтов
