# Быстрый деплой на Render

## 🚀 Быстрый старт (5 минут)

### 1. Подготовка
```bash
# Убедитесь, что код в Git репозитории
git add .
git commit -m "Prepare for deployment"
git push
```

### 2. Создание сервисов на Render

#### Backend (Web Service)
1. **New +** → **Web Service**
2. Подключите репозиторий
3. Настройки:
   - **Name**: `talking-head-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload`

4. Environment Variables:
   ```
   PYTHON_VERSION=3.11.0
   ENVIRONMENT=production
   DEBUG=false
   D_ID_API_KEY=[ваш ключ]
   ELEVENLABS_API_KEY=[ваш ключ]
   ```

#### Frontend (Static Site)
1. **New +** → **Static Site**
2. Подключите тот же репозиторий
3. Настройки:
   - **Name**: `talking-head-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Environment Variables:
   ```
   VITE_API_BASE_URL=https://talking-head-backend.onrender.com
   ```

### 3. Автоматический деплой (альтернатива)

Используйте `render.yaml` для автоматического создания обоих сервисов:

1. **New +** → **Blueprint**
2. Подключите репозиторий
3. Render создаст оба сервиса автоматически

## 🔧 Ключевые настройки

### CORS (после создания сервисов)
В настройках бэкенда добавьте:
```
ALLOWED_HOSTS=https://talking-head-frontend.onrender.com,https://talking-head-backend.onrender.com
CLIENT_URL=https://talking-head-frontend.onrender.com
FRONTEND_URL=https://talking-head-frontend.onrender.com
```

### Health Check
В настройках бэкенда:
- **Health Check Path**: `/api/v1/health`

## ✅ Проверка

1. **Backend**: `https://talking-head-backend.onrender.com/docs`
2. **Frontend**: `https://talking-head-frontend.onrender.com`

## 🆘 Если что-то не работает

### Ошибки сборки
- Проверьте логи в Render
- Убедитесь, что `requirements.txt` в корне проекта
- Убедитесь, что `package.json` в папке `frontend/`

### Ошибки FFmpeg/aiortc
Если видите ошибку `Package libavformat was not found`:
- Используйте `requirements.txt` (без FFmpeg) для базового деплоя
- Или добавьте системные зависимости в Build Command:
  ```
  apt-get update && apt-get install -y pkg-config libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev libavfilter-dev libswscale-dev libswresample-dev ffmpeg && pip install -r requirements-full.txt
  ```

### CORS ошибки
- Проверьте `ALLOWED_HOSTS` в бэкенде
- Убедитесь, что URL фронтенда добавлен

### WebSocket не работает
- Проверьте, что используется `wss://` протокол
- Убедитесь, что CORS настроен для WebSocket

## 📞 Поддержка

- [Полное руководство](DEPLOYMENT_GUIDE.md)
- [Чек-лист](DEPLOYMENT_CHECKLIST.md)
- [Render Docs](https://render.com/docs)
