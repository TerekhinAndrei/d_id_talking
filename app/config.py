"""
Centralized configuration management for the application.
Handles environment variables, API keys, and application settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

class Config:
    """Централизованная конфигурация приложения"""
    
    # Основные настройки
    PROJECT_NAME: str = "D-ID Talking API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Настройки сервера
    PORT: int = int(os.getenv("PORT", "3001"))
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:3000")
    ALLOWED_HOSTS: list = ["*"]  # Разрешаем все хосты для разработки
    
    # ElevenLabs Configuration
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_BASE_URL: str = "https://api.elevenlabs.io/v1"
    ELEVENLABS_DEFAULT_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    
    # D-ID Configuration
    D_ID_API_KEY: Optional[str] = os.getenv("D_ID_API_KEY")
    D_ID_BASE_URL: str = "https://api.d-id.com"
    
    # Cloudinary Configuration
    CLOUDINARY_URL: Optional[str] = os.getenv("CLOUDINARY_URL")
    
    @classmethod
    def is_elevenlabs_configured(cls) -> bool:
        """Проверка конфигурации ElevenLabs"""
        return cls.ELEVENLABS_API_KEY is not None and cls.ELEVENLABS_API_KEY.strip() != ""
    
    @classmethod
    def get_elevenlabs_headers(cls) -> dict:
        """Получение заголовков для ElevenLabs API"""
        if not cls.is_elevenlabs_configured():
            raise ValueError("ElevenLabs API key не настроен")
        return {
            "xi-api-key": cls.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
    
    @classmethod
    def is_d_id_configured(cls) -> bool:
        """Проверка конфигурации D-ID"""
        return cls.D_ID_API_KEY is not None and cls.D_ID_API_KEY.strip() != ""
    
    @classmethod
    def get_d_id_headers(cls) -> dict:
        """Получение заголовков для D-ID API"""
        if not cls.is_d_id_configured():
            raise ValueError("D-ID API key не настроен")
        
        # D-ID использует Basic Auth с форматом API_USERNAME:API_PASSWORD
        import base64
        api_key_encoded = base64.b64encode(cls.D_ID_API_KEY.encode()).decode()
        
        return {
            "Authorization": f"Basic {api_key_encoded}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    @classmethod
    def is_cloudinary_configured(cls) -> bool:
        """Проверка конфигурации Cloudinary"""
        return cls.CLOUDINARY_URL is not None and cls.CLOUDINARY_URL.strip() != ""
    
    @classmethod
    def get_cloudinary_config(cls) -> dict:
        """Получение конфигурации Cloudinary"""
        if not cls.is_cloudinary_configured():
            raise ValueError("Cloudinary URL не настроен")
        
        return {
            "cloudinary_url": cls.CLOUDINARY_URL
        }

# Создаем глобальный экземпляр конфигурации
config = Config() 