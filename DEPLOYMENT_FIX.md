# Исправление проблем с деплоем на Render

## Проблема
На хосте Render отсутствуют переменные окружения для D-ID и Cloudinary, что приводит к ошибкам:
- `Missing required D-ID configuration: apiKey`
- `Missing required Cloudinary configuration: apiKey`
- `No storage providers available`

## Решение

### 1. Обновлен render.yaml
Добавлены недостающие переменные окружения для фронтенда:

```yaml
envVars:
  - key: VITE_API_BASE_URL
    value: https://talking-head.onrender.com
  - key: VITE_API_TIMEOUT
    value: 30000
  - key: VITE_D_ID_API_KEY
    sync: false
  - key: VITE_CLOUDINARY_API_KEY
    sync: false
  - key: VITE_CLOUDINARY_API_SECRET
    sync: false
  - key: VITE_CLOUDINARY_CLOUD_NAME
    sync: false
  - key: VITE_CLOUDINARY_UPLOAD_PRESET
    sync: false
```

### 2. Исправлена обработка HYBRID провайдера
- HYBRID теперь правильно обрабатывается как стратегия, а не как провайдер
- Отключен HYBRID как провайдер по умолчанию

### 3. Создан инструмент диагностики
Файл `frontend/public/env-check.html` для проверки переменных окружения на хосте.

## Действия для исправления

### В Render Dashboard:
1. Перейдите в настройки вашего фронтенд сервиса
2. Добавьте следующие переменные окружения:
   - `VITE_D_ID_API_KEY` - ваш API ключ D-ID
   - `VITE_CLOUDINARY_API_KEY` - ваш API ключ Cloudinary
   - `VITE_CLOUDINARY_API_SECRET` - ваш API секрет Cloudinary
   - `VITE_CLOUDINARY_CLOUD_NAME` - имя вашего облака Cloudinary
   - `VITE_CLOUDINARY_UPLOAD_PRESET` - пресет для загрузки

### Для бэкенд сервиса:
1. Перейдите в настройки вашего бэкенд сервиса
2. Добавьте следующие переменные окружения:
   - `D_ID_API_KEY` - ваш API ключ D-ID
   - `ELEVENLABS_API_KEY` - ваш API ключ ElevenLabs
   - `CLOUDINARY_URL` - полный URL Cloudinary (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
   - `ENVIRONMENT` - установите "production" для продакшена
   - `BASE_URL` - URL вашего бэкенд сервиса (например, https://talking-head.onrender.com)

### Получение ключей:

#### D-ID API Key:
1. Зайдите на https://studio.d-id.com/
2. Перейдите в Settings → API Keys
3. Создайте новый API ключ или скопируйте существующий

#### Cloudinary Credentials:
1. Зайдите на https://cloudinary.com/
2. Перейдите в Dashboard
3. Скопируйте:
   - Cloud Name
   - API Key
   - API Secret
4. Создайте Upload Preset в Settings → Upload

### После настройки:
1. Перезапустите деплой в Render
2. Проверьте работу приложения
3. Используйте `https://your-app.onrender.com/env-check.html` для диагностики

## Проверка исправления
После настройки переменных окружения ошибки должны исчезнуть:
- ✅ D-ID provider initialized successfully
- ✅ Cloudinary provider initialized successfully
- ✅ FileStorageService initialized successfully

## Примечания
- Предупреждения "Auto-play failed" - это нормально, связано с политиками браузера
- ElevenLabs использует бэкенд API, поэтому фронтенд переменная не нужна
