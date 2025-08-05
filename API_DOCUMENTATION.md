# API Documentation - D-ID Talking Platform

## Обзор

API для генерации говорящих видео с использованием AI технологий. Интегрирует ElevenLabs для синтеза речи и D-ID для создания анимированных говорящих аватаров.

## Базовый URL

```
http://localhost:3001/api/v1
```

## Аутентификация

API использует API ключи для внешних сервисов:
- **ElevenLabs**: `xi-api-key` header
- **D-ID**: Basic Authentication
- **Cloudinary**: URL credentials

## Эндпоинты

### 1. Health Check

**GET** `/health`

Проверка состояния сервиса.

#### Пример запроса

```bash
curl http://localhost:3001/api/v1/health
```

#### Пример ответа

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-08-05T20:30:00Z"
}
```

### 2. Список голосов (ElevenLabs)

**GET** `/voices`

Возвращает список доступных голосов ElevenLabs.

#### Пример запроса

```bash
curl http://localhost:3001/api/v1/voices
```

#### Пример ответа

```json
{
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "A middle-aged female with an African-American accent..."
    },
    {
      "voice_id": "EXAVITQu4vr4xnSDxMaL",
      "name": "Sarah",
      "category": "premade",
      "description": "Young adult woman with a confident and warm, mature voice..."
    }
  ]
}
```

### 3. Информация о голосе

**GET** `/voices/{voice_id}`

Возвращает детальную информацию о конкретном голосе.

#### Параметры пути

- `voice_id` (обязательный): ID голоса ElevenLabs

#### Пример запроса

```bash
curl http://localhost:3001/api/v1/voices/21m00Tcm4TlvDq8ikWAM
```

#### Пример ответа

```json
{
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "name": "Rachel",
  "category": "premade",
  "description": "A middle-aged female with an African-American accent...",
  "labels": {
    "accent": "african-american",
    "age": "middle-aged",
    "gender": "female"
  }
}
```

### 4. Валидация голоса

**GET** `/voices/{voice_id}/validate`

Проверяет существование и доступность голоса.

#### Параметры пути

- `voice_id` (обязательный): ID голоса для валидации

#### Пример запроса

```bash
curl http://localhost:3001/api/v1/voices/21m00Tcm4TlvDq8ikWAM/validate
```

#### Пример ответа

```json
{
  "valid": true,
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

### 5. Создание задачи генерации видео

**POST** `/generate`

Создает новую задачу для генерации говорящего видео из изображения и аудио.

#### Параметры запроса

- `image_file` (обязательный): Файл изображения
  - Поддерживаемые форматы: JPEG, JPG, PNG, GIF, WebP
  - Максимальный размер: 10MB
  
- `audio_file` (обязательный): Аудио файл
  - Поддерживаемые форматы: MP3, WAV, OGG, M4A
  - Максимальный размер: 50MB

- `voice_id` (опциональный): ID голоса ElevenLabs
  - По умолчанию: `21m00Tcm4TlvDq8ikWAM` (Rachel)

#### Пример запроса

```bash
curl -X POST http://localhost:3001/api/v1/generate \
  -F "image_file=@photo.jpg;type=image/jpeg" \
  -F "audio_file=@voice.mp3;type=audio/mpeg" \
  -F "voice_id=21m00Tcm4TlvDq8ikWAM"
```

#### Пример ответа

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "processing",
  "progress": 0
}
```

#### Коды ответов

- `200 OK`: Задача успешно создана
- `400 Bad Request`: Неподдерживаемый тип файла
- `422 Unprocessable Entity`: Отсутствуют обязательные файлы
- `500 Internal Server Error`: Ошибка сервиса

### 6. Проверка статуса задачи

**GET** `/status/{task_id}`

Возвращает текущий статус задачи по её ID.

#### Параметры пути

- `task_id` (обязательный): Уникальный идентификатор задачи

#### Пример запроса

```bash
curl http://localhost:3001/api/v1/status/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

#### Пример ответа

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "processing",
  "progress": 85,
  "video_url": null,
  "error_message": null,
  "talk_id": "tlk_abc123def456"
}
```

#### Возможные статусы

- `processing`: Задача в процессе обработки
- `completed`: Задача завершена успешно
- `failed`: Задача завершена с ошибкой

#### Коды ответов

- `200 OK`: Статус получен успешно
- `404 Not Found`: Задача не найдена

## Обработка ошибок

### Стандартный формат ошибки

```json
{
  "detail": "Описание ошибки",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-08-05T20:30:00Z"
}
```

### Коды ошибок

- `INVALID_FILE_TYPE`: Неподдерживаемый тип файла
- `FILE_TOO_LARGE`: Файл превышает максимальный размер
- `MISSING_REQUIRED_FILES`: Отсутствуют обязательные файлы
- `ELEVENLABS_ERROR`: Ошибка ElevenLabs API
- `D_ID_ERROR`: Ошибка D-ID API
- `CLOUDINARY_ERROR`: Ошибка Cloudinary API
- `TASK_NOT_FOUND`: Задача не найдена
- `INTERNAL_ERROR`: Внутренняя ошибка сервера

## CORS

API поддерживает CORS для фронтенд интеграции:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Лимиты

- **Размер файла изображения**: 10MB
- **Размер аудио файла**: 50MB
- **Время обработки**: До 5 минут
- **Одновременные задачи**: 10 на пользователя

## Примеры использования

### Полный цикл генерации видео

```bash
# 1. Создание задачи
curl -X POST http://localhost:3001/api/v1/generate \
  -F "image_file=@avatar.jpg" \
  -F "audio_file=@speech.mp3"

# Ответ: {"task_id": "abc123", "status": "processing"}

# 2. Проверка статуса
curl http://localhost:3001/api/v1/status/abc123

# Ответ: {"status": "completed", "video_url": "https://..."}
```

### Получение списка голосов

```bash
curl http://localhost:3001/api/v1/voices | jq '.voices[0:3]'
```

## Тестирование

Для тестирования API используйте:

```bash
# Быстрая проверка
python3 test_quick_check.py

# Комплексное тестирование
python3 test_external_services_comprehensive.py

# Тестирование Backend API
python3 test_backend_api_comprehensive.py
``` 