# 🚀 Руководство по развертыванию на Render

## 📋 Обзор

Этот проект состоит из двух частей:
- **Backend**: FastAPI приложение (Python)
- **Frontend**: React/Vite приложение (JavaScript)

## 🔧 Конфигурация URL

### Локальная разработка
Проект автоматически определяет окружение и использует правильные URL:

- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:5173`
- **WebSocket**: `ws://localhost:8000/ws/stream`

### Продакшен (Render)
- **Backend**: `https://talking-head.onrender.com`
- **Frontend**: `https://talking-head-frontend.onrender.com`
- **WebSocket**: `wss://talking-head.onrender.com/ws/stream`

### Переменные окружения

#### Для локальной разработки:

**Способ 1: Создайте файл `frontend/.env.local`**
```bash
# Создайте файл в папке frontend
touch frontend/.env.local

# Добавьте в файл:
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

**Способ 2: Используйте готовые npm скрипты**
```bash
# Обычный запуск (автоматически определит URL)
npm run dev

# Принудительно использовать localhost
npm run dev:custom

# Принудительно использовать Render backend
npm run dev:render
```

**Способ 3: Переопределение через командную строку**
```bash
# Linux/Mac
VITE_API_BASE_URL=http://localhost:8000 npm run dev

# Windows
set VITE_API_BASE_URL=http://localhost:8000 && npm run dev
```

#### Для продакшена:
```bash
VITE_API_BASE_URL=https://talking-head.onrender.com
```

## 🛠️ Развертывание

### 1. Подготовка репозитория

Убедитесь, что ваш код находится в ветке `develop`:
```bash
git checkout develop
git pull origin develop
```

### 2. Создание тега для релиза

```bash
git tag v1.2.1
git push origin v1.2.1
```

### 3. Развертывание через Render Blueprint

1. Перейдите на [Render Dashboard](https://dashboard.render.com/)
2. Нажмите "New" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Выберите файл `render.yaml`
5. Нажмите "Apply"

### 4. Настройка переменных окружения

В Render Dashboard для каждого сервиса настройте переменные окружения:

#### Backend переменные:
```bash
ENVIRONMENT=production
ELEVENLABS_API_KEY=your_elevenlabs_key
D_ID_API_KEY=your_d_id_key
CLOUDINARY_URL=your_cloudinary_url
```

#### Frontend переменные:
```bash
VITE_API_BASE_URL=https://talking-head.onrender.com
VITE_API_TIMEOUT=30000
```

## 📁 Структура файлов

### Backend файлы:
- `requirements.txt` - Python зависимости
- `app/main.py` - точка входа FastAPI
- `render.yaml` - конфигурация Render

### Frontend файлы:
- `package.json` - Node.js зависимости
- `vite.config.js` - конфигурация Vite
- `src/config/ConfigManager.js` - централизованная конфигурация URL

## 🔍 Проверка развертывания

### 1. Проверка Backend
```bash
curl https://talking-head.onrender.com/api/v1/health
```

### 2. Проверка Frontend
Откройте `https://talking-head-frontend.onrender.com` в браузере

### 3. Проверка WebSocket
В консоли браузера не должно быть ошибок WebSocket подключения

## 🐛 Устранение неполадок

### Проблема: "Build failed"
- Проверьте логи сборки в Render Dashboard
- Убедитесь, что все зависимости указаны в `requirements.txt` и `package.json`

### Проблема: "API calls failing"
- Проверьте переменные окружения в Render
- Убедитесь, что `VITE_API_BASE_URL` указывает на правильный backend URL

### Проблема: "WebSocket connection failed"
- Проверьте, что WebSocket URL использует правильный протокол (wss:// для HTTPS)
- Убедитесь, что backend поддерживает WebSocket соединения

### Проблема: "CORS errors"
- Проверьте настройки CORS в `app/core/config.py`
- Убедитесь, что frontend URL добавлен в `ALLOWED_HOSTS`

## 📝 Примечания

- Проект автоматически определяет окружение (development/production)
- URL конфигурируются централизованно через `ConfigManager`
- Для локальной разработки не требуется дополнительная настройка
- Все API endpoints используют правильные URL автоматически
