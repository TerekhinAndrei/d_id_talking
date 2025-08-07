"""
Core interfaces for the application following SOLID principles
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, AsyncGenerator, Union
from dataclasses import dataclass, field
from enum import Enum


class ServiceError(Exception):
    """Base exception for all services"""
    pass


class ConfigurationError(ServiceError):
    """Raised when service is not properly configured"""
    pass


class APIError(ServiceError):
    """Raised when external API returns an error"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"API error {status_code}: {message}")


# ============================================================================
# Audio Processing Interfaces
# ============================================================================

class AudioFormat(str, Enum):
    """Supported audio formats"""
    MP3 = "mp3"
    WAV = "wav"
    WEBM = "webm"
    OGG = "ogg"


@dataclass
class AudioData:
    """Audio data container"""
    data: bytes
    format: AudioFormat
    sample_rate: int = 44100
    bitrate: str = "128k"


class IAudioProcessor(ABC):
    """Interface for audio processing operations"""
    
    @abstractmethod
    async def convert_format(self, audio_data: AudioData, target_format: AudioFormat) -> AudioData:
        """Convert audio to different format"""
        pass
    
    @abstractmethod
    async def validate_audio(self, audio_data: AudioData) -> bool:
        """Validate audio data"""
        pass
    
    @abstractmethod
    async def get_audio_info(self, audio_data: AudioData) -> Dict[str, Any]:
        """Get audio file information"""
        pass


# ============================================================================
# Text-to-Speech Interfaces
# ============================================================================

@dataclass
class VoiceSettings:
    """Voice configuration settings"""
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True


@dataclass
class Voice:
    """Voice model"""
    voice_id: str
    name: str
    category: str
    description: str = field(default="")
    labels: Dict[str, str] = field(default=None)
    
    def __post_init__(self):
        if self.labels is None:
            self.labels = {}


class ITTSService(ABC):
    """Interface for Text-to-Speech services"""
    
    @abstractmethod
    async def text_to_speech(self, text: str, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert text to speech"""
        pass
    
    @abstractmethod
    async def speech_to_speech(self, audio_data: AudioData, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert speech to speech with different voice"""
        pass
    
    @abstractmethod
    async def get_available_voices(self) -> List[Voice]:
        """Get list of available voices"""
        pass
    
    @abstractmethod
    async def validate_voice_id(self, voice_id: str) -> bool:
        """Validate voice ID"""
        pass
    
    @abstractmethod
    async def test_authentication(self) -> Dict[str, Any]:
        """Test service authentication"""
        pass


# ============================================================================
# Video Generation Interfaces
# ============================================================================

class VideoStatus(str, Enum):
    """Video generation status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class VideoRequest:
    """Video generation request"""
    image_url: str
    audio_data: AudioData
    driver_url: Optional[str] = None
    webhook: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


@dataclass
class VideoResponse:
    """Video generation response"""
    video_id: str
    status: VideoStatus
    created_at: str
    updated_at: str
    result_url: Optional[str] = field(default=None)
    error_message: Optional[str] = field(default=None)


class IVideoGenerator(ABC):
    """Interface for video generation services"""
    
    @abstractmethod
    async def create_video(self, request: VideoRequest) -> str:
        """Create video generation task"""
        pass
    
    @abstractmethod
    async def get_video_status(self, video_id: str) -> VideoResponse:
        """Get video generation status"""
        pass
    
    @abstractmethod
    async def cancel_video(self, video_id: str) -> bool:
        """Cancel video generation"""
        pass
    
    @abstractmethod
    async def test_authentication(self) -> Dict[str, Any]:
        """Test service authentication"""
        pass


# ============================================================================
# Storage Interfaces
# ============================================================================

@dataclass
class FileMetadata:
    """File metadata"""
    filename: str
    content_type: str
    size: int
    created_at: str = field(default="")
    url: Optional[str] = field(default=None)


class IStorageService(ABC):
    """Interface for file storage services"""
    
    @abstractmethod
    async def upload_file(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Upload file to storage"""
        pass
    
    @abstractmethod
    async def download_file(self, file_id: str) -> bytes:
        """Download file from storage"""
        pass
    
    @abstractmethod
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from storage"""
        pass
    
    @abstractmethod
    async def get_file_metadata(self, file_id: str) -> FileMetadata:
        """Get file metadata"""
        pass


# ============================================================================
# Task Management Interfaces
# ============================================================================

@dataclass
class Task:
    """Task model"""
    task_id: str
    status: VideoStatus
    request: VideoRequest
    created_at: str
    updated_at: str
    response: Optional[VideoResponse] = field(default=None)
    error_message: Optional[str] = field(default=None)


class ITaskManager(ABC):
    """Interface for task management"""
    
    @abstractmethod
    async def create_task(self, request: VideoRequest) -> str:
        """Create new task"""
        pass
    
    @abstractmethod
    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        pass
    
    @abstractmethod
    async def update_task_status(self, task_id: str, status: VideoStatus, response: Optional[VideoResponse] = None, error_message: Optional[str] = None) -> bool:
        """Update task status"""
        pass
    
    @abstractmethod
    async def list_tasks(self, limit: int = 100, offset: int = 0) -> List[Task]:
        """List tasks"""
        pass


# ============================================================================
# WebSocket Interfaces
# ============================================================================

@dataclass
class WebSocketMessage:
    """WebSocket message model"""
    type: str
    data: Dict[str, Any]
    timestamp: str


class IWebSocketHandler(ABC):
    """Interface for WebSocket message handling"""
    
    @abstractmethod
    async def handle_message(self, message: WebSocketMessage) -> WebSocketMessage:
        """Handle incoming WebSocket message"""
        pass
    
    @abstractmethod
    async def send_message(self, message: WebSocketMessage) -> None:
        """Send WebSocket message"""
        pass


# ============================================================================
# Configuration Interfaces
# ============================================================================

class IConfigurationProvider(ABC):
    """Interface for configuration management"""
    
    @abstractmethod
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get configuration setting"""
        pass
    
    @abstractmethod
    def is_configured(self, service_name: str) -> bool:
        """Check if service is configured"""
        pass
    
    @abstractmethod
    def get_service_headers(self, service_name: str) -> Dict[str, str]:
        """Get service headers"""
        pass


# ============================================================================
# HTTP Client Interfaces
# ============================================================================

class IHTTPClient(ABC):
    """Interface for HTTP client operations"""
    
    @abstractmethod
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
        pass
