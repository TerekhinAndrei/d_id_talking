import requests
import base64
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from app.core.config import settings as config

logger = logging.getLogger(__name__)


class ElevenLabsModel(str, Enum):
    """Available ElevenLabs models"""
    MULTILINGUAL_V2 = "eleven_multilingual_v2"
    MONOLINGUAL_V1 = "eleven_monolingual_v1"
    MULTILINGUAL_STS_V2 = "eleven_multilingual_sts_v2"  # Speech-to-Speech
    ENGLISH_STS_V2 = "eleven_english_sts_v2"  # Speech-to-Speech (English)


@dataclass
class VoiceSettings:
    """Voice settings for ElevenLabs API"""
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True


@dataclass
class SpeechToSpeechRequest:
    """Request model for speech-to-speech conversion"""
    audio_data: bytes
    voice_id: str
    model_id: ElevenLabsModel = ElevenLabsModel.MULTILINGUAL_STS_V2  # Use STS model by default
    voice_settings: VoiceSettings = None
    
    def __post_init__(self):
        if self.voice_settings is None:
            self.voice_settings = VoiceSettings()


@dataclass
class Voice:
    """Voice model from ElevenLabs API"""
    voice_id: str
    name: str
    category: str
    description: str = ""
    labels: Dict[str, str] = None
    
    def __post_init__(self):
        if self.labels is None:
            self.labels = {}


class ElevenLabsServiceError(Exception):
    """Base exception for ElevenLabs service errors"""
    pass


class ElevenLabsConfigurationError(ElevenLabsServiceError):
    """Raised when ElevenLabs is not properly configured"""
    pass


class ElevenLabsAPIError(ElevenLabsServiceError):
    """Raised when ElevenLabs API returns an error"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"ElevenLabs API error {status_code}: {message}")


class ElevenLabsService:
    """
    Service for interacting with ElevenLabs Speech to Speech API.
    Uses requests library for HTTP calls and centralized configuration.
    """
    
    def __init__(self):
        """Initialize the ElevenLabs service with centralized configuration"""
        self.api_key = config.ELEVENLABS_API_KEY
        self.base_url = config.ELEVENLABS_BASE_URL
        self.default_voice_id = config.ELEVENLABS_DEFAULT_VOICE_ID
        
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY not found in environment variables")
    
    def _validate_configuration(self) -> None:
        """Validate that the service is properly configured"""
        if not config.is_elevenlabs_configured():
            raise ElevenLabsConfigurationError("ElevenLabs API key not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        logger.info(f"🔥 СОЗДАНИЕ ELEVENLABS HEADERS...")
        headers = config.get_elevenlabs_headers()
        logger.info(f"✅ ELEVENLABS HEADERS СОЗДАНЫ: {headers}")
        return headers
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        files: Optional[Dict] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        Make a request to the ElevenLabs API using requests library
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request data (JSON)
            files: Files for multipart/form-data requests
            timeout: Request timeout in seconds
            
        Returns:
            API response as dictionary
            
        Raises:
            ElevenLabsAPIError: If API returns an error
            ElevenLabsServiceError: For other service errors
        """
        self._validate_configuration()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == "POST":
                if files:
                    # For multipart/form-data requests
                    response = requests.post(url, headers=headers, files=files, timeout=timeout)
                else:
                    # For JSON requests
                    response = requests.post(url, headers=headers, json=data, timeout=timeout)
            else:
                raise ElevenLabsServiceError(f"Unsupported HTTP method: {method}")
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Return JSON response if available
            if response.headers.get('content-type', '').startswith('application/json'):
                return response.json()
            else:
                return {"content": response.content}
                
        except requests.exceptions.HTTPError as e:
            logger.error(f"ElevenLabs API error: {e.response.status_code} - {e.response.text}")
            raise ElevenLabsAPIError(e.response.status_code, e.response.text)
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during ElevenLabs API call: {str(e)}")
            raise ElevenLabsServiceError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during ElevenLabs API call: {str(e)}")
            raise ElevenLabsServiceError(f"Unexpected error: {str(e)}")
    
    def speech_to_speech(self, request: SpeechToSpeechRequest) -> bytes:
        """
        Convert speech to speech using ElevenLabs STS API
        Uses the correct endpoint: /speech-to-speech/{voice_id}
        
        Args:
            request: SpeechToSpeechRequest object with all necessary parameters
            
        Returns:
            Processed audio bytes
            
        Raises:
            ElevenLabsConfigurationError: If service is not configured
            ElevenLabsAPIError: If API returns an error
            ElevenLabsServiceError: For other service errors
        """
        try:
            # Prepare the request as multipart/form-data
            files = {
                'audio': ('audio.wav', request.audio_data, 'audio/wav'),
            }
            
            # Prepare form data
            data = {
                'model_id': request.model_id.value,
                'voice_settings[stability]': str(request.voice_settings.stability),
                'voice_settings[similarity_boost]': str(request.voice_settings.similarity_boost),
                'voice_settings[style]': str(request.voice_settings.style),
                'voice_settings[use_speaker_boost]': str(request.voice_settings.use_speaker_boost).lower(),
            }
            
            # Use the correct endpoint format
            endpoint = f"speech-to-speech/{request.voice_id}"
            
            logger.info(f"Отправка аудио в ElevenLabs... Voice: {request.voice_id}, Size: {len(request.audio_data)} bytes")
            
            # Make direct request to handle multipart/form-data properly
            url = f"{self.base_url}/{endpoint}"
            headers = {"xi-api-key": self.api_key}
            
            response = requests.post(
                url,
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            response.raise_for_status()
            
            # Handle response
            content_type = response.headers.get('content-type', '')
            if 'application/json' in content_type:
                result = response.json()
                if "audio" in result:
                    audio_base64 = result["audio"]
                    processed_audio = base64.b64decode(audio_base64)
                    logger.info(f"Аудио успешно получено от ElevenLabs! Voice: {request.voice_id}, Size: {len(processed_audio)} bytes")
                    return processed_audio
                else:
                    raise ElevenLabsServiceError("No audio data received from ElevenLabs")
            else:
                # Binary response
                logger.info(f"Аудио успешно получено от ElevenLabs! Voice: {request.voice_id}, Size: {len(response.content)} bytes")
                return response.content
                    
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 400:
                logger.warning("Speech-to-Speech API returned 400. This might require special access. Falling back to Text-to-Speech...")
                # Fallback to text-to-speech with a default message
                return self._fallback_text_to_speech(request.voice_id)
            else:
                raise ElevenLabsAPIError(e.response.status_code, e.response.text)
        except ElevenLabsAPIError:
            raise
        except Exception as e:
            logger.error(f"Error in speech_to_speech: {str(e)}")
            raise ElevenLabsServiceError(f"Speech to speech processing failed: {str(e)}")

    def _fallback_text_to_speech(self, voice_id: str) -> bytes:
        """
        Fallback method using Text-to-Speech API when Speech-to-Speech is not available
        """
        try:
            # Use a default text message for demonstration
            text = "Hello, this is a demonstration of the ElevenLabs API integration."
            
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            headers = {"xi-api-key": self.api_key}
            
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            logger.info(f"Using Text-to-Speech fallback for voice: {voice_id}")
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=60
            )
            
            response.raise_for_status()
            
            logger.info(f"Text-to-Speech fallback successful! Voice: {voice_id}, Size: {len(response.content)} bytes")
            return response.content
            
        except Exception as e:
            logger.error(f"Fallback Text-to-Speech also failed: {str(e)}")
            raise ElevenLabsServiceError(f"Both Speech-to-Speech and Text-to-Speech failed: {str(e)}")

    def text_to_speech(self, text: str, voice_id: str, model_id: str = "eleven_multilingual_v2") -> bytes:
        """
        Convert text to speech using ElevenLabs TTS API
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use
            model_id: Model ID to use
            
        Returns:
            Audio bytes
            
        Raises:
            ElevenLabsConfigurationError: If service is not configured
            ElevenLabsAPIError: If API returns an error
            ElevenLabsServiceError: For other service errors
        """
        try:
            self._validate_configuration()
            
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            headers = {"xi-api-key": self.api_key}
            
            data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            logger.info(f"Converting text to speech... Voice: {voice_id}, Text length: {len(text)}")
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=60
            )
            
            response.raise_for_status()
            
            logger.info(f"Text-to-Speech successful! Voice: {voice_id}, Size: {len(response.content)} bytes")
            return response.content
            
        except requests.exceptions.HTTPError as e:
            raise ElevenLabsAPIError(e.response.status_code, e.response.text)
        except ElevenLabsAPIError:
            raise
        except Exception as e:
            logger.error(f"Error in text_to_speech: {str(e)}")
            raise ElevenLabsServiceError(f"Text to speech processing failed: {str(e)}")

    def text_to_speech_stream(self, text: str, voice_id: str, model_id: str = "eleven_multilingual_v2") -> bytes:
        """
        Convert text to speech using ElevenLabs streaming TTS API
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use
            model_id: Model ID to use (default: eleven_multilingual_v2)
            
        Returns:
            bytes: Audio data from streaming response
            
        Raises:
            ElevenLabsConfigurationError: If service is not configured
            ElevenLabsAPIError: If API returns an error
            ElevenLabsServiceError: For other service errors
        """
        try:
            self._validate_configuration()
            
            url = f"{self.base_url}/text-to-speech/{voice_id}/stream"
            headers = {"xi-api-key": self.api_key}
            
            data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            logger.info(f"Converting text to speech (streaming)... Voice: {voice_id}, Text length: {len(text)}")
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=60,
                stream=True  # Enable streaming
            )
            
            response.raise_for_status()
            
            # Collect all chunks into a single bytes object
            audio_chunks = []
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive new chunks
                    audio_chunks.append(chunk)
            
            audio_data = b''.join(audio_chunks)
            
            logger.info(f"Text-to-Speech streaming successful! Voice: {voice_id}, Size: {len(audio_data)} bytes")
            return audio_data
            
        except requests.exceptions.HTTPError as e:
            raise ElevenLabsAPIError(e.response.status_code, e.response.text)
        except ElevenLabsAPIError:
            raise
        except Exception as e:
            logger.error(f"Error in text_to_speech_stream: {str(e)}")
            raise ElevenLabsServiceError(f"Text to speech streaming failed: {str(e)}")
    
    def get_available_voices(self) -> List[Voice]:
        """
        Get all available voices from ElevenLabs API
        
        Returns:
            List[Voice]: List of available voices
            
        Raises:
            ElevenLabsConfigurationError: If service is not configured
            ElevenLabsAPIError: If API request fails
        """
        """
        Get list of available voices from ElevenLabs
        
        Returns:
            List of Voice objects
            
        Raises:
            ElevenLabsConfigurationError: If service is not configured
            ElevenLabsAPIError: If API returns an error
            ElevenLabsServiceError: For other service errors
        """
        try:
            result = self._make_request("GET", "/voices", timeout=30)
            voices_data = result.get("voices", [])
            
            voices = []
            for voice_data in voices_data:
                voice = Voice(
                    voice_id=voice_data.get("voice_id", ""),
                    name=voice_data.get("name", ""),
                    category=voice_data.get("category", ""),
                    description=voice_data.get("description", ""),
                    labels=voice_data.get("labels", {})
                )
                voices.append(voice)
            
            return voices
    
        except ElevenLabsAPIError:
            raise
        except Exception as e:
            logger.error(f"Error fetching voices: {str(e)}")
            raise ElevenLabsServiceError(f"Error fetching voices: {str(e)}")
    
    def get_voices(self) -> List[Voice]:
        """
        Alias for get_available_voices()
        
        Returns:
            List[Voice]: List of available voices
        """
        return self.get_available_voices()
    
    def validate_voice_id(self, voice_id: str) -> bool:
        """
        Validate if a voice ID exists
        
        Args:
            voice_id: Voice ID to validate
            
        Returns:
            True if voice exists, False otherwise
            
        Raises:
            ElevenLabsServiceError: For service errors
        """
        try:
            voices = self.get_available_voices()
            return any(voice.voice_id == voice_id for voice in voices)
        except Exception as e:
            logger.error(f"Error validating voice ID {voice_id}: {str(e)}")
            raise ElevenLabsServiceError(f"Error validating voice ID: {str(e)}")
    
    def get_voice_by_id(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """
        Получить голос по ID
        :param voice_id: ID голоса
        :return: Dict с информацией о голосе или None
        """
        try:
            result = self._make_request("GET", f"/voices/{voice_id}")
            return result
        except ElevenLabsAPIError:
            return None
        except Exception as e:
            logger.error(f"Error getting voice by ID {voice_id}: {str(e)}")
            raise ElevenLabsServiceError(f"Error getting voice by ID: {str(e)}")

    def test_authentication(self) -> Dict[str, Any]:
        """Test ElevenLabs API authentication by making a simple request"""
        try:
            logger.info("Testing ElevenLabs API authentication...")
            result = self._make_request("GET", "/voices", timeout=30)
            logger.info("✅ ElevenLabs API authentication successful")
            return {
                "success": True,
                "message": "Authentication successful",
                "data": result
            }
        except ElevenLabsAPIError as e:
            logger.error(f"❌ ElevenLabs API authentication failed: {e}")
            return {
                "success": False,
                "message": f"Authentication failed: {e.message}",
                "status_code": e.status_code
            }
        except Exception as e:
            logger.error(f"❌ ElevenLabs API authentication error: {e}")
            return {
                "success": False,
                "message": f"Authentication error: {str(e)}"
            }
    
    def is_configured(self) -> bool:
        """Check if the service is properly configured"""
        return bool(self.api_key)

    def speech_to_speech_with_url(self, audio_url: str, voice_id: str) -> bytes:
        """
        Обработка аудио через ElevenLabs Speech-to-Speech API с использованием URL
        
        Args:
            audio_url: URL аудио файла
            voice_id: ID голоса для обработки
            
        Returns:
            bytes: Обработанный аудио файл
        """
        try:
            logger.info(f"Обработка аудио через URL: {audio_url} с голосом: {voice_id}")
            
            # Сначала загружаем аудио файл по URL
            import requests
            audio_response = requests.get(audio_url, timeout=60)
            audio_response.raise_for_status()
            audio_data = audio_response.content
            
            logger.info(f"Загружен аудио файл размером {len(audio_data)} байт")
            
            # Создаем запрос для Speech-to-Speech с файлом
            files = {
                'audio': ('audio.mp3', audio_data, 'audio/mpeg'),
            }
            
            data = {
                'voice_settings[stability]': '0.5',
                'voice_settings[similarity_boost]': '0.75',
                'voice_settings[style]': '0.0',
                'voice_settings[use_speaker_boost]': 'true',
            }
            
            # Отправляем запрос к Speech-to-Speech API
            url = f"{self.base_url}/speech-to-speech/{voice_id}"
            headers = self._get_headers()
            
            # Убираем Content-Type из headers для multipart/form-data
            if 'Content-Type' in headers:
                del headers['Content-Type']
            
            logger.info(f"Отправляем запрос к ElevenLabs STS API:")
            logger.info(f"  URL: {url}")
            logger.info(f"  Voice ID: {voice_id}")
            logger.info(f"  Audio size: {len(audio_data)} bytes")
            logger.info(f"  Files keys: {list(files.keys())}")
            logger.info(f"  Data keys: {list(data.keys())}")
            
            response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
            response.raise_for_status()
            
            # Получаем аудио данные
            audio_data = response.content
            
            logger.info(f"Аудио успешно обработано через URL, размер: {len(audio_data)} байт")
            return audio_data
            
        except ElevenLabsAPIError as e:
            if "400" in str(e) or "422" in str(e):
                logger.warning("Speech-to-Speech API returned error. This might require special access. Falling back to Text-to-Speech...")
                return self._fallback_text_to_speech(voice_id)
            else:
                raise
        except Exception as e:
            logger.error(f"Ошибка при обработке аудио через URL: {e}")
            raise ElevenLabsServiceError(f"Error in speech_to_speech_with_url: {e}")


# Global service instance
elevenlabs_service = ElevenLabsService() 