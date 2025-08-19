"""
Base classes and utilities for the application
"""

import logging
import asyncio
from typing import Dict, Any, Optional, List
from abc import ABC
import aiohttp
import json
from datetime import datetime, timezone

from app.core.interfaces import (
    ServiceError, ConfigurationError, APIError, IHTTPClient, IConfigurationProvider,
    ITaskManager, VideoRequest, VideoResponse, VideoStatus, Task, IAudioProcessor,
    AudioData, AudioFormat, IWebSocketHandler, WebSocketMessage
)


class BaseService(ABC):
    """Base class for all services"""
    
    def __init__(self, config_provider: IConfigurationProvider):
        self.config = config_provider
        self.logger = logging.getLogger(self.__class__.__name__)
        self._validate_configuration()
    
    def _validate_configuration(self) -> None:
        """Validate service configuration"""
        if not self.config.is_configured(self.service_name):
            raise ConfigurationError(f"{self.service_name} is not properly configured")
    
    @property
    def service_name(self) -> str:
        """Service name for configuration"""
        return self.__class__.__name__.lower().replace('service', '')
    
    def _get_headers(self) -> Dict[str, str]:
        """Get service headers"""
        return self.config.get_service_headers(self.service_name)


class AsyncHTTPClient(IHTTPClient):
    """Async HTTP client implementation"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def make_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """Make HTTP request"""
        session = await self._get_session()
        
        try:
            timeout_obj = aiohttp.ClientTimeout(total=timeout)
            
            if files:
                # Handle file uploads
                form_data = aiohttp.FormData()
                
                # Add file fields first
                for key, file_data in files.items():
                    if isinstance(file_data, tuple) and len(file_data) == 3:
                        # Format: (filename, data, content_type)
                        filename, file_content, content_type = file_data
                        form_data.add_field(
                            key,
                            file_content,
                            filename=filename,
                            content_type=content_type
                        )
                    elif isinstance(file_data, (bytes, bytearray)):
                        form_data.add_field(
                            key,
                            file_data,
                            filename=f"{key}.file",
                            content_type="application/octet-stream"
                        )
                    else:
                        form_data.add_field(key, file_data)
                
                # Add regular data fields
                if data:
                    for key, value in data.items():
                        if isinstance(value, (dict, list)):
                            form_data.add_field(key, json.dumps(value))
                        else:
                            form_data.add_field(key, str(value))
                
                self.logger.info(f"🔄 Making multipart request to {url}")
                self.logger.info(f"🔄 Headers: {headers}")
                self.logger.info(f"🔄 Form data fields: {[getattr(field, 'name', str(field)) for field in form_data._fields]}")
                
                async with session.request(
                    method, url, data=form_data, headers=headers, timeout=timeout_obj
                ) as response:
                    return await self._handle_response(response)
            else:
                # Handle JSON requests
                if data:
                    self.logger.info(f"🔄 Making JSON request to {url}")
                    self.logger.info(f"🔄 Headers: {headers}")
                    self.logger.info(f"🔄 Data: {json.dumps(data)[:1000]}...")
                
                async with session.request(
                    method, url, json=data, headers=headers, timeout=timeout_obj
                ) as response:
                    return await self._handle_response(response)
                    
        except aiohttp.ClientError as e:
            self.logger.error(f"HTTP client error: {e}")
            raise APIError(0, f"HTTP client error: {str(e)}")
        except Exception as e:
            self.logger.error(f"Unexpected error in HTTP request: {e}")
            raise APIError(0, f"Unexpected error: {str(e)}")
    
    async def _handle_response(self, response: aiohttp.ClientResponse) -> Dict[str, Any]:
        """Handle HTTP response"""
        try:
            # Check content type to determine if it's binary data
            content_type = response.headers.get('content-type', '')
            
            if response.status >= 400:
                response_text = await response.text()
                error_message = f"HTTP {response.status}: {response_text}"
                self.logger.error(error_message)
                raise APIError(response.status, error_message)
            
            # If it's audio data, return binary content
            if 'audio' in content_type or 'application/octet-stream' in content_type:
                self.logger.info(f"Received binary audio data, content-type: {content_type}")
                audio_data = await response.read()
                self.logger.info(f"Audio data size: {len(audio_data)} bytes")
                return audio_data
            
            # For JSON responses, try to parse as JSON
            response_text = await response.text()
            
            if response_text:
                try:
                    return json.loads(response_text)
                except json.JSONDecodeError:
                    # If it's not valid JSON, return as text
                    return {"text": response_text}
            else:
                return {}
                
        except APIError:
            raise
        except Exception as e:
            self.logger.error(f"Error handling response: {e}")
            raise APIError(response.status, f"Error handling response: {str(e)}")
    
    async def close(self):
        """Close HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()


class ConfigurationProvider(IConfigurationProvider):
    """Configuration provider implementation"""
    
    def __init__(self, settings):
        self.settings = settings
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get configuration setting"""
        return getattr(self.settings, key, default)
    
    def is_configured(self, service_name: str) -> bool:
        """Check if service is configured"""
        if service_name == "elevenlabs":
            return self.settings.is_elevenlabs_configured()
        elif service_name == "d_id":
            return self.settings.is_d_id_configured()
        elif service_name == "d_id_file":
            return self.settings.is_d_id_configured()  # Uses same config as d_id
        elif service_name == "cloudinary":
            return self.settings.is_cloudinary_configured()
        elif service_name == "storage":
            # Storage service is always available for local storage
            return True
        elif service_name == "file_storage":
            # File storage service is always available for local storage
            return True
        return False
    
    def get_service_headers(self, service_name: str) -> Dict[str, str]:
        """Get service headers"""
        if service_name == "elevenlabs":
            return self.settings.get_elevenlabs_headers()
        elif service_name == "d_id":
            return self.settings.get_d_id_headers()
        elif service_name == "d_id_file":
            return self.settings.get_d_id_headers()  # Uses same headers as d_id
        else:
            return {}


class TaskManager(ITaskManager):
    """In-memory task manager implementation"""
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def create_task(self, request: VideoRequest) -> str:
        """Create new task"""
        import uuid
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        task = Task(
            task_id=task_id,
            status=VideoStatus.PENDING,
            request=request,
            created_at=now,
            updated_at=now
        )
        
        self.tasks[task_id] = task
        self.logger.info(f"Created task {task_id}")
        return task_id
    
    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        return self.tasks.get(task_id)
    
    async def update_task_status(
        self, 
        task_id: str, 
        status: VideoStatus, 
        response: Optional[VideoResponse] = None, 
        error_message: Optional[str] = None
    ) -> bool:
        """Update task status"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        task.status = status
        task.response = response
        task.error_message = error_message
        task.updated_at = datetime.now(timezone.utc).isoformat()
        
        self.logger.info(f"Updated task {task_id} status to {status}")
        return True
    
    async def list_tasks(self, limit: int = 100, offset: int = 0) -> List[Task]:
        """List tasks"""
        tasks = list(self.tasks.values())
        return tasks[offset:offset + limit]


class AudioProcessor(IAudioProcessor):
    """Audio processing implementation"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def convert_format(self, audio_data: AudioData, target_format: AudioFormat) -> AudioData:
        """Convert audio to different format"""
        # This would implement actual audio conversion using ffmpeg or similar
        # For now, return the original data
        self.logger.info(f"Converting audio from {audio_data.format} to {target_format}")
        return audio_data
    
    async def validate_audio(self, audio_data: AudioData) -> bool:
        """Validate audio data"""
        if not audio_data.data:
            return False
        
        # Basic validation - check if data is not empty
        return len(audio_data.data) > 0
    
    async def get_audio_info(self, audio_data: AudioData) -> Dict[str, Any]:
        """Get audio file information"""
        return {
            "size": len(audio_data.data),
            "format": audio_data.format.value,
            "sample_rate": audio_data.sample_rate,
            "bitrate": audio_data.bitrate
        }


class WebSocketMessageHandler(IWebSocketHandler):
    """WebSocket message handler implementation"""
    
    def __init__(self, websocket):
        self.websocket = websocket
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def handle_message(self, message: WebSocketMessage) -> WebSocketMessage:
        """Handle incoming WebSocket message"""
        # This would implement actual message handling logic
        self.logger.info(f"Handling message: {message.type}")
        return message
    
    async def send_message(self, message: WebSocketMessage) -> None:
        """Send WebSocket message"""
        try:
            await self.websocket.send_text(json.dumps({
                "type": message.type,
                "data": message.data,
                "timestamp": message.timestamp
            }))
        except Exception as e:
            self.logger.error(f"Error sending WebSocket message: {e}")
            raise


# Utility functions
def create_task_id() -> str:
    """Create unique task ID"""
    import uuid
    return str(uuid.uuid4())


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()


def validate_file_type(filename: str, allowed_types: List[str]) -> bool:
    """Validate file type"""
    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type in allowed_types if mime_type else False


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
