from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import time

from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: float
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint to verify API is running
    """
    return HealthResponse(
        status="healthy",
        timestamp=time.time(),
        version="1.0.0",
        environment="development"
    )


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with more information
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": "development",
        "services": {
            "api": "healthy",
            "database": "unknown",  # Will be implemented when DB is added
            "redis": "unknown"      # Will be implemented when Redis is added
        }
    }


@router.get("/health/config")
async def config_check() -> Dict[str, Any]:
    """
    Check if environment variables are loaded correctly
    """
    from app.core.config import settings
    
    # Check if environment variables are loaded
    config_status = {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "api_v1_str": settings.API_V1_STR,
        "host": settings.HOST,
        "port": settings.PORT,
        "debug": settings.DEBUG,
        "database_url_configured": bool(settings.DATABASE_URL),
        "redis_url_configured": bool(settings.REDIS_URL),
        "secret_key_configured": bool(settings.SECRET_KEY and settings.SECRET_KEY != "your-secret-key-here-change-in-production"),
        "algorithm": settings.ALGORITHM,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "allowed_hosts": settings.ALLOWED_HOSTS
    }
    
    return {
        "status": "config_loaded",
        "timestamp": time.time(),
        "config": config_status
    }


@router.get("/health/d-id")
async def d_id_health_check() -> Dict[str, Any]:
    """
    Test D-ID service authentication
    """
    try:
        config_provider = ConfigurationProvider(config)
        container = get_service_container(config_provider)
        d_id_service = container.get_video_generator()
        
        auth_result = await d_id_service.test_authentication()
        
        return {
            "status": "d_id_test_completed",
            "timestamp": time.time(),
            "d_id_result": auth_result
        }
    except Exception as e:
        return {
            "status": "d_id_test_failed",
            "timestamp": time.time(),
            "error": str(e)
        } 