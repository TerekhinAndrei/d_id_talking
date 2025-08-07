"""
Refactored ElevenLabs Service following SOLID principles
"""

import base64
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from app.core.interfaces import (
    ITTSService, AudioData, AudioFormat, Voice, VoiceSettings, 
    ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient


class ElevenLabsServiceError(ServiceError):
    """ElevenLabs service specific errors"""
    pass


class ElevenLabsConfigurationError(ConfigurationError):
    """ElevenLabs configuration errors"""
    pass


class ElevenLabsAPIError(APIError):
    """ElevenLabs API errors"""
    pass


class ElevenLabsService(ITTSService, BaseService):
    """
    Refactored ElevenLabs service following SOLID principles:
    - Single Responsibility: Only handles ElevenLabs API operations
    - Open/Closed: Extensible through interfaces
    - Liskov Substitution: Implements ITTSService interface
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Service-specific configuration
        self.api_key = self.config.get_setting("ELEVENLABS_API_KEY")
        self.base_url = self.config.get_setting("ELEVENLABS_BASE_URL")
        self.default_voice_id = self.config.get_setting("ELEVENLABS_DEFAULT_VOICE_ID")
        self.default_model = self.config.get_setting("ELEVENLABS_DEFAULT_MODEL")
        self.sts_model = self.config.get_setting("ELEVENLABS_STS_MODEL")
        
        self.logger.info(f"ElevenLabsService initialized with base URL: {self.base_url}")
    
    @property
    def service_name(self) -> str:
        return "elevenlabs"
    
    async def text_to_speech(self, text: str, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert text to speech"""
        if not text.strip():
            raise ElevenLabsServiceError("Text cannot be empty")
        
        if not await self.validate_voice_id(voice_id):
            raise ElevenLabsServiceError(f"Invalid voice ID: {voice_id}")
        
        try:
            endpoint = f"{self.base_url}/text-to-speech/{voice_id}"
            
            payload = {
                "text": text,
                "model_id": self.default_model,
                "voice_settings": settings.__dict__ if settings else VoiceSettings().__dict__
            }
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/json"
            
            self.logger.info(f"Making TTS request to {endpoint} with voice {voice_id}")
            
            response = await self.http_client.make_request(
                method="POST",
                url=endpoint,
                headers=headers,
                data=payload
            )
            
            self.logger.info(f"TTS response received, type: {type(response)}")
            
            # ElevenLabs returns binary audio data directly, not base64
            audio_bytes = None
            if isinstance(response, bytes):
                self.logger.info("Response is binary audio data")
                audio_bytes = response
            elif isinstance(response, dict):
                self.logger.warning("Unexpected dict response from ElevenLabs")
                # Try to extract audio data if it's in a dict
                if "audio_data" in response:
                    try:
                        audio_bytes = base64.b64decode(response["audio_data"])
                        self.logger.info(f"Successfully decoded base64 audio, size: {len(audio_bytes)} bytes")
                    except Exception as decode_error:
                        self.logger.error(f"Failed to decode base64 audio: {decode_error}")
                        raise ElevenLabsServiceError(f"Failed to decode audio data: {str(decode_error)}")
                else:
                    raise ElevenLabsServiceError("No audio data found in response")
            else:
                self.logger.warning(f"Unexpected response type: {type(response)}")
                # Try to convert to bytes
                try:
                    audio_bytes = bytes(response) if hasattr(response, '__iter__') else str(response).encode()
                except Exception as e:
                    self.logger.error(f"Failed to convert response to bytes: {e}")
                    raise ElevenLabsServiceError(f"Invalid response format: {str(e)}")
            
            if not audio_bytes:
                raise ElevenLabsServiceError("No audio data received from ElevenLabs")
            
            if len(audio_bytes) == 0:
                raise ElevenLabsServiceError("Received empty audio data from ElevenLabs")
            
            self.logger.info(f"Successfully processed audio data, final size: {len(audio_bytes)} bytes")
            
            return AudioData(
                data=audio_bytes,
                format=AudioFormat.MP3,
                sample_rate=44100,
                bitrate="128k"
            )
            
        except APIError as e:
            self.logger.error(f"ElevenLabs TTS API error: {e}")
            raise ElevenLabsAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error in text_to_speech: {e}")
            raise ElevenLabsServiceError(f"Text-to-speech failed: {str(e)}")
    
    async def speech_to_speech(self, audio_data: AudioData, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert speech to speech with different voice"""
        if not await self.validate_voice_id(voice_id):
            raise ElevenLabsServiceError(f"Invalid voice ID: {voice_id}")
        
        try:
            endpoint = f"{self.base_url}/speech-to-speech/{voice_id}"
            
            # Prepare form data
            files = {
                "audio": ("audio.wav", audio_data.data, "audio/wav")
            }
            
            data = {
                "model_id": self.sts_model,
                "voice_settings": settings.__dict__ if settings else VoiceSettings().__dict__
            }
            
            headers = self._get_headers()
            # Remove Content-Type for multipart form data
            
            self.logger.info(f"Making STS request to {endpoint} with voice {voice_id}")
            
            response = await self.http_client.make_request(
                method="POST",
                url=endpoint,
                headers=headers,
                data=data,
                files=files
            )
            
            self.logger.info(f"STS response received, type: {type(response)}")
            
            # ElevenLabs returns binary audio data directly, not base64
            audio_bytes = None
            if isinstance(response, bytes):
                self.logger.info("Response is binary audio data")
                audio_bytes = response
            elif isinstance(response, dict):
                self.logger.warning("Unexpected dict response from ElevenLabs")
                # Try to extract audio data if it's in a dict
                if "audio_data" in response:
                    try:
                        audio_bytes = base64.b64decode(response["audio_data"])
                        self.logger.info(f"Successfully decoded base64 audio, size: {len(audio_bytes)} bytes")
                    except Exception as decode_error:
                        self.logger.error(f"Failed to decode base64 audio: {decode_error}")
                        raise ElevenLabsServiceError(f"Failed to decode audio data: {str(decode_error)}")
                else:
                    raise ElevenLabsServiceError("No audio data found in response")
            else:
                self.logger.warning(f"Unexpected response type: {type(response)}")
                # Try to convert to bytes
                try:
                    audio_bytes = bytes(response) if hasattr(response, '__iter__') else str(response).encode()
                except Exception as e:
                    self.logger.error(f"Failed to convert response to bytes: {e}")
                    raise ElevenLabsServiceError(f"Invalid response format: {str(e)}")
            
            if not audio_bytes:
                raise ElevenLabsServiceError("No audio data received from ElevenLabs")
            
            if len(audio_bytes) == 0:
                raise ElevenLabsServiceError("Received empty audio data from ElevenLabs")
            
            self.logger.info(f"Successfully processed STS audio data, final size: {len(audio_bytes)} bytes")
            
            return AudioData(
                data=audio_bytes,
                format=AudioFormat.MP3,
                sample_rate=44100,
                bitrate="128k"
            )
            
        except APIError as e:
            self.logger.error(f"ElevenLabs STS API error: {e}")
            raise ElevenLabsAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error in speech_to_speech: {e}")
            raise ElevenLabsServiceError(f"Speech-to-speech failed: {str(e)}")
    
    async def get_available_voices(self) -> List[Voice]:
        """Get list of available voices"""
        try:
            endpoint = f"{self.base_url}/voices"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers
            )
            
            voices = []
            for voice_data in response.get("voices", []):
                voice = Voice(
                    voice_id=voice_data.get("voice_id", ""),
                    name=voice_data.get("name", ""),
                    category=voice_data.get("category", ""),
                    description=voice_data.get("description", ""),
                    labels=voice_data.get("labels", {})
                )
                voices.append(voice)
            
            return voices
            
        except APIError as e:
            self.logger.error(f"ElevenLabs voices API error: {e}")
            raise ElevenLabsAPIError(e.status_code, e.message)
        except Exception as e:
            self.logger.error(f"Unexpected error getting voices: {e}")
            raise ElevenLabsServiceError(f"Failed to get voices: {str(e)}")
    
    async def validate_voice_id(self, voice_id: str) -> bool:
        """Validate voice ID"""
        if not voice_id:
            return False
        
        try:
            # Try to get voice details to validate
            endpoint = f"{self.base_url}/voices/{voice_id}"
            headers = self._get_headers()
            
            await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers
            )
            
            return True
            
        except APIError as e:
            if e.status_code == 404:
                return False
            # For other errors, we can't determine validity
            self.logger.warning(f"Error validating voice ID {voice_id}: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error validating voice ID: {e}")
            return False
    
    async def test_authentication(self) -> Dict[str, Any]:
        """Test service authentication"""
        try:
            endpoint = f"{self.base_url}/voices"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers
            )
            
            return {
                "status": "success",
                "message": "ElevenLabs authentication successful",
                "voices_count": len(response.get("voices", [])),
                "timestamp": self._get_current_timestamp()
            }
            
        except APIError as e:
            return {
                "status": "error",
                "message": f"ElevenLabs authentication failed: {e.message}",
                "status_code": e.status_code,
                "timestamp": self._get_current_timestamp()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error during authentication: {str(e)}",
                "timestamp": self._get_current_timestamp()
            }
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
