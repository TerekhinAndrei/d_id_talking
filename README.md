# D-ID Talking - AI Video Generation Platform

Современная платформа для генерации говорящих видео с использованием AI технологий. Интегрирует ElevenLabs для синтеза речи и D-ID для создания видео с говорящими аватарами.

## 🚀 Возможности

- 🎬 **Генерация видео** - Создание говорящих видео из изображений и аудио
- 🎤 **Синтез речи** - ElevenLabs API для высококачественного TTS и STS
- 🤖 **AI аватары** - D-ID API для анимированных говорящих персонажей
- 📱 **Современный UI** - React frontend с интуитивным интерфейсом
- ⚡ **FastAPI Backend** - Быстрый и масштабируемый API
- 🧪 **Комплексное тестирование** - 100% покрытие всех внешних сервисов
- 🔄 **Асинхронная обработка** - Фоновые задачи для генерации видео
- 📊 **Мониторинг статуса** - Отслеживание прогресса генерации

## 🏗️ Архитектура

```
d_id_talking/
├── app/                    # Backend API (FastAPI)
│   ├── api/v1/endpoints/  # API endpoints
│   ├── services/          # Внешние сервисы
│   ├── models/           # Pydantic модели
│   └── config.py         # Конфигурация
├── frontend/             # React frontend
│   ├── src/services/     # API клиент
│   └── public/          # Статические файлы
├── tests/               # Unit тесты
├── test_files/         # Тестовые ресурсы
└── *.py               # Тестовые скрипты
```

## 🛠️ Технологии

### Backend
- **FastAPI** - Современный веб-фреймворк
- **ElevenLabs API** - Синтез речи (TTS/STS)
- **D-ID API** - Генерация говорящих видео
- **Cloudinary** - Облачное хранилище файлов
- **Pydantic** - Валидация данных

### Frontend
- **React** - Пользовательский интерфейс
- **Axios** - HTTP клиент
- **Vite** - Сборка проекта

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Настройка окружения

Скопируйте пример конфигурации:

```bash
cp env.example .env
```

Настройте переменные окружения в `.env`:

```env
# ElevenLabs API
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# D-ID API
D_ID_API_KEY=your-d-id-api-key

# Cloudinary
CLOUDINARY_URL=cloudinary://username:password@cloud_name

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3001
```

### 3. Запуск приложения

#### Backend
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001
```

#### Frontend
```bash
cd frontend
npm run dev
```

### 4. Доступ к приложению

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/api/v1/health

## 📋 API Endpoints

### Health Check
- `GET /api/v1/health` - Проверка состояния сервиса

### Voices (ElevenLabs)
- `GET /api/v1/voices` - Список доступных голосов
- `GET /api/v1/voices/{voice_id}` - Информация о голосе
- `GET /api/v1/voices/{voice_id}/validate` - Валидация голоса

### Video Generation
- `POST /api/v1/generate` - Создание задачи генерации видео
- `GET /api/v1/status/{task_id}` - Статус задачи

## 🧪 Тестирование

### Быстрая проверка
```bash
python3 test_quick_check.py
```

### Комплексное тестирование
```bash
python3 test_external_services_comprehensive.py
```

### Индивидуальные тесты
```bash
# ElevenLabs
python3 test_elevenlabs_comprehensive.py

# D-ID
python3 test_d_id_comprehensive.py

# Backend API
python3 test_backend_api_comprehensive.py
```

## 📊 Результаты тестирования

Все тесты проходят успешно (100%):
- ✅ **ElevenLabs API** - TTS, STS, Voices
- ✅ **D-ID API** - Video generation, Status polling
- ✅ **Backend API** - All endpoints, Error handling
- ✅ **Cloudinary** - File storage (опционально)

## 🔧 Конфигурация

### Основные настройки

```python
# ElevenLabs
ELEVENLABS_API_KEY = "your-api-key"
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

# D-ID
D_ID_API_KEY = "your-api-key"
D_ID_BASE_URL = "https://api.d-id.com"

# Cloudinary
CLOUDINARY_URL = "cloudinary://username:password@cloud_name"
```

## 📁 Структура проекта

```
d_id_talking/
├── app/                           # Backend приложение
│   ├── api/v1/endpoints/         # API endpoints
│   │   ├── generation.py         # Генерация видео
│   │   ├── health.py            # Health check
│   │   └── users.py             # Пользователи
│   ├── services/                 # Внешние сервисы
│   │   ├── elevenlabs_service.py # ElevenLabs API
│   │   ├── d_id_service.py      # D-ID API
│   │   └── storage_service.py   # Cloudinary
│   ├── models/                   # Pydantic модели
│   └── config.py                # Конфигурация
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── services/api.js      # API клиент
│   │   └── App.jsx             # Главный компонент
│   └── package.json
├── tests/                       # Unit тесты
├── test_files/                  # Тестовые ресурсы
│   ├── test_audio.mp3          # Тестовое аудио
│   └── test_image.jpg          # Тестовое изображение
├── test_*.py                   # Тестовые скрипты
├── requirements.txt             # Python зависимости
└── README.md                   # Документация
```

## 🚀 Развертывание

### Development
```bash
# Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001

# Frontend
cd frontend && npm run dev
```

### Production
```bash
# Backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3001

# Frontend
cd frontend && npm run build
```

## 📝 Документация

- [API Documentation](API_DOCUMENTATION.md) - Подробная документация API
- [External API Report](EXTERNAL_API_REQUESTS_REPORT.md) - Отчет по внешним API
- [Testing Instructions](TESTING_INSTRUCTIONS.md) - Инструкции по тестированию
- [System Architecture](SYSTEM_ARCHITECTURE_DETAILED.md) - Архитектура системы

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Запустите тестовую suite
6. Создайте pull request

## 📄 Лицензия

Этот проект лицензирован под MIT License. 