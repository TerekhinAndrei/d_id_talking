# 🔗 Интеграция с ElevenLabs Speech to Speech API

## 📋 Обзор

Заменена имитация задержки (`asyncio.sleep`) на реальный API-вызов к сервису ElevenLabs Speech to Speech (STS). Теперь система:

1. **Принимает аудиофайл** от пользователя
2. **Отправляет его в ElevenLabs** через STS API
3. **Получает обратно** тот же аудиоконтент, но с другим голосом
4. **Сохраняет результат** для дальнейшего использования

---

## 🏗️ Архитектура

### Сервис ElevenLabs
```python
# app/services/elevenlabs.py
class ElevenLabsService:
    async def speech_to_speech(
        self, 
        audio_data: bytes, 
        voice_id: Optional[str] = None,
        model_id: str = "eleven_multilingual_v2"
    ) -> bytes:
        # Реальный API-вызов к ElevenLabs
```

### Обновленный эндпоинт
```python
# app/api/v1/endpoints/generation.py
async def process_video_task(task_id: str, audio_data: bytes, voice_id: str = None):
    # Вызываем реальный ElevenLabs API
    processed_audio = await elevenlabs_service.speech_to_speech(
        audio_data=audio_data,
        voice_id=voice_id
    )
```

---

## 🔧 Настройка

### 1. Переменные окружения
Создайте файл `.env` в корне проекта:

```env
# ElevenLabs API Settings
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### 2. Получение API ключа
1. Зарегистрируйтесь на [ElevenLabs](https://elevenlabs.io/)
2. Перейдите в раздел Profile Settings
3. Скопируйте ваш API ключ
4. Добавьте его в `.env` файл

### 3. Выбор голоса
- **По умолчанию:** `21m00Tcm4TlvDq8ikWAM` (Rachel)
- **Доступные голоса:** Используйте эндпоинт `/api/v1/voices`
- **Кастомный голос:** Передайте `voice_id` в запросе

---

## 🚀 Использование

### Создание задачи с обработкой голоса
```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -F "image_file=@photo.jpg;type=image/jpeg" \
  -F "audio_file=@voice.mp3;type=audio/mpeg" \
  -F "voice_id=21m00Tcm4TlvDq8ikWAM"
```

### Проверка статуса
```bash
curl http://localhost:8000/api/v1/status/{task_id}
```

### Получение списка голосов
```bash
curl http://localhost:8000/api/v1/voices
```

### Валидация голоса
```bash
curl http://localhost:8000/api/v1/voices/{voice_id}/validate
```

---

## 📊 Процесс обработки

### 1. Загрузка файлов
- Изображение сохраняется в `uploads/{task_id}/original_image.*`
- Аудио сохраняется в `uploads/{task_id}/original_audio.*`

### 2. Обработка через ElevenLabs
- Аудио кодируется в base64
- Отправляется в ElevenLabs STS API
- Получается обработанное аудио
- Сохраняется в `uploads/{task_id}/processed_audio.mp3`

### 3. Обновление статуса
- `pending` → `processing` → `completed`/`failed`
- URL результата: `/results/{task_id}/processed_audio.mp3`

---

## 🔍 Логирование

### Успешная обработка
```
[task_id] Запускаю обработку через ElevenLabs Speech to Speech...
[task_id] Обработка через ElevenLabs завершена успешно!
[task_id] Обработанный аудио сохранен: uploads/task_id/processed_audio.mp3
```

### Ошибки
```
[task_id] Ошибка при обработке через ElevenLabs: ElevenLabs API key not configured
[task_id] Ошибка при обработке через ElevenLabs: Network error: Connection timeout
```

---

## 🧪 Тестирование

### Без API ключа
```bash
# Создание задачи без API ключа
curl -X POST http://localhost:8000/api/v1/generate \
  -F "image_file=@test_files/test_image.jpg;type=image/jpeg" \
  -F "audio_file=@test_files/test_audio.mp3;type=audio/mpeg"
```

**Результат:** Задача создается, но обработка завершается с ошибкой

### С API ключом
```bash
# Установите API ключ в .env
export ELEVENLABS_API_KEY="your-api-key"

# Создание задачи с обработкой
curl -X POST http://localhost:8000/api/v1/generate \
  -F "image_file=@test_files/test_image.jpg;type=image/jpeg" \
  -F "audio_file=@test_files/test_audio.mp3;type=audio/mpeg"
```

**Результат:** Реальная обработка через ElevenLabs API

---

## 📈 Производительность

### Время обработки
- **Без API ключа:** ~1 секунда (ошибка)
- **С API ключом:** 5-30 секунд (зависит от размера аудио)

### Ограничения
- **Размер аудио:** До 25MB
- **Форматы:** MP3, WAV, OGG, M4A
- **Таймаут:** 60 секунд на запрос
- **Rate limiting:** Согласно плану ElevenLabs

---

## 🛠️ Дополнительные возможности

### Настройка голоса
```python
voice_settings = {
    "stability": 0.5,        # Стабильность голоса (0-1)
    "similarity_boost": 0.75, # Схожесть с оригиналом (0-1)
    "style": 0.0,            # Стиль голоса (0-1)
    "use_speaker_boost": True # Улучшение качества
}
```

### Модели
- `eleven_multilingual_v2` (по умолчанию)
- `eleven_english_sts_v2`
- `eleven_turbo_v2`

---

## 🔒 Безопасность

### API ключи
- Хранятся в переменных окружения
- Не коммитятся в репозиторий
- Используются только для серверных запросов

### Валидация
- Проверка существования голоса
- Валидация форматов файлов
- Обработка ошибок API

---

## 📚 Ресурсы

- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Speech to Speech API](https://docs.elevenlabs.io/api-reference/speech-to-speech)
- [Available Voices](https://docs.elevenlabs.io/api-reference/voices)
- [Voice Settings](https://docs.elevenlabs.io/api-reference/voice-settings)

---

## 🚀 Следующие шаги

1. **Получите API ключ** от ElevenLabs
2. **Настройте переменные окружения**
3. **Протестируйте с реальными файлами**
4. **Настройте мониторинг** и логирование
5. **Добавьте кэширование** для оптимизации

**Система готова к использованию с реальным ElevenLabs API!** 🎉 