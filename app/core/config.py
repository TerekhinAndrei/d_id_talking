from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
import os


class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = "FastAPI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = ["*"]
    
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
    
    # D-ID API Settings
    D_ID_API_KEY: Optional[str] = None
    D_ID_BASE_URL: str = "https://api.d-id.com"
    D_ID_DEFAULT_PRESENTER_ID: str = "bank://lively/driver-05"
    
    # Cloudinary Configuration
    CLOUDINARY_URL: Optional[str] = None
    
    # Client URL
    CLIENT_URL: str = "http://localhost:3000"
    
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
    
    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
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
        
        # D-ID API ключ уже в правильном формате
        return {
            "Authorization": f"Basic {self.D_ID_API_KEY}",
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