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
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    
    # D-ID API Settings
    D_ID_API_KEY: Optional[str] = None
    D_ID_BASE_URL: str = "https://api.d-id.com"
    D_ID_DEFAULT_PRESENTER_ID: str = "bank://lively/driver-05"
    
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
    
    model_config = ConfigDict(
        env_file = ".env",
        case_sensitive = True,
        extra = "ignore"  # Allow extra environment variables
    )


# Create settings instance
settings = Settings() 