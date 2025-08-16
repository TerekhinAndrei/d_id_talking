"""
Base classes for API endpoints to eliminate code duplication
"""

from typing import Dict, Any
from fastapi import Depends

from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config


class BaseEndpoint:
    """Base class for API endpoints to eliminate code duplication"""
    
    @staticmethod
    def get_services() -> Dict[str, Any]:
        """Dependency injection for services - eliminates duplication across endpoints"""
        config_provider = ConfigurationProvider(config)
        container = get_service_container(config_provider)
        return {
            "tts_service": container.get_tts_service(),
            "video_generator": container.get_video_generator(),
            "storage_service": container.get_storage_service(),
            "d_id_file_service": container.get_d_id_file_service(),
            "task_manager": container.get_task_manager(),
            "audio_processor": container.get_audio_processor(),
            "websocket_service": container.get_websocket_service(),
            "webrtc_service": container.get_webrtc_service(),
            "config_provider": config_provider
        }
    
    @staticmethod
    def get_services_dependency():
        """FastAPI dependency for services"""
        return Depends(BaseEndpoint.get_services)
