from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
import os


class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = "D-ID Talking Head"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS settings
    ALLOWED_HOSTS: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,testserver,localhost,localhost:3001"
    
    # Database settings
    DATABASE_URL: Optional[str] = None
    
    # Redis settings
    REDIS_URL: Optional[str] = None
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # ElevenLabs API Settings
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_BASE_URL: str = "https://api.elevenlabs.io/v1"
    ELEVENLABS_DEFAULT_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    ELEVENLABS_DEFAULT_MODEL: str = "eleven_multilingual_v2"
    ELEVENLABS_STS_MODEL: str = "eleven_multilingual_sts_v2"
    
    # D-ID API Settings
    D_ID_API_KEY: Optional[str] = None
    D_ID_BASE_URL: str = "https://api.d-id.com"
    D_ID_DEFAULT_PRESENTER_ID: str = "bank://lively/driver-05"
    D_ID_DEFAULT_DRIVER_URL: str = "bank://lively/"
    
    # Cloudinary Configuration
    CLOUDINARY_URL: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # Client URL
    CLIENT_URL: str = "http://localhost:3000"
    
    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_DEV_URLS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"
    
    # Default voice settings
    DEFAULT_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    DEFAULT_VOICE_NAME: str = "Rachel"
    DEFAULT_VOICE_DESCRIPTION: str = "Женский голос, теплый и дружелюбный"
    
    # Fallback voices
    FALLBACK_VOICES: str = '[{"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Женский голос, теплый и дружелюбный"}, {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "description": "Женский голос, четкий и профессиональный"}, {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "description": "Женский голос, мягкий и естественный"}, {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "description": "Мужской голос, глубокий и авторитетный"}, {"voice_id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "description": "Женский голос, молодой и энергичный"}, {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Josh", "description": "Мужской голос, дружелюбный и доступный"}, {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Мужской голос, нейтральный и универсальный"}, {"voice_id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam", "description": "Мужской голос, уверенный и профессиональный"}]'
    
    # Audio settings
    AUDIO_SAMPLE_RATE: int = 44100
    AUDIO_BITRATE: str = "128k"
    AUDIO_FORMAT: str = "mp3"
    
    # WebRTC settings
    WEBRTC_ICE_SERVERS: str = "stun:stun.cloudflare.com:3478"
    WEBRTC_TIMEOUT: int = 30
    
    # Streaming settings
    STREAMING_TIMEOUT: int = 60
    STREAMING_MAX_RETRIES: int = 3
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"
    ALLOWED_AUDIO_TYPES: str = "audio/mpeg,audio/wav,audio/webm,audio/ogg"
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if isinstance(v, str):
            return v
        
        # Default to SQLite for development
        return "sqlite:///./app.db"
    
    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "your-secret-key-here-change-in-production":
            import secrets
            return secrets.token_urlsafe(32)
        return v
    
    @field_validator("ALLOWED_HOSTS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: str) -> List[str]:
        if v.strip() == "":
            return ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "testserver", "localhost", "localhost:3001"]
        return [i.strip() for i in v.split(",")]
    
    @field_validator("FALLBACK_VOICES", mode="after")
    @classmethod
    def parse_fallback_voices(cls, v: str) -> List[dict]:
        """Parse fallback voices from environment variable"""
        import json
        if v.strip() == "":
            return [
                {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Женский голос, теплый и дружелюбный"},
                {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "description": "Женский голос, четкий и профессиональный"},
                {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "description": "Женский голос, мягкий и естественный"},
                {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "description": "Мужской голос, глубокий и авторитетный"},
                {"voice_id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "description": "Женский голос, молодой и энергичный"},
                {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Josh", "description": "Мужской голос, дружелюбный и доступный"},
                {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Мужской голос, нейтральный и универсальный"},
                {"voice_id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam", "description": "Мужской голос, уверенный и профессиональный"}
            ]
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            return [
                {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Женский голос, теплый и дружелюбный"},
                {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "description": "Женский голос, четкий и профессиональный"},
                {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "description": "Женский голос, мягкий и естественный"},
                {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "description": "Мужской голос, глубокий и авторитетный"},
                {"voice_id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "description": "Женский голос, молодой и энергичный"},
                {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Josh", "description": "Мужской голос, дружелюбный и доступный"},
                {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Мужской голос, нейтральный и универсальный"},
                {"voice_id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam", "description": "Мужской голос, уверенный и профессиональный"}
            ]
    
    @field_validator("FRONTEND_DEV_URLS", mode="after")
    @classmethod
    def parse_frontend_dev_urls(cls, v: str) -> List[str]:
        """Parse frontend dev URLs from environment variable"""
        if v.strip() == "":
            return ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"]
        return [i.strip() for i in v.split(",")]
    
    @field_validator("WEBRTC_ICE_SERVERS", mode="after")
    @classmethod
    def parse_webrtc_ice_servers(cls, v: str) -> List[str]:
        """Parse WebRTC ICE servers from environment variable"""
        if v.strip() == "":
            return ["stun:stun.cloudflare.com:3478"]
        return [i.strip() for i in v.split(",")]
    
    @field_validator("ALLOWED_IMAGE_TYPES", mode="after")
    @classmethod
    def parse_allowed_image_types(cls, v: str) -> List[str]:
        """Parse allowed image types from environment variable"""
        if v.strip() == "":
            return ["image/jpeg", "image/png", "image/webp"]
        return [i.strip() for i in v.split(",")]
    
    @field_validator("ALLOWED_AUDIO_TYPES", mode="after")
    @classmethod
    def parse_allowed_audio_types(cls, v: str) -> List[str]:
        """Parse allowed audio types from environment variable"""
        if v.strip() == "":
            return ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"]
        return [i.strip() for i in v.split(",")]
    
    def is_elevenlabs_configured(self) -> bool:
        """Проверка конфигурации ElevenLabs"""
        return self.ELEVENLABS_API_KEY is not None and self.ELEVENLABS_API_KEY.strip() != ""
    
    def get_elevenlabs_headers(self) -> dict:
        """Получение заголовков для ElevenLabs API"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔥 ПОЛУЧЕНИЕ ELEVENLABS HEADERS...")
        if not self.is_elevenlabs_configured():
            logger.error(f"❌ ELEVENLABS API KEY НЕ НАСТРОЕН")
            raise ValueError("ElevenLabs API key не настроен")
        
        headers = {
            "xi-api-key": self.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        logger.info(f"✅ ELEVENLABS HEADERS СОЗДАНЫ: {headers}")
        return headers
    
    def is_d_id_configured(self) -> bool:
        """Проверка конфигурации D-ID"""
        return self.D_ID_API_KEY is not None and self.D_ID_API_KEY.strip() != ""
    
    def get_d_id_headers(self) -> dict:
        """Получение заголовков для D-ID API"""
        if not self.is_d_id_configured():
            raise ValueError("D-ID API key не настроен")
        
        # Handle different API key formats
        api_key = self.D_ID_API_KEY.strip()
        
        # Normalize the API key to Basic format
        if api_key.lower().startswith("basic "):
            # Already in Basic format
            auth_header = api_key
        elif ":" in api_key:
            # Format: email:token
            left, right = api_key.split(":", 1)
            try:
                # Try to decode left part as base64
                import base64
                email = base64.b64decode(left).decode("utf-8")
                token = base64.b64encode(f"{email}:{right}".encode("utf-8")).decode("utf-8")
                auth_header = f"Basic {token}"
            except Exception:
                # If decoding fails, encode the whole key
                token = base64.b64encode(api_key.encode("utf-8")).decode("utf-8")
                auth_header = f"Basic {token}"
        else:
            # Plain key, add Basic prefix
            auth_header = f"Basic {api_key}"
        
        return {
            "Authorization": auth_header,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def is_cloudinary_configured(self) -> bool:
        """Проверка конфигурации Cloudinary"""
        return self.CLOUDINARY_URL is not None and self.CLOUDINARY_URL.strip() != ""
    
    def get_cloudinary_config(self) -> dict:
        """Получение конфигурации Cloudinary"""
        if not self.is_cloudinary_configured():
            raise ValueError("Cloudinary URL не настроен")
        
        return {
            "cloudinary_url": self.CLOUDINARY_URL
        }
    
    model_config = ConfigDict(
        env_file = ".env",
        case_sensitive = True,
        extra = "ignore"  # Allow extra environment variables
    )


# Create settings instance
settings = Settings() 