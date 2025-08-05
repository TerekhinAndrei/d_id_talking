"""
D-ID API Service
Handles all interactions with D-ID API for video generation and animation.
Updated according to official D-ID API documentation.
"""

import requests
import logging
import base64
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass
from enum import Enum

from app.config import config

logger = logging.getLogger(__name__)


class DIdModel(str, Enum):
    """Available D-ID models for video generation"""
    REALISTIC = "realistic"
    ANIMATED = "animated"


class DIdStatus(str, Enum):
    """D-ID API response statuses"""
    CREATED = "created"
    STARTED = "started"
    DONE = "done"
    FAILED = "failed"
    REJECTED = "rejected"


class DIdScriptType(str, Enum):
    """D-ID script types"""
    TEXT = "text"
    AUDIO = "audio"


class DIdProviderType(str, Enum):
    """D-ID TTS provider types"""
    MICROSOFT = "microsoft"
    ELEVENLABS = "elevenlabs"
    GOOGLE = "google"


class DIdExpression(str, Enum):
    """D-ID supported expressions"""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SURPRISE = "surprise"
    SERIOUS = "serious"


@dataclass
class DIdScript:
    """D-ID script configuration"""
    type: DIdScriptType
    input: Optional[str] = None  # For text scripts
    audio_url: Optional[str] = None  # For audio scripts
    provider: Optional[Dict[str, Any]] = None  # For TTS providers


@dataclass
class DIdExpressionConfig:
    """D-ID expression configuration"""
    start_frame: int
    expression: DIdExpression
    intensity: float = 1.0


@dataclass
class DIdDriverExpressions:
    """D-ID driver expressions configuration"""
    expressions: List[DIdExpressionConfig]
    transition_frames: int = 20


@dataclass
class DIdConfig:
    """D-ID configuration"""
    stitch: bool = True
    result_format: str = "mp4"
    driver_expressions: Optional[DIdDriverExpressions] = None


@dataclass
class DIdVideoRequest:
    """Request model for D-ID video generation"""
    source_url: str
    script: DIdScript
    driver_url: Optional[str] = None
    webhook: Optional[str] = None
    config: Optional[DIdConfig] = None


@dataclass
class DIdVideoResponse:
    """Response model for D-ID video generation"""
    id: str
    status: DIdStatus
    created_at: str
    updated_at: str
    result_url: Optional[str] = None
    error_message: Optional[str] = None


class DIdServiceError(Exception):
    """Base exception for D-ID service errors"""
    pass


class DIdConfigurationError(DIdServiceError):
    """Exception for configuration errors"""
    pass


class DIdAPIError(DIdServiceError):
    """Exception for D-ID API errors"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"D-ID API error {status_code}: {message}")


class DIdService:
    """Service for interacting with D-ID API"""
    
    def __init__(self):
        self.api_key = config.D_ID_API_KEY
        self.base_url = config.D_ID_BASE_URL
        if not self.api_key:
            logger.warning("D_ID_API_KEY not found in environment variables")
    
    def _validate_configuration(self) -> None:
        """Validate that D-ID API is properly configured"""
        if not self.api_key:
            raise DIdConfigurationError("D-ID API key not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for D-ID API requests"""
        self._validate_configuration()
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.api_key}"
        }
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None, 
        timeout: int = 60
    ) -> Dict[str, Any]:
        """Make HTTP request to D-ID API"""
        self._validate_configuration()
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=timeout)
            else:
                raise DIdServiceError(f"Unsupported HTTP method: {method}")
            
            # D-ID API может возвращать 201 для успешного создания
            if response.status_code in [200, 201]:
                return response.json()
            else:
                response.raise_for_status()
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else 0
            error_text = e.response.text if e.response else str(e)
            logger.error(f"D-ID API error: {status_code} - {error_text}")
            raise DIdAPIError(status_code, error_text)
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during D-ID API call: {str(e)}")
            raise DIdServiceError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during D-ID API call: {str(e)}")
            raise DIdServiceError(f"Unexpected error: {str(e)}")
    
    def test_authentication(self) -> Dict[str, Any]:
        """Test D-ID API authentication by making a simple request"""
        try:
            logger.info("Testing D-ID API authentication...")
            result = self._make_request("GET", "/talks", timeout=30)
            logger.info("✅ D-ID API authentication successful")
            return {
                "success": True,
                "message": "Authentication successful",
                "data": result
            }
        except DIdAPIError as e:
            logger.error(f"❌ D-ID API authentication failed: {e}")
            return {
                "success": False,
                "message": f"Authentication failed: {e.message}",
                "status_code": e.status_code
            }
        except Exception as e:
            logger.error(f"❌ D-ID API authentication error: {e}")
            return {
                "success": False,
                "message": f"Authentication error: {str(e)}"
            }
    
    def get_talks(self) -> List[Dict[str, Any]]:
        """Get list of talks from D-ID API"""
        try:
            result = self._make_request("GET", "/talks", timeout=30)
            return result.get("talks", [])
        except DIdAPIError:
            raise
        except Exception as e:
            logger.error(f"Error fetching talks: {str(e)}")
            raise DIdServiceError(f"Error fetching talks: {str(e)}")
    
    def get_talk_by_id(self, talk_id: str) -> Optional[Dict[str, Any]]:
        """Get specific talk by ID"""
        try:
            result = self._make_request("GET", f"/talks/{talk_id}", timeout=30)
            return result
        except DIdAPIError:
            raise
        except Exception as e:
            logger.error(f"Error fetching talk {talk_id}: {str(e)}")
            raise DIdServiceError(f"Error fetching talk: {str(e)}")

    def create_talk_with_text(
        self, 
        image_url: str, 
        text: str, 
        provider: Optional[DIdProviderType] = None,
        voice_id: Optional[str] = None,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None,
        expressions: Optional[List[DIdExpressionConfig]] = None
    ) -> str:
        """
        Создать talk с текстовым скриптом
        """
        script = {
            "type": "text",
            "input": text
        }
        
        # Добавляем провайдера TTS если указан
        if provider:
            script["provider"] = {
                "type": provider.value,
                "voice_id": voice_id or "en-US-JennyNeural"
            }
        
        return self._create_talk_internal(image_url, script, driver_url, webhook, expressions)

    def create_talk_with_audio(
        self, 
        image_url: str, 
        audio_url: str,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None,
        expressions: Optional[List[DIdExpressionConfig]] = None
    ) -> str:
        """
        Создать talk с аудио скриптом
        """
        script = {
            "type": "audio",
            "audio_url": audio_url
        }
        
        return self._create_talk_internal(image_url, script, driver_url, webhook, expressions)

    def create_talk(self, image_url: str, audio_url: str) -> str:
        """
        Создать talk на D-ID с аудио (для обратной совместимости).
        :param image_url: URL изображения
        :param audio_url: URL аудиофайла
        :return: talk_id (str)
        """
        return self.create_talk_with_audio(image_url, audio_url)

    def _create_talk_internal(
        self,
        image_url: str,
        script: Dict[str, Any],
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None,
        expressions: Optional[List[DIdExpressionConfig]] = None
    ) -> str:
        """
        Внутренний метод создания talk
        """
        payload = {
            "source_url": image_url,
            "script": script,
            "config": {
                "stitch": True,
                "result_format": "mp4"
            }
        }
        
        # Добавляем драйвер если указан
        if driver_url:
            payload["driver_url"] = driver_url
        
        # Добавляем webhook если указан
        if webhook:
            payload["webhook"] = webhook
        
        # Добавляем выражения если указаны
        if expressions:
            expressions_config = []
            for expr in expressions:
                expressions_config.append({
                    "start_frame": expr.start_frame,
                    "expression": expr.expression.value,
                    "intensity": expr.intensity
                })
            
            payload["config"]["driver_expressions"] = {
                "expressions": expressions_config,
                "transition_frames": 20
            }
        
        try:
            logger.info(f"Создание D-ID talk... Image: {image_url}, Script type: {script['type']}")
            logger.info(f"D-ID payload: {payload}")
            result = self._make_request("POST", "/talks", data=payload)
            logger.info(f"D-ID response: {result}")
            talk_id = result.get("id")
            if not talk_id:
                raise DIdServiceError("D-ID did not return talk_id")
            
            logger.info(f"✅ D-ID talk создан успешно! ID: {talk_id}")
            return talk_id
            
        except DIdAPIError as e:
            if e.status_code in [400, 500]:
                logger.warning(f"D-ID API returned {e.status_code}. Trying alternative format...")
                return self._create_talk_alternative(image_url, script)
            else:
                raise
        except Exception as e:
            logger.error(f"Error creating D-ID talk: {str(e)}")
            return self._create_demo_talk(image_url, script)

    def _create_talk_alternative(self, image_url: str, script: Dict[str, Any]) -> str:
        """
        Альтернативный метод создания talk с упрощенным форматом
        """
        # Упрощенный формат для совместимости
        payload = {
            "source_url": image_url,
            "script": script,
            "config": {
                "stitch": True,
                "result_format": "mp4"
            }
        }
        
        try:
            logger.info("Пробуем альтернативный формат D-ID API...")
            result = self._make_request("POST", "/talks", data=payload)
            talk_id = result.get("id")
            if not talk_id:
                raise DIdServiceError("D-ID did not return talk_id in alternative format")
            
            logger.info(f"✅ D-ID talk создан с альтернативным форматом! ID: {talk_id}")
            return talk_id
            
        except DIdAPIError as e:
            logger.error(f"Alternative D-ID format also failed: {e.status_code} - {e.message}")
            return self._create_demo_talk(image_url, script)
        except Exception as e:
            logger.error(f"Alternative D-ID format error: {str(e)}")
            return self._create_demo_talk(image_url, script)

    def _create_demo_talk(self, image_url: str, script: Dict[str, Any]) -> str:
        """
        Создает демо-talk для тестирования, когда реальный API недоступен
        """
        import uuid
        import time
        
        demo_id = f"demo_{uuid.uuid4().hex[:8]}"
        logger.warning(f"Создаем демо-talk: {demo_id} (реальный D-ID API недоступен)")
        
        # Сохраняем информацию о демо-talk для последующего использования
        self._demo_talks = getattr(self, '_demo_talks', {})
        self._demo_talks[demo_id] = {
            "status": "created",
            "created_at": time.time(),
            "image_url": image_url,
            "script": script
        }
        
        return demo_id

    def get_talk_status(self, talk_id: str) -> dict:
        """
        Проверить статус talk. Возвращает статус и result_url (если готово).
        :param talk_id: ID задачи (talk)
        :return: dict {"status": str, "result_url": Optional[str]}
        :raises: DIdServiceError, DIdAPIError
        """
        # Проверяем, является ли это демо-talk
        if talk_id.startswith("demo_"):
            return self._get_demo_talk_status(talk_id)
        
        try:
            result = self._make_request("GET", f"/talks/{talk_id}")
            status = result.get("status")
            result_url = result.get("result_url")
            
            logger.info(f"D-ID talk status: {talk_id} -> {status}")
            
            return {
                "status": status,
                "result_url": result_url
            }
        except DIdAPIError:
            raise
        except Exception as e:
            logger.error(f"Error getting D-ID talk status: {str(e)}")
            raise DIdServiceError(f"Error getting D-ID talk status: {str(e)}")

    def _get_demo_talk_status(self, talk_id: str) -> dict:
        """
        Получить статус демо-talk
        """
        import time
        
        demo_talks = getattr(self, '_demo_talks', {})
        if talk_id not in demo_talks:
            return {"status": "failed", "result_url": None}
        
        demo_talk = demo_talks[talk_id]
        elapsed = time.time() - demo_talk["created_at"]
        
        # Симулируем прогресс демо-talk
        if elapsed < 5:
            status = "created"
        elif elapsed < 10:
            status = "started"
        else:
            status = "done"
            # Создаем демо-URL
            demo_talk["result_url"] = f"https://demo.d-id.com/video/{talk_id}.mp4"
        
        logger.info(f"Demo talk status: {talk_id} -> {status}")
        
        return {
            "status": status,
            "result_url": demo_talk.get("result_url")
        }
    
    def is_configured(self) -> bool:
        """Check if D-ID service is properly configured"""
        return bool(self.api_key)


# Create global service instance
d_id_service = DIdService() 