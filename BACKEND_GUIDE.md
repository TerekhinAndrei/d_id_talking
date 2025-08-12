# Руководство по Backend

## 🏗️ Архитектура Backend

### Технологический стек
- **FastAPI** - современный веб-фреймворк для Python
- **Uvicorn** - ASGI сервер
- **Pydantic** - валидация данных
- **Celery** - фоновые задачи (опционально)
- **SQLAlchemy** - ORM для работы с БД (опционально)

### Структура проекта
```
app/
├── __init__.py
├── main.py                 # Точка входа приложения
├── api/
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py
│       └── endpoints/      # API endpoints
├── core/
│   ├── __init__.py
│   ├── config.py          # Конфигурация
│   └── security.py        # Безопасность
├── models/                # Pydantic модели
├── services/              # Бизнес-логика
│   ├── d_id_service.py
│   ├── elevenlabs_service.py
│   └── cloudinary_service.py
└── utils/                 # Утилиты
```

## 🚀 Установка и настройка

### 1. Установка зависимостей
```bash
# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установка зависимостей
pip install -r requirements.txt
```

### 2. Настройка переменных окружения
```bash
# Копирование примера конфигурации
cp env.example .env

# Редактирование .env файла
nano .env
```

### 3. Обязательные переменные окружения
```env
# D-ID API
D_ID_API_KEY=your_d_id_api_key
D_ID_API_URL=https://api.d-id.com

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_API_URL=https://api.elevenlabs.io

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Настройки приложения
DEBUG=true
HOST=0.0.0.0
PORT=3001
```

### 4. Запуск сервера
```bash
# Режим разработки
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload

# Продакшн режим
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001
```

## 📡 API Endpoints

### Основные endpoints

#### POST /api/v1/generate
Генерация говорящего аватара.

**Параметры:**
- `image_file`: Изображение (multipart/form-data)
- `audio_file`: Аудио файл (multipart/form-data)
- `voice_id`: ID голоса ElevenLabs

**Ответ:**
```json
{
  "task_id": "uuid",
  "status": "processing",
  "progress": 0
}
```

#### GET /api/v1/status/{task_id}
Получение статуса генерации.

**Ответ:**
```json
{
  "task_id": "uuid",
  "status": "completed",
  "progress": 100,
  "video_url": "https://...",
  "error_message": null
}
```

#### GET /api/v1/voices
Получение доступных голосов ElevenLabs.

**Ответ:**
```json
[
  {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "category": "premade"
  }
]
```

## 🔧 Сервисы

### D-ID Service
```python
# app/services/d_id_service.py
class DIdService:
    def __init__(self, api_key: str, api_url: str):
        self.api_key = api_key
        self.api_url = api_url
    
    async def create_talk(self, image_url: str, audio_url: str) -> str:
        """Создание задачи генерации видео"""
        pass
    
    async def get_talk_status(self, talk_id: str) -> dict:
        """Получение статуса генерации"""
        pass
```

### ElevenLabs Service
```python
# app/services/elevenlabs_service.py
class ElevenLabsService:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def process_audio(self, audio_file: bytes, voice_id: str) -> bytes:
        """Обработка аудио через Speech-to-Speech"""
        pass
    
    async def get_voices(self) -> List[dict]:
        """Получение списка доступных голосов"""
        pass
```

### Cloudinary Service
```python
# app/services/cloudinary_service.py
class CloudinaryService:
    def __init__(self, cloudinary_url: str):
        self.cloudinary_url = cloudinary_url
    
    async def upload_file(self, file: bytes, folder: str) -> str:
        """Загрузка файла в Cloudinary"""
        pass
    
    async def delete_file(self, public_id: str) -> bool:
        """Удаление файла из Cloudinary"""
        pass
```

## 🧪 Тестирование

### Запуск тестов
```bash
# Все тесты
python -m pytest tests/

# Конкретный тест
python -m pytest tests/test_d_id_service.py

# С покрытием
python -m pytest --cov=app tests/
```

### Тестирование внешних API
```bash
# Тест полного flow
python test_full_flow.py

# Тест D-ID API
python test_d_id_service.py
```

### Мокирование внешних сервисов
```python
# tests/conftest.py
import pytest
from unittest.mock import Mock

@pytest.fixture
def mock_d_id_service():
    return Mock()

@pytest.fixture
def mock_elevenlabs_service():
    return Mock()
```

## 🔒 Безопасность

### Защита API ключей
```python
# app/core/security.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    d_id_api_key: str
    elevenlabs_api_key: str
    cloudinary_url: str
    
    class Config:
        env_file = ".env"
```

### Валидация файлов
```python
# app/utils/file_validator.py
def validate_image_file(file: UploadFile) -> bool:
    """Валидация изображения"""
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    return file.content_type in allowed_types

def validate_audio_file(file: UploadFile) -> bool:
    """Валидация аудио файла"""
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp3"]
    return file.content_type in allowed_types
```

## 📊 Логирование

### Настройка логов
```python
# app/core/logging.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
```

### Структурированные логи
```python
import structlog

logger = structlog.get_logger()

logger.info("Processing video generation", 
           task_id=task_id, 
           user_id=user_id)
```

## 🚨 Обработка ошибок

### Кастомные исключения
```python
# app/core/exceptions.py
class DIdAPIError(Exception):
    pass

class ElevenLabsAPIError(Exception):
    pass

class FileProcessingError(Exception):
    pass
```

### Middleware для обработки ошибок
```python
# app/middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse

async def error_handler_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)}
        )
```

## 🔄 Фоновые задачи

### Celery для асинхронных задач
```python
# app/tasks/video_generation.py
from celery import Celery

celery_app = Celery("video_generation")

@celery_app.task
def generate_video_task(image_url: str, audio_url: str, voice_id: str):
    """Фоновая задача генерации видео"""
    pass
```

## 📈 Мониторинг

### Health check endpoint
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}
```

### Метрики производительности
```python
# app/middleware/metrics.py
import time
from fastapi import Request

async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Логирование метрик
    logger.info("Request processed", 
               path=request.url.path,
               method=request.method,
               duration=process_time)
    
    return response
```

## 🐛 Устранение неполадок

### Частые проблемы

1. **Ошибки D-ID API**
   - Проверьте API ключ
   - Убедитесь в лимитах запросов
   - Проверьте формат изображения

2. **Ошибки ElevenLabs**
   - Проверьте API ключ
   - Убедитесь в правильности voice_id
   - Проверьте формат аудио файла

3. **Проблемы с Cloudinary**
   - Проверьте учетные данные
   - Убедитесь в доступности сервиса
   - Проверьте размер файлов

### Debug режим
```bash
# Включение debug режима
export DEBUG=true
python -m uvicorn app.main:app --reload
```

### Логи
```bash
# Просмотр логов
tail -f backend.log

# Поиск ошибок
grep "ERROR" backend.log
```
