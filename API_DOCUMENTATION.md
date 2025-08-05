# API Documentation - AI Animator

## Обзор

API для асинхронной обработки файлов изображений и аудио с целью создания анимированных видео.

## Базовый URL

```
http://localhost:8000/api/v1
```

## Эндпоинты

### 1. Создание задачи генерации

**POST** `/generate`

Создает новую задачу для обработки изображения и аудио файлов.

#### Параметры запроса

- `image_file` (обязательный): Файл изображения
  - Поддерживаемые форматы: JPEG, JPG, PNG, GIF, WebP
  - Максимальный размер: 10MB
  
- `audio_file` (обязательный): Аудио файл
  - Поддерживаемые форматы: MP3, WAV, OGG, M4A
  - Максимальный размер: 50MB

#### Пример запроса

```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -F "image_file=@photo.jpg;type=image/jpeg" \
  -F "audio_file=@voice.mp3;type=audio/mpeg"
```

#### Пример ответа

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "processing"
}
```

#### Коды ответов

- `200 OK`: Задача успешно создана
- `400 Bad Request`: Неподдерживаемый тип файла
- `422 Unprocessable Entity`: Отсутствуют обязательные файлы

### 2. Проверка статуса задачи

**GET** `/status/{task_id}`

Возвращает текущий статус задачи по её ID.

#### Параметры пути

- `task_id` (обязательный): Уникальный идентификатор задачи

#### Пример запроса

```bash
curl http://localhost:8000/api/v1/status/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

#### Пример ответа

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "processing",
  "progress": 60.0,
  "created_at": "2025-08-05T11:02:52.333179",
  "updated_at": "2025-08-05T11:02:58.338624",
  "result_url": null,
  "error_message": null
}
```

#### Возможные статусы

- `processing`: Задача в процессе обработки
- `completed`: Задача завершена успешно
- `failed`: Задача завершена с ошибкой
- `cancelled`: Задача отменена

#### Коды ответов

- `200 OK`: Статус получен успешно
- `404 Not Found`: Задача не найдена

### 3. Список всех задач

**GET** `/tasks`

Возвращает список всех задач генерации.

#### Пример запроса

```bash
curl http://localhost:8000/api/v1/tasks
```

#### Пример ответа

```json
[
  {
    "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "completed",
    "progress": 100.0,
    "created_at": "2025-08-05T11:02:52.333179",
    "updated_at": "2025-08-05T11:03:02.340784",
    "result_url": "/results/a1b2c3d4-e5f6-7890-1234-567890abcdef/animation.mp4",
    "error_message": null
  }
]
```

### 4. Отмена задачи

**DELETE** `/tasks/{task_id}`

Отменяет задачу по её ID.

#### Параметры пути

- `task_id` (обязательный): Уникальный идентификатор задачи

#### Пример запроса

```bash
curl -X DELETE http://localhost:8000/api/v1/tasks/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

#### Коды ответов

- `204 No Content`: Задача успешно отменена
- `400 Bad Request`: Невозможно отменить завершенную задачу
- `404 Not Found`: Задача не найдена

## Модели данных

### GenerationResponse

```json
{
  "task_id": "string",
  "status": "processing"
}
```

### GenerationStatusResponse

```json
{
  "task_id": "string",
  "status": "processing|completed|failed|cancelled",
  "progress": 0.0-100.0,
  "created_at": "datetime",
  "updated_at": "datetime",
  "result_url": "string|null",
  "error_message": "string|null"
}
```

## Обработка ошибок

### 422 Unprocessable Entity

Возвращается при отсутствии обязательных файлов:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "audio_file"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

### 400 Bad Request

Возвращается при неподдерживаемом типе файла:

```json
{
  "detail": "Неподдерживаемый тип файла для изображения. Поддерживаемые типы: image/jpeg, image/jpg, image/png, image/gif, image/webp"
}
```

## Фоновая обработка

После создания задачи запускается фоновая обработка, которая:

1. Анализирует изображение
2. Обрабатывает аудио
3. Синхронизирует данные
4. Генерирует анимацию
5. Выполняет финальную обработку

Прогресс обновляется каждые 2 секунды на 20%.

## Логирование

В консоли сервера отображаются следующие сообщения:

```
🎯 Создана новая задача генерации: a1b2c3d4-e5f6-7890-1234-567890abcdef
   📸 Изображение: image.jpg
   🎵 Аудио: audio.mp3
🚀 Запускаю фоновую обработку для задачи a1b2c3d4-e5f6-7890-1234-567890abcdef
   📁 Обрабатываю файлы: image.jpg, audio.mp3
   📊 Прогресс: 20% - Анализ изображения...
   📊 Прогресс: 40% - Обработка аудио...
   📊 Прогресс: 60% - Синхронизация данных...
   📊 Прогресс: 80% - Генерация анимации...
   📊 Прогресс: 100% - Финальная обработка...
✅ Задача a1b2c3d4-e5f6-7890-1234-567890abcdef завершена успешно!
```

## Тестирование

### Создание тестовых файлов

```bash
# Создание тестового изображения
echo "fake image data" > test_image.jpg

# Создание тестового аудио
echo "fake audio data" > test_audio.mp3
```

### Тестирование эндпоинтов

```bash
# Создание задачи
curl -X POST http://localhost:8000/api/v1/generate \
  -F "image_file=@test_image.jpg;type=image/jpeg" \
  -F "audio_file=@test_audio.mp3;type=audio/mpeg"

# Проверка статуса (замените task_id на полученный)
curl http://localhost:8000/api/v1/status/{task_id}

# Список всех задач
curl http://localhost:8000/api/v1/tasks
```

## Swagger документация

Интерактивная документация доступна по адресу:
```
http://localhost:8000/docs
``` 