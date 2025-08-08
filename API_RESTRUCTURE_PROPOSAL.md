# Предложение по реструктуризации API

## Текущие проблемы:
1. Дублирование функциональности между модулями
2. Смешанная ответственность в роутерах
3. Нелогичная группировка эндпоинтов
4. Сложная навигация для фронтенда

## Предлагаемая структура:

### 1. `/api/v1/voices/` - Управление голосами
```
GET /voices                    # Список всех голосов
GET /voices/{voice_id}         # Информация о конкретном голосе
GET /voices/{voice_id}/validate # Валидация голоса
POST /voices/test-auth         # Тест аутентификации ElevenLabs
```

### 2. `/api/v1/tts/` - Text-to-Speech
```
POST /tts/text-to-speech      # Конвертация текста в речь
POST /tts/speech-to-speech    # Конвертация речи в речь (voice changer)
POST /tts/play-voice          # Воспроизведение голоса
```

### 3. `/api/v1/video/` - Генерация видео
```
POST /video/generate          # Генерация видео из изображения и аудио
GET /video/status/{task_id}   # Статус задачи генерации
```

### 4. `/api/v1/streaming/` - WebRTC стриминг
```
POST /streaming/start         # Создание стрима
POST /streaming/{stream_id}/sdp # Обмен SDP
POST /streaming/{stream_id}/ice # Обмен ICE candidates
POST /streaming/{stream_id}/talk # Создание talk stream
DELETE /streaming/{stream_id}  # Закрытие стрима
GET /streaming/{stream_id}/status # Статус стрима
GET /streaming/sessions       # Список активных сессий
```

### 5. `/api/v1/webrtc/` - WebRTC API (альтернативный)
```
POST /webrtc/session          # Создание WebRTC сессии
POST /webrtc/answer           # Отправка SDP answer
POST /webrtc/audio            # Отправка аудио чанка
GET /webrtc/{stream_id}/status # Статус WebRTC
```

### 6. `/api/v1/storage/` - Управление файлами
```
POST /storage/upload/image     # Загрузка изображения
POST /storage/upload/audio     # Загрузка аудио
```

### 7. `/api/v1/tasks/` - Управление задачами
```
GET /tasks/                   # Список задач
GET /tasks/{task_id}          # Информация о задаче
POST /tasks/{task_id}/start   # Запуск задачи
POST /tasks/{task_id}/complete # Завершение задачи
GET /tasks/stats/overview     # Статистика задач
```

### 8. `/api/v1/users/` - Управление пользователями
```
GET /users/                   # Список пользователей
GET /users/{user_id}          # Информация о пользователе
```

### 9. `/api/v1/health/` - Мониторинг
```
GET /health                   # Базовый health check
GET /health/config            # Конфигурация
GET /health/detailed          # Детальная информация
```

## Преимущества новой структуры:
1. **Четкое разделение ответственности**
2. **Устранение дублирования**
3. **Логичная группировка**
4. **Простота навигации**
5. **Масштабируемость**

## План миграции:
1. Создать новые роутеры с правильной структурой
2. Перенести эндпоинты в соответствующие модули
3. Обновить фронтенд для использования новых путей
4. Удалить старые дублирующие эндпоинты
5. Обновить документацию
