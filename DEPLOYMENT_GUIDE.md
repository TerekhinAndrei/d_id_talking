# Руководство по деплою на Render

## Обзор

Этот проект состоит из двух частей:
- **Backend**: FastAPI приложение на Python
- **Frontend**: React приложение на Vite

Для деплоя на Render мы используем два сервиса:
1. **Web Service** для бэкенда (Python)
2. **Static Site** для фронтенда (React)

## Предварительные требования

### 1. Подготовка API ключей

Убедитесь, что у вас есть следующие API ключи:
- **D-ID API Key** - для работы с D-ID сервисом
- **ElevenLabs API Key** - для синтеза речи
- **Cloudinary URL** (опционально) - для хранения файлов

### 2. Подготовка репозитория

Убедитесь, что ваш код находится в Git репозитории (GitHub, GitLab, Bitbucket).

## Пошаговые инструкции

### Шаг 1: Создание аккаунта на Render

1. Перейдите на [render.com](https://render.com)
2. Зарегистрируйтесь или войдите в аккаунт
3. Подключите ваш Git репозиторий

### Шаг 2: Деплой бэкенда

1. В панели Render нажмите **"New +"** → **"Web Service"**
2. Подключите ваш репозиторий
3. Настройте сервис:

```
Name: talking-head-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
```



4. В разделе **Environment Variables** добавьте:

```
PYTHON_VERSION=3.11.0
PORT=8000
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
SECRET_KEY=[автогенерация]
ALLOWED_HOSTS=https://talking-head-frontend.onrender.com,https://talking-head-backend.onrender.com
CLIENT_URL=https://talking-head-frontend.onrender.com
FRONTEND_URL=https://talking-head-frontend.onrender.com
D_ID_API_KEY=[ваш D-ID API ключ]
ELEVENLABS_API_KEY=[ваш ElevenLabs API ключ]
CLOUDINARY_URL=[ваш Cloudinary URL]
```

5. Нажмите **"Create Web Service"**

### Шаг 3: Деплой фронтенда

1. В панели Render нажмите **"New +"** → **"Static Site"**
2. Подключите тот же репозиторий
3. Настройте сервис:

```
Name: talking-head-frontend
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
```

4. В разделе **Environment Variables** добавьте:

```
VITE_API_BASE_URL=https://talking-head-backend.onrender.com
VITE_API_TIMEOUT=30000
```

5. Нажмите **"Create Static Site"**

### Шаг 4: Настройка CORS

После создания обоих сервисов, обновите переменную `ALLOWED_HOSTS` в бэкенде, добавив URL фронтенда:

```
ALLOWED_HOSTS=https://talking-head-frontend.onrender.com,https://talking-head-backend.onrender.com
```

### Шаг 5: Проверка деплоя

1. **Проверьте бэкенд**: Откройте `https://talking-head-backend.onrender.com/docs`
2. **Проверьте фронтенд**: Откройте `https://talking-head-frontend.onrender.com`

## Конфигурация файлов

### render.yaml (автоматический деплой)

Если вы хотите использовать автоматический деплой через `render.yaml`:

1. Убедитесь, что файл `render.yaml` находится в корне репозитория
2. В Render выберите **"New +"** → **"Blueprint"**
3. Подключите репозиторий
4. Render автоматически создаст оба сервиса

### Обновление переменных окружения

После создания сервисов вы можете обновить переменные окружения:

1. Перейдите в настройки сервиса
2. Выберите **"Environment"**
3. Добавьте или измените переменные
4. Нажмите **"Save Changes"**
5. Сервис автоматически перезапустится

## Мониторинг и логи

### Просмотр логов

1. В панели сервиса перейдите в **"Logs"**
2. Выберите **"Live"** для просмотра в реальном времени
3. Используйте фильтры для поиска ошибок

### Мониторинг производительности

1. В настройках сервиса включите **"Health Check Path"**
2. Установите путь: `/api/v1/health`
3. Render будет автоматически проверять доступность сервиса

## Устранение неполадок

### Частые проблемы

#### 1. Ошибка сборки фронтенда
```
Error: Cannot find module 'react'
```
**Решение**: Убедитесь, что `package.json` находится в папке `frontend/`

#### 2. Ошибка импорта в бэкенде
```
ModuleNotFoundError: No module named 'app'
```
**Решение**: Убедитесь, что `requirements.txt` находится в корне проекта

#### 3. CORS ошибки
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Решение**: Проверьте переменную `ALLOWED_HOSTS` в бэкенде

#### 4. WebSocket соединения не работают
**Решение**: Убедитесь, что URL в `WS_ENDPOINTS` использует правильный протокол (wss://)

#### 5. Ошибка установки ffmpeg-python
```
Package libavformat was not found in the pkg-config search path
```
**Решение**: Убедитесь, что в Build Command установлен системный FFmpeg:
```
apt-get update && apt-get install -y ffmpeg && pip install -r requirements.txt
```

### Проверка конфигурации

1. **Бэкенд**: Откройте `/docs` для проверки API
2. **Фронтенд**: Проверьте консоль браузера на ошибки
3. **WebSocket**: Проверьте соединения в Network tab

## Обновление приложения

### Автоматические обновления

При пуше в основную ветку репозитория Render автоматически:
1. Обнаружит изменения
2. Запустит новую сборку
3. Развернет обновленную версию

### Ручные обновления

1. В панели сервиса нажмите **"Manual Deploy"**
2. Выберите ветку и коммит
3. Нажмите **"Deploy latest commit"**

## Безопасность

### Переменные окружения

- Никогда не коммитьте API ключи в репозиторий
- Используйте переменные окружения Render
- Регулярно обновляйте API ключи

### HTTPS

Render автоматически предоставляет SSL сертификаты для всех сервисов.

## Масштабирование

### Планы Render

- **Free**: Подходит для разработки и тестирования
- **Starter**: $7/месяц - для небольших проектов
- **Standard**: $25/месяц - для продакшена

### Автомасштабирование

В платных планах доступно автомасштабирование на основе нагрузки.

## Поддержка

- [Render Documentation](https://render.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)

## Заключение

После выполнения всех шагов у вас будет полностью развернутое приложение с:
- Бэкендом на `https://talking-head-backend.onrender.com`
- Фронтендом на `https://talking-head-frontend.onrender.com`
- Автоматическими обновлениями при пуше в репозиторий
