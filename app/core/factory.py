"""
Service factory for dependency injection and service management
"""

from typing import Dict, Any, Optional
import logging

from app.core.interfaces import (
    ITTSService, IVideoGenerator, IStorageService, ITaskManager, 
    IAudioProcessor, IConfigurationProvider, IHTTPClient, IDIdFileService
)
from app.core.base import (
    AsyncHTTPClient, ConfigurationProvider, TaskManager, AudioProcessor
)
from app.services.elevenlabs_service import ElevenLabsService
from app.services.d_id_service import DIdService
from app.services.d_id_file_service import DIdFileService
from app.services.d_id_websocket_service import DIdWebSocketService
from app.services.webrtc_service import WebRTCService


class ServiceFactory:
    """
    Factory for creating and managing services following SOLID principles.
    Implements dependency injection and service lifecycle management.
    """
    
    def __init__(self, config_provider: IConfigurationProvider):
        self.config_provider = config_provider
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Service instances cache
        self._services: Dict[str, Any] = {}
        self._http_client: Optional[AsyncHTTPClient] = None
    
    @property
    def http_client(self) -> AsyncHTTPClient:
        """Get or create HTTP client instance"""
        if self._http_client is None:
            self._http_client = AsyncHTTPClient()
        return self._http_client
    
    def get_tts_service(self) -> ITTSService:
        """Get TTS service instance"""
        service_key = "tts_service"
        
        if service_key not in self._services:
            self.logger.info("Creating ElevenLabs TTS service")
            self._services[service_key] = ElevenLabsService(
                config_provider=self.config_provider,
                http_client=self.http_client
            )
        
        return self._services[service_key]
    
    def get_video_generator(self) -> IVideoGenerator:
        """Get video generator service instance"""
        service_key = "video_generator"
        
        if service_key not in self._services:
            self.logger.info("Creating D-ID video generator service")
            self._services[service_key] = DIdService(
                config_provider=self.config_provider,
                http_client=self.http_client
            )
        
        return self._services[service_key]
    
    def get_storage_service(self) -> IStorageService:
        """Get storage service instance"""
        service_key = "storage_service"
        
        if service_key not in self._services:
            self.logger.info("Creating storage service")
            # Import here to avoid circular imports
            from app.services.storage_service import create_storage_service
            self._services[service_key] = create_storage_service(
                self.config_provider,
                self.http_client
            )
        
        return self._services[service_key]
    
    def get_d_id_file_service(self) -> IDIdFileService:
        """Get D-ID file service instance"""
        service_key = "d_id_file_service"
        
        if service_key not in self._services:
            self.logger.info("Creating D-ID file service")
            self._services[service_key] = DIdFileService(
                config_provider=self.config_provider,
                http_client=self.http_client
            )
        
        return self._services[service_key]
    
    def get_task_manager(self) -> ITaskManager:
        """Get task manager instance"""
        service_key = "task_manager"
        
        if service_key not in self._services:
            self.logger.info("Creating task manager")
            self._services[service_key] = TaskManager()
        
        return self._services[service_key]
    
    def get_audio_processor(self) -> IAudioProcessor:
        """Get audio processor instance"""
        service_key = "audio_processor"
        
        if service_key not in self._services:
            self.logger.info("Creating audio processor")
            self._services[service_key] = AudioProcessor()
        
        return self._services[service_key]
    
    def get_websocket_service(self) -> DIdWebSocketService:
        """Get WebSocket service instance"""
        service_key = "websocket_service"
        
        if service_key not in self._services:
            self.logger.info("Creating D-ID WebSocket service")
            self._services[service_key] = DIdWebSocketService()
        
        return self._services[service_key]
    
    def get_webrtc_service(self) -> WebRTCService:
        """Get WebRTC service instance"""
        service_key = "webrtc_service"
        
        if service_key not in self._services:
            self.logger.info("Creating D-ID WebRTC service")
            self._services[service_key] = WebRTCService()
        
        return self._services[service_key]
    
    def get_service(self, service_type: str) -> Any:
        """Get service by type"""
        service_map = {
            "tts": self.get_tts_service,
            "video_generator": self.get_video_generator,
            "storage": self.get_storage_service,
            "d_id_file": self.get_d_id_file_service,
            "task_manager": self.get_task_manager,
            "audio_processor": self.get_audio_processor,
        }
        
        if service_type not in service_map:
            raise ValueError(f"Unknown service type: {service_type}")
        
        return service_map[service_type]()
    
    async def initialize_services(self) -> Dict[str, Any]:
        """Initialize all services and test their configuration"""
        self.logger.info("Initializing all services...")
        
        results = {}
        
        # Test TTS service
        try:
            tts_service = self.get_tts_service()
            results["tts"] = await tts_service.test_authentication()
        except Exception as e:
            self.logger.error(f"TTS service initialization failed: {e}")
            results["tts"] = {"status": "error", "message": str(e)}
        
        # Test video generator service
        try:
            video_service = self.get_video_generator()
            results["video_generator"] = await video_service.test_authentication()
        except Exception as e:
            self.logger.error(f"Video generator service initialization failed: {e}")
            results["video_generator"] = {"status": "error", "message": str(e)}
        
        # Test storage service
        try:
            storage_service = self.get_storage_service()
            # Storage service might not have test_authentication method
            results["storage"] = {"status": "success", "message": "Storage service initialized"}
        except Exception as e:
            self.logger.error(f"Storage service initialization failed: {e}")
            results["storage"] = {"status": "error", "message": str(e)}
        
        # Test D-ID file service
        try:
            d_id_file_service = self.get_d_id_file_service()
            results["d_id_file"] = await d_id_file_service.test_authentication()
        except Exception as e:
            self.logger.error(f"D-ID file service initialization failed: {e}")
            results["d_id_file"] = {"status": "error", "message": str(e)}
        
        self.logger.info("Service initialization completed")
        return results
    
    async def cleanup(self):
        """Cleanup resources"""
        self.logger.info("Cleaning up service factory...")
        
        # Close HTTP client
        if self._http_client:
            await self._http_client.close()
        
        # Clear service cache
        self._services.clear()
        
        self.logger.info("Service factory cleanup completed")


class ServiceContainer:
    """
    Container for managing service dependencies and lifecycle.
    Implements the Service Locator pattern.
    """
    
    def __init__(self, config_provider: IConfigurationProvider):
        self.factory = ServiceFactory(config_provider)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def get_tts_service(self) -> ITTSService:
        """Get TTS service"""
        return self.factory.get_tts_service()
    
    def get_video_generator(self) -> IVideoGenerator:
        """Get video generator"""
        return self.factory.get_video_generator()
    
    def get_storage_service(self) -> IStorageService:
        """Get storage service"""
        return self.factory.get_storage_service()
    
    def get_d_id_file_service(self) -> IDIdFileService:
        """Get D-ID file service"""
        return self.factory.get_d_id_file_service()
    
    def get_task_manager(self) -> ITaskManager:
        """Get task manager"""
        return self.factory.get_task_manager()
    
    def get_audio_processor(self) -> IAudioProcessor:
        """Get audio processor"""
        return self.factory.get_audio_processor()
    
    def get_websocket_service(self) -> DIdWebSocketService:
        """Get WebSocket service instance"""
        return self.factory.get_websocket_service()
    
    def get_webrtc_service(self) -> Any:
        """Get WebRTC service instance"""
        return self.factory.get_webrtc_service()
    
    async def initialize(self) -> Dict[str, Any]:
        """Initialize all services"""
        return await self.factory.initialize_services()
    
    async def cleanup(self):
        """Cleanup all services"""
        await self.factory.cleanup()


# Global service container instance
_service_container: Optional[ServiceContainer] = None


def get_service_container(config_provider: IConfigurationProvider) -> ServiceContainer:
    """Get or create global service container"""
    global _service_container
    if _service_container is None:
        _service_container = ServiceContainer(config_provider)
    return _service_container


def get_tts_service(config_provider: IConfigurationProvider) -> ITTSService:
    """Get TTS service instance"""
    container = get_service_container(config_provider)
    return container.get_tts_service()


def get_video_generator(config_provider: IConfigurationProvider) -> IVideoGenerator:
    """Get video generator instance"""
    container = get_service_container(config_provider)
    return container.get_video_generator()


def get_storage_service(config_provider: IConfigurationProvider) -> IStorageService:
    """Get storage service instance"""
    container = get_service_container(config_provider)
    return container.get_storage_service()


def get_task_manager(config_provider: IConfigurationProvider) -> ITaskManager:
    """Get task manager instance"""
    container = get_service_container(config_provider)
    return container.get_task_manager()


def get_audio_processor(config_provider: IConfigurationProvider) -> IAudioProcessor:
    """Get audio processor instance"""
    container = get_service_container(config_provider)
    return container.get_audio_processor()


def get_d_id_file_service(config_provider: IConfigurationProvider) -> IDIdFileService:
    """Get D-ID file service instance"""
    container = get_service_container(config_provider)
    return container.get_d_id_file_service()
