"""
Refactored D-ID Service following SOLID principles
"""

import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from app.core.interfaces import (
    IVideoGenerator, VideoRequest, VideoResponse, VideoStatus, AudioData,
    ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient


class DIdServiceError(ServiceError):
    """D-ID service specific errors"""
    pass


class DIdConfigurationError(ConfigurationError):
    """D-ID configuration errors"""
    pass


class DIdAPIError(APIError):
    """D-ID API errors"""
    pass


class DIdModel(str, Enum):
    """Available D-ID models for video generation"""
    REALISTIC = "realistic"
    ANIMATED = "animated"


class DIdScriptType(str, Enum):
    """D-ID script types"""
    TEXT = "text"
    AUDIO = "audio"


class DIdProviderType(str, Enum):
    """D-ID TTS provider types"""
    MICROSOFT = "microsoft"
    ELEVENLABS = "elevenlabs"
    GOOGLE = "google"


@dataclass
class DIdScript:
    """D-ID script configuration"""
    type: DIdScriptType
    input: Optional[str] = None  # For text scripts
    audio_url: Optional[str] = None  # For audio scripts
    provider: Optional[Dict[str, Any]] = None  # For TTS providers


@dataclass
class DIdConfig:
    """D-ID configuration"""
    stitch: bool = True
    result_format: str = "mp4"


class DIdService(IVideoGenerator, BaseService):
    """
    Refactored D-ID service following SOLID principles:
    - Single Responsibility: Only handles D-ID API operations
    - Open/Closed: Extensible through interfaces
    - Liskov Substitution: Implements IVideoGenerator interface
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Service-specific configuration
        self.api_key = self.config.get_setting("D_ID_API_KEY")
        self.base_url = self.config.get_setting("D_ID_BASE_URL")
        self.default_presenter_id = self.config.get_setting("D_ID_DEFAULT_PRESENTER_ID")
        self.default_driver_url = self.config.get_setting("D_ID_DEFAULT_DRIVER_URL")
        
        self.logger.info(f"DIdService initialized with base URL: {self.base_url}")
    
    @property
    def service_name(self) -> str:
        return "d_id"
    
    async def create_video(self, request: VideoRequest) -> str:
        """Create video generation task"""
        try:
            # Validate request
            if not request.image_url:
                raise DIdServiceError("Image URL is required")
            
            if not request.audio_data or not request.audio_data.data:
                raise DIdServiceError("Audio data is required")
            
            # Create script based on audio data
            script = DIdScript(
                type=DIdScriptType.AUDIO,
                audio_url=request.audio_data.url if hasattr(request.audio_data, 'url') else None
            )
            
            # Prepare request payload
            payload = {
                "source_url": request.image_url,
                "script": {
                    "type": script.type.value,
                    "input": script.input,
                    "audio_url": script.audio_url,
                    "provider": script.provider
                },
                "config": {
                    "stitch": True,
                    "result_format": "mp4"
                }
            }
            
            if request.driver_url:
                payload["driver_url"] = request.driver_url
            else:
                payload["driver_url"] = self.default_driver_url
            
            if request.webhook:
                payload["webhook"] = request.webhook
            
            if request.config:
                payload["config"].update(request.config)
            
            endpoint = f"{self.base_url}/talks"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="POST",
                url=endpoint,
                headers=headers,
                data=payload
            )
            
            video_id = response.get("id")
            if not video_id:
                raise DIdServiceError("No video ID returned from D-ID API")
            
            self.logger.info(f"Created D-ID video with ID: {video_id}")
            return video_id
            
        except APIError as e:
            self.logger.error(f"D-ID create video API error: {e}")
            raise DIdAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error creating video: {e}")
            raise DIdServiceError(f"Video creation failed: {str(e)}")
    
    async def get_video_status(self, video_id: str) -> VideoResponse:
        """Get video generation status"""
        try:
            endpoint = f"{self.base_url}/talks/{video_id}"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers
            )
            
            # Map D-ID status to our VideoStatus enum
            d_id_status = response.get("status", "")
            if d_id_status == "created":
                status = VideoStatus.PENDING
            elif d_id_status == "started":
                status = VideoStatus.PROCESSING
            elif d_id_status == "done":
                status = VideoStatus.COMPLETED
            elif d_id_status == "failed":
                status = VideoStatus.FAILED
            elif d_id_status == "rejected":
                status = VideoStatus.FAILED
            else:
                status = VideoStatus.PENDING
            
            return VideoResponse(
                video_id=video_id,
                status=status,
                result_url=response.get("result_url"),
                error_message=response.get("error", {}).get("message") if response.get("error") else None,
                created_at=response.get("created_at", ""),
                updated_at=response.get("updated_at", "")
            )
            
        except APIError as e:
            self.logger.error(f"D-ID get status API error: {e}")
            raise DIdAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error getting video status: {e}")
            raise DIdServiceError(f"Failed to get video status: {str(e)}")
    
    async def cancel_video(self, video_id: str) -> bool:
        """Cancel video generation"""
        try:
            endpoint = f"{self.base_url}/talks/{video_id}"
            headers = self._get_headers()
            
            await self.http_client.make_request(
                method="DELETE",
                url=endpoint,
                headers=headers
            )
            
            self.logger.info(f"Cancelled D-ID video: {video_id}")
            return True
            
        except APIError as e:
            self.logger.error(f"D-ID cancel video API error: {e}")
            raise DIdAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error cancelling video: {e}")
            raise DIdServiceError(f"Failed to cancel video: {str(e)}")
    
    async def test_authentication(self) -> Dict[str, Any]:
        """Test service authentication"""
        try:
            endpoint = f"{self.base_url}/talks"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers
            )
            
            return {
                "status": "success",
                "message": "D-ID authentication successful",
                "talks_count": len(response.get("talks", [])),
                "timestamp": self._get_current_timestamp()
            }
            
        except APIError as e:
            return {
                "status": "error",
                "message": f"D-ID authentication failed: {e.message}",
                "status_code": e.status_code,
                "timestamp": self._get_current_timestamp()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error during authentication: {str(e)}",
                "timestamp": self._get_current_timestamp()
            }
    
    async def create_talk_with_text(
        self, 
        image_url: str, 
        text: str, 
        provider: Optional[DIdProviderType] = None,
        voice_id: Optional[str] = None,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Create talk with text input"""
        try:
            # Create script with text
            script = DIdScript(
                type=DIdScriptType.TEXT,
                input=text,
                provider={
                    "type": provider.value if provider else "microsoft",
                    "voice_id": voice_id
                } if provider or voice_id else None
            )
            
            # Create audio data placeholder
            audio_data = AudioData(
                data=b"",  # Placeholder
                format=None,  # Will be determined by TTS
                sample_rate=44100,
                bitrate="128k"
            )
            
            # Create video request
            request = VideoRequest(
                image_url=image_url,
                audio_data=audio_data,
                driver_url=driver_url,
                webhook=webhook,
                config={
                    "script": {
                        "type": script.type.value,
                        "input": script.input,
                        "provider": script.provider
                    }
                }
            )
            
            return await self.create_video(request)
            
        except Exception as e:
            self.logger.error(f"Error creating talk with text: {e}")
            raise DIdServiceError(f"Failed to create talk with text: {str(e)}")
    
    async def create_talk_with_audio(
        self,
        image_url: str,
        audio_url: str,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Create talk with audio input"""
        try:
            # Create script configuration for audio
            script = {
                "type": "audio",
                "audio_url": audio_url
            }
            
            # Create config
            config = {
                "stitch": True,
                "result_format": "mp4"
            }
            
            # Use create_talk_direct with proper script
            return await self.create_talk_direct(
                source_url=image_url,
                script=script,
                config=config,
                driver_url=driver_url,
                webhook=webhook
            )
            
        except Exception as e:
            self.logger.error(f"Error creating talk with audio: {e}")
            raise DIdServiceError(f"Failed to create talk with audio: {str(e)}")
    
    async def create_talk_direct(
        self,
        source_url: str,
        script: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Create talk directly with script configuration"""
        try:
            # Validate request
            if not source_url:
                raise DIdServiceError("Source URL is required")
            
            if not script:
                raise DIdServiceError("Script configuration is required")
            
            # Prepare request payload
            payload = {
                "source_url": source_url,
                "script": script,
                "config": config or {"stitch": True, "result_format": "mp4"}
            }
            
            if driver_url:
                payload["driver_url"] = driver_url
            else:
                payload["driver_url"] = self.default_driver_url
            
            if webhook:
                payload["webhook"] = webhook
            
            endpoint = f"{self.base_url}/talks"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="POST",
                url=endpoint,
                headers=headers,
                data=payload
            )
            
            video_id = response.get("id")
            if not video_id:
                raise DIdServiceError("No video ID returned from D-ID API")
            
            self.logger.info(f"Created D-ID talk with ID: {video_id}")
            return video_id
            
        except APIError as e:
            self.logger.error(f"D-ID create talk API error: {e}")
            raise DIdAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error creating talk: {e}")
            raise DIdServiceError(f"Talk creation failed: {str(e)}")
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
