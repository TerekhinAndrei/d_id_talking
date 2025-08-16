# Технические детали реализации

## 🚨 Критические баги - Технические решения

### 1. Сглаживание переходов видео

#### Проблема
```javascript
// Текущий код в VideoPlayer.jsx
useEffect(() => {
  if (videoRef.current && videoUrl) {
    videoRef.current.load(); // Резкая смена видео
  }
}, [videoUrl]);
```

#### Решение
```javascript
// Новый код с плавными переходами
const [isTransitioning, setIsTransitioning] = useState(false);
const [currentVideo, setCurrentVideo] = useState(null);

const handleVideoChange = async (newVideoUrl) => {
  setIsTransitioning(true);
  
  // Fade out текущего видео
  if (videoRef.current) {
    videoRef.current.style.transition = 'opacity 0.5s ease-out';
    videoRef.current.style.opacity = '0';
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Смена источника
  setCurrentVideo(newVideoUrl);
  
  // Fade in нового видео
  if (videoRef.current) {
    videoRef.current.style.transition = 'opacity 0.5s ease-in';
    videoRef.current.style.opacity = '1';
  }
  
  setIsTransitioning(false);
};
```

#### Файлы для изменения
- `frontend/src/components/VideoPlayer.jsx`
- `frontend/src/hooks/useDIdStreaming.js`
- `frontend/src/styles/VideoPlayer.module.css`

### 2. Шумоподавление микрофона

#### Техническая реализация
```javascript
// AudioWorklet для шумоподавления
class NoiseSuppressionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.noiseProfile = null;
    this.isLearning = true;
    this.learningFrames = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (this.isLearning && this.learningFrames < 1000) {
      // Сбор профиля шума
      this.updateNoiseProfile(input);
      this.learningFrames++;
    } else {
      // Применение шумоподавления
      this.applyNoiseSuppression(input, output);
    }
    
    return true;
  }
  
  updateNoiseProfile(input) {
    // Реализация спектрального анализа шума
  }
  
  applyNoiseSuppression(input, output) {
    // Применение спектрального вычитания
  }
}
```

#### Интеграция
```javascript
// В useMicrophoneRecording.js
const setupNoiseSuppression = async (stream) => {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('/audio-noise-suppression-worklet.js');
  
  const source = audioContext.createMediaStreamSource(stream);
  const processor = new AudioWorkletNode(audioContext, 'noise-suppression-processor');
  
  source.connect(processor);
  processor.connect(audioContext.destination);
  
  return processor;
};
```

### 3. Прямая отправка аудиочанков

#### Архитектура streaming
```python
# app/services/streaming_service.py
class AudioStreamingService:
    def __init__(self):
        self.elevenlabs_client = ElevenLabsClient()
        self.did_client = DIdClient()
        self.audio_buffer = []
    
    async def process_audio_chunk(self, audio_chunk: bytes):
        """Обработка аудио чанка в реальном времени"""
        # 1. Отправка в ElevenLabs
        processed_audio = await self.elevenlabs_client.process_chunk(audio_chunk)
        
        # 2. Немедленная отправка в D-ID
        await self.did_client.send_audio_chunk(processed_audio)
        
        return processed_audio
    
    async def start_streaming_session(self, image_url: str):
        """Начало streaming сессии"""
        session = await self.did_client.create_streaming_session(image_url)
        return session
```

#### Frontend интеграция
```javascript
// frontend/src/hooks/useAudioStreaming.js
export const useAudioStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const startStreaming = async (imageUrl) => {
    const response = await api.post('/api/v1/streaming/start', { image_url: imageUrl });
    setSessionId(response.data.session_id);
    setIsStreaming(true);
  };
  
  const sendAudioChunk = async (audioChunk) => {
    if (!sessionId) return;
    
    const formData = new FormData();
    formData.append('audio_chunk', audioChunk);
    formData.append('session_id', sessionId);
    
    await api.post('/api/v1/streaming/audio', formData);
  };
  
  return { startStreaming, sendAudioChunk, isStreaming };
};
```

## 🔐 Жизненно важные модули - Техническая архитектура

### 1. Система аутентификации

#### Backend модели
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # API ключи пользователя
    did_api_key = Column(String, nullable=True)
    elevenlabs_api_key = Column(String, nullable=True)
```

#### JWT аутентификация
```python
# app/core/security.py
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityService:
    SECRET_KEY = "your-secret-key"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    def create_access_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt
    
    def verify_password(self, plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password):
        return pwd_context.hash(password)
```

#### Frontend контекст
```javascript
// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    setUser(userData);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/api/v1/auth/me');
        setUser(response.data);
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Система управления API ключами

#### Шифрование ключей
```python
# app/services/encryption_service.py
from cryptography.fernet import Fernet
import base64

class EncryptionService:
    def __init__(self):
        self.key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.key)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Шифрование API ключа"""
        encrypted_key = self.cipher_suite.encrypt(api_key.encode())
        return base64.b64encode(encrypted_key).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Расшифровка API ключа"""
        encrypted_bytes = base64.b64decode(encrypted_key.encode())
        decrypted_key = self.cipher_suite.decrypt(encrypted_bytes)
        return decrypted_key.decode()
```

#### Валидация ключей
```python
# app/services/key_validation_service.py
import aiohttp
import asyncio

class KeyValidationService:
    async def validate_did_key(self, api_key: str) -> bool:
        """Валидация D-ID API ключа"""
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Basic {api_key}"}
            async with session.get("https://api.d-id.com/talks", headers=headers) as response:
                return response.status == 200
    
    async def validate_elevenlabs_key(self, api_key: str) -> bool:
        """Валидация ElevenLabs API ключа"""
        async with aiohttp.ClientSession() as session:
            headers = {"xi-api-key": api_key}
            async with session.get("https://api.elevenlabs.io/v1/voices", headers=headers) as response:
                return response.status == 200
```

### 3. Система платежей

#### Stripe интеграция
```python
# app/services/payment_service.py
import stripe
from app.models.payment import Payment, Subscription

stripe.api_key = "your-stripe-secret-key"

class PaymentService:
    async def create_payment_intent(self, amount: int, currency: str = "usd"):
        """Создание платежного намерения"""
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            automatic_payment_methods={"enabled": True},
        )
        return intent
    
    async def create_subscription(self, user_id: int, price_id: str):
        """Создание подписки"""
        # Получение customer_id пользователя
        user = await get_user(user_id)
        
        subscription = stripe.Subscription.create(
            customer=user.stripe_customer_id,
            items=[{"price": price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
        )
        return subscription
    
    async def handle_webhook(self, event):
        """Обработка webhook событий"""
        if event.type == "payment_intent.succeeded":
            await self.handle_payment_success(event.data.object)
        elif event.type == "invoice.payment_failed":
            await self.handle_payment_failure(event.data.object)
```

## 🎯 Дополнительные функции - Технические решения

### 1. Модуль TTS

#### Backend сервис
```python
# app/services/tts_service.py
import aiohttp
import asyncio

class TTSService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"
    
    async def text_to_speech(self, text: str, voice_id: str, model_id: str = "eleven_monolingual_v1"):
        """Преобразование текста в речь"""
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    audio_data = await response.read()
                    return audio_data
                else:
                    raise Exception(f"TTS API error: {response.status}")
```

#### Frontend компонент
```javascript
// frontend/src/components/TTS/TTSInput.jsx
import React, { useState } from 'react';
import { useTTS } from '../../hooks/useTTS';

const TTSInput = ({ onAudioGenerated }) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const { generateSpeech, isGenerating } = useTTS();
  
  const handleGenerate = async () => {
    if (!text || !selectedVoice) return;
    
    const audioBlob = await generateSpeech(text, selectedVoice);
    onAudioGenerated(audioBlob);
  };
  
  return (
    <div className="tts-input">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите текст для озвучки..."
        className="w-full p-3 border rounded"
        rows={4}
      />
      <VoiceSelector onVoiceSelect={setSelectedVoice} />
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !text || !selectedVoice}
        className="btn btn-primary"
      >
        {isGenerating ? 'Генерация...' : 'Сгенерировать речь'}
      </button>
    </div>
  );
};
```

## 🚀 Перспективная разработка - Техническая архитектура

### 1. Локальные AI модели

#### Система управления моделями
```python
# app/services/local_ai/model_manager.py
import torch
from transformers import pipeline
import whisper

class LocalAIModelManager:
    def __init__(self):
        self.models = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    async def load_whisper_model(self, model_size: str = "base"):
        """Загрузка Whisper модели для STT"""
        if "whisper" not in self.models:
            self.models["whisper"] = whisper.load_model(model_size)
        return self.models["whisper"]
    
    async def load_tts_model(self, model_name: str = "tts_models/en/ljspeech/tacotron2-DDC"):
        """Загрузка TTS модели"""
        if "tts" not in self.models:
            from TTS.api import TTS
            self.models["tts"] = TTS(model_name).to(self.device)
        return self.models["tts"]
    
    async def transcribe_audio(self, audio_file: bytes) -> str:
        """Транскрипция аудио в текст"""
        model = await self.load_whisper_model()
        result = model.transcribe(audio_file)
        return result["text"]
    
    async def generate_speech(self, text: str, output_path: str):
        """Генерация речи из текста"""
        model = await self.load_tts_model()
        model.tts_to_file(text=text, file_path=output_path)
```

#### Интеграция с существующим кодом
```python
# app/services/audio_processing_service.py
class AudioProcessingService:
    def __init__(self, use_local_models: bool = False):
        self.use_local_models = use_local_models
        if use_local_models:
            self.ai_manager = LocalAIModelManager()
        else:
            self.elevenlabs_service = ElevenLabsService()
    
    async def process_audio(self, audio_file: bytes, voice_id: str = None):
        """Обработка аудио с выбором сервиса"""
        if self.use_local_models:
            # Использование локальных моделей
            text = await self.ai_manager.transcribe_audio(audio_file)
            output_path = f"/tmp/generated_speech_{voice_id}.wav"
            await self.ai_manager.generate_speech(text, output_path)
            
            with open(output_path, "rb") as f:
                return f.read()
        else:
            # Использование внешних сервисов
            return await self.elevenlabs_service.process_audio(audio_file, voice_id)
```

### 2. Система кэширования

#### Redis интеграция
```python
# app/services/cache_service.py
import redis
import json
import pickle
from typing import Any, Optional

class CacheService:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
    
    async def set(self, key: str, value: Any, expire: int = 3600):
        """Сохранение значения в кэш"""
        serialized_value = pickle.dumps(value)
        self.redis_client.setex(key, expire, serialized_value)
    
    async def get(self, key: str) -> Optional[Any]:
        """Получение значения из кэша"""
        value = self.redis_client.get(key)
        if value:
            return pickle.loads(value)
        return None
    
    async def cache_generation_result(self, user_id: int, task_id: str, result: dict):
        """Кэширование результата генерации"""
        key = f"generation:{user_id}:{task_id}"
        await self.set(key, result, expire=86400)  # 24 часа
    
    async def get_cached_generation(self, user_id: int, task_id: str) -> Optional[dict]:
        """Получение кэшированного результата"""
        key = f"generation:{user_id}:{task_id}"
        return await self.get(key)
```

## 🔧 Сопутствующие задачи - Технические решения

### 1. Безопасность

#### Rate Limiting
```python
# app/middleware/rate_limiter.py
from fastapi import Request, HTTPException
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
    
    async def check_rate_limit(self, request: Request):
        client_ip = request.client.host
        current_time = time.time()
        
        # Очистка старых запросов
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < 60
        ]
        
        # Проверка лимита
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Добавление текущего запроса
        self.requests[client_ip].append(current_time)
```

### 2. Мониторинг и логирование

#### Структурированное логирование
```python
# app/core/logging.py
import structlog
import logging
from datetime import datetime

# Настройка структурированного логирования
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Пример использования
def log_generation_request(user_id: int, task_id: str, status: str):
    logger.info(
        "Generation request processed",
        user_id=user_id,
        task_id=task_id,
        status=status,
        timestamp=datetime.utcnow().isoformat()
    )
```

### 3. Тестирование

#### Unit тесты
```python
# tests/test_audio_processing.py
import pytest
from unittest.mock import Mock, patch
from app.services.audio_processing_service import AudioProcessingService

class TestAudioProcessingService:
    @pytest.fixture
    def service(self):
        return AudioProcessingService()
    
    @pytest.mark.asyncio
    async def test_process_audio_with_elevenlabs(self, service):
        # Arrange
        mock_audio = b"fake_audio_data"
        mock_voice_id = "test_voice"
        expected_result = b"processed_audio"
        
        with patch.object(service.elevenlabs_service, 'process_audio') as mock_process:
            mock_process.return_value = expected_result
            
            # Act
            result = await service.process_audio(mock_audio, mock_voice_id)
            
            # Assert
            assert result == expected_result
            mock_process.assert_called_once_with(mock_audio, mock_voice_id)
```

#### E2E тесты
```javascript
// frontend/src/__tests__/e2e/audio-generation.test.js
import { test, expect } from '@playwright/test';

test('Complete audio generation flow', async ({ page }) => {
  // Открытие приложения
  await page.goto('http://localhost:3000');
  
  // Загрузка изображения
  await page.setInputFiles('input[type="file"]', 'test_files/test_image.jpg');
  
  // Запись аудио
  await page.click('[data-testid="record-button"]');
  await page.waitForTimeout(3000); // Запись 3 секунды
  await page.click('[data-testid="stop-button"]');
  
  // Выбор голоса
  await page.selectOption('[data-testid="voice-selector"]', 'test_voice_id');
  
  // Запуск генерации
  await page.click('[data-testid="generate-button"]');
  
  // Ожидание результата
  await page.waitForSelector('[data-testid="video-player"]', { timeout: 30000 });
  
  // Проверка результата
  const videoElement = await page.locator('[data-testid="video-player"] video');
  await expect(videoElement).toBeVisible();
});
```

## 📊 Метрики и мониторинг

### Prometheus метрики
```python
# app/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Метрики
GENERATION_REQUESTS = Counter('generation_requests_total', 'Total generation requests')
GENERATION_DURATION = Histogram('generation_duration_seconds', 'Generation duration')
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
API_ERRORS = Counter('api_errors_total', 'Total API errors', ['service'])

# Middleware для автоматического сбора метрик
class MetricsMiddleware:
    async def __call__(self, request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        # Сбор метрик
        duration = time.time() - start_time
        GENERATION_DURATION.observe(duration)
        
        if request.url.path == "/api/v1/generate":
            GENERATION_REQUESTS.inc()
        
        return response
```

Этот технический документ содержит детальные решения для каждой задачи из TODO листа, включая код, архитектуру и интеграцию с существующей системой.
