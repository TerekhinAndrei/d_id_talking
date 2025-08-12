# 🚀 Deployment Guide: Render + Vercel

## 📋 Overview
- **Backend (FastAPI)**: Render
- **Frontend (React)**: Vercel
- **Database**: None (stateless)
- **File Storage**: Cloudinary

## 🔧 Backend Deployment (Render)

### 1. Подготовка
```bash
# Убедитесь, что все изменения закоммичены
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Настройка Render
1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите GitHub репозиторий
4. Настройте параметры:
   - **Name**: `talking-head-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Environment Variables
В Render Dashboard добавьте:
```
D_ID_API_KEY=your_actual_d_id_api_key
D_ID_BASE_URL=https://api.d-id.com
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### 4. Деплой
- Render автоматически деплоит при каждом push в main
- URL будет: `https://talking-head-backend.onrender.com`

## 🎨 Frontend Deployment (Vercel)

### 1. Подготовка
```bash
cd frontend
npm install
npm run build
```

### 2. Настройка Vercel
1. Зарегистрируйтесь на [Vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Подключите GitHub репозиторий
4. Настройте параметры:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Environment Variables
В Vercel Dashboard добавьте:
```
VITE_API_BASE_URL=https://talking-head-backend.onrender.com/api/v1
```

### 4. Деплой
- Vercel автоматически деплоит при каждом push в main
- URL будет: `https://your-app-name.vercel.app`

## 🔗 Проверка деплоя

### Backend Health Check
```bash
curl https://talking-head-backend.onrender.com/health
```

### Frontend
1. Откройте Vercel URL
2. Проверьте консоль браузера на ошибки
3. Протестируйте создание стрима

## 🐛 Troubleshooting

### Backend не запускается
- Проверьте логи в Render Dashboard
- Убедитесь, что `D_ID_API_KEY` установлен
- Проверьте `requirements.txt`

### Frontend не подключается к Backend
- Проверьте `VITE_API_BASE_URL` в Vercel
- Убедитесь, что CORS настроен правильно
- Проверьте консоль браузера

### CORS ошибки
Добавьте в backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Мониторинг
- **Render**: Логи в Dashboard
- **Vercel**: Analytics в Dashboard
- **D-ID API**: Проверьте лимиты в D-ID Dashboard
