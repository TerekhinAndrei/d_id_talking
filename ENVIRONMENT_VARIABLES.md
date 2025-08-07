# Переменные окружения

Этот документ описывает все переменные окружения, используемые в проекте D-ID Talking Head.

## Быстрый старт

1. Скопируйте `env.example` в `.env`:
```bash
cp env.example .env
```

2. Заполните необходимые переменные в `.env` файле

## API Ключи

### D-ID API
- `D_ID_API_KEY` - API ключ для D-ID сервиса
- `D_ID_BASE_URL` - Базовый URL для D-ID API (по умолчанию: https://api.d-id.com)
- `D_ID_DEFAULT_PRESENTER_ID` - ID презентера по умолчанию (по умолчанию: bank://lively/driver-05)
- `D_ID_DEFAULT_DRIVER_URL` - URL драйвера по умолчанию (по умолчанию: bank://lively/)

### ElevenLabs API
- `ELEVENLABS_API_KEY` - API ключ для ElevenLabs
- `ELEVENLABS_BASE_URL` - Базовый URL для ElevenLabs API (по умолчанию: https://api.elevenlabs.io/v1)
- `ELEVENLABS_DEFAULT_VOICE_ID` - ID голоса по умолчанию (по умолчанию: 21m00Tcm4TlvDq8ikWAM)
- `ELEVENLABS_DEFAULT_MODEL` - Модель по умолчанию (по умолчанию: eleven_multilingual_v2)
- `ELEVENLABS_STS_MODEL` - Модель для speech-to-speech (по умолчанию: eleven_multilingual_sts_v2)

### Cloudinary
- `CLOUDINARY_URL` - URL для Cloudinary сервиса

## Настройки сервера

- `HOST` - Хост для запуска сервера (по умолчанию: 0.0.0.0)
- `PORT` - Порт для запуска сервера (по умолчанию: 8000)
- `DEBUG` - Режим отладки (по умолчанию: true)

## CORS и безопасность

- `ALLOWED_HOSTS` - Разрешенные хосты для CORS (разделенные запятыми)
- `SECRET_KEY` - Секретный ключ для JWT токенов
- `ALGORITHM` - Алгоритм для JWT (по умолчанию: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Время жизни токена в минутах (по умолчанию: 30)

## Frontend настройки

- `FRONTEND_URL` - URL фронтенда (по умолчанию: http://localhost:5173)
- `FRONTEND_DEV_URLS` - URL для разработки фронтенда (разделенные запятыми)
- `CLIENT_URL` - URL клиента (по умолчанию: http://localhost:3000)

## Настройки голосов

- `DEFAULT_VOICE_ID` - ID голоса по умолчанию
- `DEFAULT_VOICE_NAME` - Имя голоса по умолчанию
- `DEFAULT_VOICE_DESCRIPTION` - Описание голоса по умолчанию
- `FALLBACK_VOICES` - JSON массив резервных голосов

## Аудио настройки

- `AUDIO_SAMPLE_RATE` - Частота дискретизации (по умолчанию: 44100)
- `AUDIO_BITRATE` - Битрейт аудио (по умолчанию: 128k)
- `AUDIO_FORMAT` - Формат аудио (по умолчанию: mp3)

## WebRTC настройки

- `WEBRTC_ICE_SERVERS` - ICE серверы для WebRTC (разделенные запятыми)
- `WEBRTC_TIMEOUT` - Таймаут WebRTC в секундах (по умолчанию: 30)

## Настройки стриминга

- `STREAMING_TIMEOUT` - Таймаут стриминга в секундах (по умолчанию: 60)
- `STREAMING_MAX_RETRIES` - Максимальное количество попыток (по умолчанию: 3)

## Настройки загрузки файлов

- `MAX_FILE_SIZE` - Максимальный размер файла в байтах (по умолчанию: 10485760 = 10MB)
- `ALLOWED_IMAGE_TYPES` - Разрешенные типы изображений (разделенные запятыми)
- `ALLOWED_AUDIO_TYPES` - Разрешенные типы аудио (разделенные запятыми)

## Настройки логирования

- `LOG_LEVEL` - Уровень логирования (по умолчанию: INFO)
- `LOG_FORMAT` - Формат логов (по умолчанию: %(asctime)s - %(name)s - %(levelname)s - %(message)s)

## База данных

- `DATABASE_URL` - URL базы данных (по умолчанию: sqlite:///./app.db)
- `REDIS_URL` - URL Redis (опционально)

## Настройки приложения

- `PROJECT_NAME` - Название проекта (по умолчанию: D-ID Talking Head)
- `VERSION` - Версия приложения (по умолчанию: 1.0.0)
- `API_V1_STR` - Префикс API (по умолчанию: /api/v1)
- `ENVIRONMENT` - Окружение (по умолчанию: development)

## Пример .env файла

```env
# API Ключи
D_ID_API_KEY=your-d-id-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
CLOUDINARY_URL=your-cloudinary-url-here

# Настройки сервера
HOST=0.0.0.0
PORT=3001
DEBUG=true

# CORS
ALLOWED_HOSTS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,testserver,localhost,localhost:3001

# Frontend
FRONTEND_URL=http://localhost:5173
FRONTEND_DEV_URLS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
CLIENT_URL=http://localhost:3000

# Голоса
DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
DEFAULT_VOICE_NAME=Rachel
DEFAULT_VOICE_DESCRIPTION=Женский голос, теплый и дружелюбный

# Резервные голоса (JSON)
FALLBACK_VOICES=[{"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Женский голос, теплый и дружелюбный"}, {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "description": "Женский голос, четкий и профессиональный"}]

# Аудио
AUDIO_SAMPLE_RATE=44100
AUDIO_BITRATE=128k
AUDIO_FORMAT=mp3

# WebRTC
WEBRTC_ICE_SERVERS=stun:stun.cloudflare.com:3478
WEBRTC_TIMEOUT=30

# Стриминг
STREAMING_TIMEOUT=60
STREAMING_MAX_RETRIES=3

# Файлы
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/wav,audio/webm,audio/ogg

# Логирование
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# Безопасность
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Окружение
ENVIRONMENT=development

# База данных
DATABASE_URL=sqlite:///./app.db
REDIS_URL=

# Приложение
PROJECT_NAME=D-ID Talking Head
VERSION=1.0.0
API_V1_STR=/api/v1
```

## Важные замечания

1. **Безопасность**: Никогда не коммитьте `.env` файл в репозиторий
2. **Форматы**: 
   - Списки разделяются запятыми: `item1,item2,item3`
   - JSON массивы: `[{"key": "value"}, {"key2": "value2"}]`
3. **Значения по умолчанию**: Если переменная не указана, используются значения по умолчанию
4. **Валидация**: Все переменные валидируются при запуске приложения
