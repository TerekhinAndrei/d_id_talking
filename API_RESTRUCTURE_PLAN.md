# План полной реструктуризации API

## Текущее состояние (проблемы):
1. **Дублирование функциональности** между модулями
2. **Смешанная ответственность** в роутерах
3. **Нелогичная группировка** эндпоинтов
4. **Сложная навигация** для фронтенда
5. **Отсутствие единообразия** в именовании

## Цель реструктуризации:
Создать чистую, логичную и масштабируемую архитектуру API с четким разделением ответственности.

---

## Этап 1: Анализ и планирование (1-2 часа)

### 1.1 Аудит текущих эндпоинтов
- [ ] Составить полный список всех эндпоинтов
- [ ] Выявить дублирование функциональности
- [ ] Определить ответственность каждого модуля
- [ ] Проанализировать использование фронтендом

### 1.2 Определение новой структуры
- [ ] Создать схему новой архитектуры
- [ ] Определить домены и их границы
- [ ] Спланировать миграцию данных
- [ ] Создать план тестирования

---

## Этап 2: Создание новых модулей (2-3 часа)

### 2.1 Создать новые файлы эндпоинтов:

#### `/app/api/v1/endpoints/voices.py`
```python
# Управление голосами ElevenLabs
@router.get("/")                    # Список всех голосов
@router.get("/{voice_id}")          # Информация о голосе
@router.get("/{voice_id}/validate") # Валидация голоса
@router.get("/test-auth")           # Тест аутентификации
```

#### `/app/api/v1/endpoints/tts.py`
```python
# Text-to-Speech и Speech-to-Speech
@router.post("/text-to-speech")     # TTS
@router.post("/speech-to-speech")   # STS (voice changer)
@router.post("/play-voice")         # Воспроизведение голоса
```

#### `/app/api/v1/endpoints/video.py`
```python
# Генерация видео
@router.post("/generate")           # Генерация видео
@router.get("/status/{task_id}")    # Статус задачи
```

#### `/app/api/v1/endpoints/streaming.py` (обновленный)
```python
# WebRTC стриминг (только стриминг)
@router.post("/start")              # Создание стрима
@router.post("/{stream_id}/sdp")    # Обмен SDP
@router.post("/{stream_id}/ice")    # Обмен ICE
@router.post("/{stream_id}/talk")   # Создание talk stream
@router.delete("/{stream_id}")      # Закрытие стрима
@router.get("/{stream_id}/status")  # Статус стрима
@router.get("/sessions")            # Список сессий
```

#### `/app/api/v1/endpoints/storage.py`
```python
# Управление файлами
@router.post("/upload/image")       # Загрузка изображения
@router.post("/upload/audio")       # Загрузка аудио
```

### 2.2 Обновить `/app/api/v1/api.py`
```python
# Новая структура роутеров
api_router.include_router(voices.router, prefix="/voices", tags=["voices"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(streaming.router, prefix="/streaming", tags=["streaming"])
api_router.include_router(storage.router, prefix="/storage", tags=["storage"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
```

---

## Этап 3: Миграция эндпоинтов (3-4 часа)

### 3.1 Перенести эндпоинты голосов
- [ ] Перенести `/generation/voices` → `/voices/`
- [ ] Перенести `/generation/voices/{voice_id}` → `/voices/{voice_id}`
- [ ] Перенести `/generation/voices/validate/{voice_id}` → `/voices/{voice_id}/validate`
- [ ] Перенести `/generation/test-auth` → `/voices/test-auth`
- [ ] Удалить `/streaming/elevenlabs-voices` (дубликат)

### 3.2 Перенести TTS эндпоинты
- [ ] Перенести `/generation/tts` → `/tts/text-to-speech`
- [ ] Перенести `/generation/sts` → `/tts/speech-to-speech`
- [ ] Перенести `/generation/play-voice` → `/tts/play-voice`
- [ ] Удалить `/streaming/process-text` (дубликат)
- [ ] Удалить `/streaming/stream-audio` (дубликат)

### 3.3 Перенести видео эндпоинты
- [ ] Перенести `/generation/generate` → `/video/generate`
- [ ] Перенести `/generation/status/{task_id}` → `/video/status/{task_id}`

### 3.4 Очистить streaming модуль
- [ ] Оставить только WebRTC стриминг
- [ ] Удалить voice changer из streaming
- [ ] Удалить upload из streaming
- [ ] Удалить дублирующие WebRTC эндпоинты

### 3.5 Создать storage модуль
- [ ] Перенести `/streaming/upload/image` → `/storage/upload/image`
- [ ] Добавить `/storage/upload/audio`

---

## Этап 4: Обновление фронтенда (2-3 часа)

### 4.1 Обновить API сервис
- [ ] Обновить все URL в `frontend/src/services/api.js`
- [ ] Обновить хуки в `frontend/src/hooks/`
- [ ] Обновить компоненты

### 4.2 Обновить константы
- [ ] Обновить `frontend/src/constants/index.js`
- [ ] Обновить fallback голоса

### 4.3 Обновить типы
- [ ] Обновить `frontend/src/types/index.js`

---

## Этап 5: Тестирование (2-3 часа)

### 5.1 Бэкенд тесты
- [ ] Обновить существующие тесты
- [ ] Создать новые тесты для новых модулей
- [ ] Проверить все эндпоинты

### 5.2 Фронтенд тесты
- [ ] Обновить тесты компонентов
- [ ] Проверить интеграционные тесты
- [ ] Проверить E2E тесты

### 5.3 Ручное тестирование
- [ ] Проверить все функции приложения
- [ ] Проверить загрузку голосов
- [ ] Проверить TTS/STS
- [ ] Проверить генерацию видео
- [ ] Проверить стриминг

---

## Этап 6: Очистка и документация (1-2 часа)

### 6.1 Удаление старых файлов
- [ ] Удалить дублирующие эндпоинты
- [ ] Очистить неиспользуемый код
- [ ] Удалить старые модели

### 6.2 Обновление документации
- [ ] Обновить README
- [ ] Обновить API документацию
- [ ] Создать миграционный гайд

### 6.3 Обновление конфигурации
- [ ] Обновить OpenAPI схему
- [ ] Обновить CORS настройки
- [ ] Обновить логирование

---

## Новые пути API:

### Voices (голоса)
```
GET    /api/v1/voices/                    # Список голосов
GET    /api/v1/voices/{voice_id}          # Информация о голосе
GET    /api/v1/voices/{voice_id}/validate # Валидация голоса
GET    /api/v1/voices/test-auth           # Тест аутентификации
```

### TTS (text-to-speech)
```
POST   /api/v1/tts/text-to-speech        # TTS
POST   /api/v1/tts/speech-to-speech      # STS (voice changer)
POST   /api/v1/tts/play-voice            # Воспроизведение голоса
```

### Video (видео)
```
POST   /api/v1/video/generate            # Генерация видео
GET    /api/v1/video/status/{task_id}    # Статус задачи
```

### Streaming (стриминг)
```
POST   /api/v1/streaming/start           # Создание стрима
POST   /api/v1/streaming/{stream_id}/sdp # Обмен SDP
POST   /api/v1/streaming/{stream_id}/ice # Обмен ICE
POST   /api/v1/streaming/{stream_id}/talk # Создание talk stream
DELETE /api/v1/streaming/{stream_id}     # Закрытие стрима
GET    /api/v1/streaming/{stream_id}/status # Статус стрима
GET    /api/v1/streaming/sessions        # Список сессий
```

### Storage (файлы)
```
POST   /api/v1/storage/upload/image      # Загрузка изображения
POST   /api/v1/storage/upload/audio      # Загрузка аудио
```

### Tasks (задачи)
```
GET    /api/v1/tasks/                    # Список задач
GET    /api/v1/tasks/{task_id}           # Информация о задаче
POST   /api/v1/tasks/{task_id}/start     # Запуск задачи
POST   /api/v1/tasks/{task_id}/complete  # Завершение задачи
GET    /api/v1/tasks/stats/overview      # Статистика задач
```

### Users (пользователи)
```
GET    /api/v1/users/                    # Список пользователей
GET    /api/v1/users/{user_id}           # Информация о пользователе
```

### Health (мониторинг)
```
GET    /api/v1/health/                   # Базовый health check
GET    /api/v1/health/config             # Конфигурация
GET    /api/v1/health/detailed           # Детальная информация
```

---

## Преимущества новой структуры:

1. **Четкое разделение ответственности** - каждый модуль отвечает за свою область
2. **Устранение дублирования** - каждый эндпоинт существует только в одном месте
3. **Логичная группировка** - связанные функции находятся вместе
4. **Простота навигации** - легко найти нужный эндпоинт
5. **Масштабируемость** - легко добавлять новые функции
6. **Единообразие** - все эндпоинты следуют одним принципам

---

## Риски и митигация:

### Риски:
- Временная недоступность API во время миграции
- Ошибки в обновлении фронтенда
- Потеря данных при миграции

### Митигация:
- Поэтапная миграция с сохранением обратной совместимости
- Тщательное тестирование на каждом этапе
- Резервные копии перед миграцией
- План отката на случай проблем

---

## Временные рамки:
- **Общее время**: 10-15 часов
- **Рекомендуемый график**: 2-3 дня
- **Критический путь**: Этапы 3-4 (миграция и обновление фронтенда)

---

## Следующие шаги:
1. Подтвердить план с командой
2. Создать резервные копии
3. Начать с Этапа 1 (анализ)
4. Поэтапно выполнять миграцию
5. Тестировать на каждом этапе
