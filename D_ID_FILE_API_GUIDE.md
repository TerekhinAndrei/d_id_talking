# D-ID File API Guide

## Обзор

Новый D-ID File API позволяет загружать изображения и аудиофайлы непосредственно в D-ID временное хранилище, следуя принципам ООП и SOLID архитектуры.

## Архитектура

### Принципы SOLID

1. **Single Responsibility Principle (SRP)**: `DIdFileService` отвечает только за операции с файлами D-ID
2. **Open/Closed Principle (OCP)**: Расширяемость через интерфейсы
3. **Liskov Substitution Principle (LSP)**: Реализация интерфейса `IDIdFileService`
4. **Interface Segregation Principle (ISP)**: Специфичные интерфейсы для файловых операций
5. **Dependency Inversion Principle (DIP)**: Зависимость от абстракций

### Компоненты

- `IDIdFileService` - интерфейс для файловых операций
- `DIdFileService` - реализация сервиса
- `DIdFileUploadRequest` - модель запроса загрузки
- `DIdFileUploadResponse` - модель ответа загрузки

## API Endpoints

### 1. Загрузка изображения в D-ID

**POST** `/api/v1/d-id-files/upload/image`

```bash
curl -X POST "http://localhost:8000/api/v1/d-id-files/upload/image" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg"
```

**Ответ:**
```json
{
  "success": true,
  "message": "Image uploaded successfully to D-ID",
  "data": {
    "file_id": "d-id-file-id-123",
    "url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/...",
    "created_at": "2024-01-01T12:00:00Z",
    "expires_at": "2024-01-03T12:00:00Z"
  }
}
```

### 2. Загрузка аудио в D-ID

**POST** `/api/v1/d-id-files/upload/audio`

```bash
curl -X POST "http://localhost:8000/api/v1/d-id-files/upload/audio" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3"
```

**Ответ:**
```json
{
  "success": true,
  "message": "Audio uploaded successfully to D-ID",
  "data": {
    "file_id": "d-id-file-id-456",
    "url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/...",
    "created_at": "2024-01-01T12:00:00Z",
    "expires_at": "2024-01-03T12:00:00Z"
  }
}
```

### 3. Удаление изображения из D-ID

**DELETE** `/api/v1/d-id-files/images/{file_id}`

```bash
curl -X DELETE "http://localhost:8000/api/v1/d-id-files/images/d-id-file-id-123"
```

### 4. Удаление аудио из D-ID

**DELETE** `/api/v1/d-id-files/audios/{file_id}`

```bash
curl -X DELETE "http://localhost:8000/api/v1/d-id-files/audios/d-id-file-id-456"
```

### 5. Тест аутентификации

**GET** `/api/v1/d-id-files/test-auth`

```bash
curl -X GET "http://localhost:8000/api/v1/d-id-files/test-auth"
```

## Гибридные Endpoints (Совместимость с фронтендом)

### Загрузка с выбором хранилища

**POST** `/api/v1/storage/upload/image`

```bash
# Загрузка в Cloudinary (по умолчанию)
curl -X POST "http://localhost:8000/api/v1/storage/upload/image" \
  -F "file=@image.jpg"

# Загрузка в D-ID
curl -X POST "http://localhost:8000/api/v1/storage/upload/image?use_d_id=true" \
  -F "file=@image.jpg"
```

**POST** `/api/v1/storage/upload/audio`

```bash
# Загрузка в Cloudinary (по умолчанию)
curl -X POST "http://localhost:8000/api/v1/storage/upload/audio" \
  -F "file=@audio.mp3"

# Загрузка в D-ID
curl -X POST "http://localhost:8000/api/v1/storage/upload/audio?use_d_id=true" \
  -F "file=@audio.mp3"
```

### Удаление с выбором хранилища

**DELETE** `/api/v1/storage/files/{file_id}`

```bash
# Удаление из Cloudinary (по умолчанию)
curl -X DELETE "http://localhost:8000/api/v1/storage/files/cloudinary-file-id"

# Удаление из D-ID
curl -X DELETE "http://localhost:8000/api/v1/storage/files/d-id-file-id?storage_type=d_id"
```

## Конфигурация

### Переменные окружения

```bash
# D-ID API ключ
D_ID_API_KEY=your-d-id-api-key-here

# D-ID базовый URL (опционально)
D_ID_BASE_URL=https://api.d-id.com
```

### Поддерживаемые форматы

**Изображения:**
- JPEG (.jpg, .jpeg)
- PNG (.png)

**Аудио:**
- Любые форматы с MIME-типами `audio/` или `video/`

### Ограничения

- Имя файла: до 50 символов
- Допустимые символы: a-z, A-Z, 0-9, ., _, -
- Время хранения: 24-48 часов

## Использование в коде

### Создание сервиса

```python
from app.core.factory import get_d_id_file_service
from app.core.base import ConfigurationProvider
from app.core.config import settings

config_provider = ConfigurationProvider(settings)
d_id_file_service = get_d_id_file_service(config_provider)
```

### Загрузка файла

```python
from app.core.interfaces import DIdFileUploadRequest

# Загрузка изображения
request = DIdFileUploadRequest(
    file_data=image_bytes,
    filename="image.jpg",
    content_type="image/jpeg"
)
response = await d_id_file_service.upload_image(request)

# Загрузка аудио
request = DIdFileUploadRequest(
    file_data=audio_bytes,
    filename="audio.mp3",
    content_type="audio/mpeg"
)
response = await d_id_file_service.upload_audio(request)
```

### Удаление файла

```python
# Удаление изображения
success = await d_id_file_service.delete_image(file_id)

# Удаление аудио
success = await d_id_file_service.delete_audio(file_id)
```

## Обработка ошибок

### Типы исключений

- `DIdFileServiceError` - общие ошибки сервиса
- `DIdFileConfigurationError` - ошибки конфигурации
- `DIdFileAPIError` - ошибки API D-ID

### Пример обработки

```python
try:
    response = await d_id_file_service.upload_image(request)
    print(f"File uploaded: {response.file_id}")
except DIdFileConfigurationError as e:
    print(f"Configuration error: {e}")
except DIdFileAPIError as e:
    print(f"API error {e.status_code}: {e.message}")
except DIdFileServiceError as e:
    print(f"Service error: {e}")
```

## Совместимость с фронтендом

Фронтенд продолжает работать без изменений:

1. **Существующие эндпоинты** `/api/v1/storage/upload/*` работают как раньше
2. **Новые параметры** `use_d_id` и `storage_type` опциональны
3. **Формат ответа** остается совместимым
4. **Обработка ошибок** не изменилась

## Тестирование

### Запуск тестов

```bash
# Тест без API ключа (проверка структуры)
python3 test_d_id_file_service.py

# Тест с API ключом
D_ID_API_KEY=your-key python3 test_d_id_file_service.py
```

### Тестирование через API

```bash
# Тест аутентификации
curl -X GET "http://localhost:8000/api/v1/d-id-files/test-auth"

# Тест загрузки (с реальным файлом)
curl -X POST "http://localhost:8000/api/v1/d-id-files/upload/image" \
  -F "file=@/path/to/real/image.jpg"
```

## Преимущества нового подхода

1. **Прямая интеграция** с D-ID API
2. **Временное хранилище** - файлы автоматически удаляются через 24-48 часов
3. **Совместимость** с существующим фронтендом
4. **Гибкость** - выбор между Cloudinary и D-ID
5. **Принципы SOLID** - чистая архитектура
6. **Обработка ошибок** - детальная диагностика
7. **Валидация** - проверка форматов и ограничений
