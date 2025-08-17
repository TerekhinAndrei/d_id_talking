from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class GenerationStatus(str, Enum):
    """Generation task status enumeration"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStatusResponse(BaseModel):
    """Response model for task status"""
    task_id: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Current task status")
    video_url: Optional[str] = Field(None, description="URL to generated video")
    error_message: Optional[str] = Field(None, description="Error message if task failed")
    progress: int = Field(0, description="Task progress percentage (0-100)")
    talk_id: Optional[str] = Field(None, description="D-ID talk ID")


class GenerationTask(BaseModel):
    """Model for generation task"""
    task_id: str = Field(..., description="Unique task identifier")
    status: GenerationStatus = Field(default=GenerationStatus.PROCESSING, description="Current task status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Task creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Task last update timestamp")
    image_filename: Optional[str] = Field(None, description="Uploaded image filename")
    audio_filename: Optional[str] = Field(None, description="Uploaded audio filename")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="Task progress percentage")
    result_url: Optional[str] = Field(None, description="URL to generated result")
    error_message: Optional[str] = Field(None, description="Error message if task failed")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional task metadata")

    model_config = ConfigDict(from_attributes=True)


class GenerationResponse(BaseModel):
    """Response model for generation task creation"""
    task_id: str = Field(..., description="Unique task identifier")
    status: GenerationStatus = Field(..., description="Current task status")


class GenerationStatusResponse(BaseModel):
    """Response model for generation task status"""
    task_id: str = Field(..., description="Unique task identifier")
    status: GenerationStatus = Field(..., description="Current task status")
    progress: float = Field(..., ge=0.0, le=100.0, description="Task progress percentage")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Task last update timestamp")
    result_url: Optional[str] = Field(None, description="URL to generated result")
    error_message: Optional[str] = Field(None, description="Error message if task failed")


class GenerationErrorResponse(BaseModel):
    """Error response model for generation operations"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    task_id: Optional[str] = Field(None, description="Task ID if available")


# D-ID Talks Models
class DIdTalkRequest(BaseModel):
    """Request model for creating D-ID talk"""
    source_url: str = Field(..., description="URL of the source image")
    script: Dict[str, Any] = Field(..., description="Script configuration")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Talk configuration")
    driver_url: Optional[str] = Field(None, description="Driver URL for animation")
    webhook: Optional[str] = Field(None, description="Webhook URL for notifications")
    presenter_id: Optional[str] = Field(None, description="Presenter ID")
    session_id: Optional[str] = Field(None, description="Session identifier")


class DIdTalkResponse(BaseModel):
    """Response model for D-ID talk creation"""
    id: str = Field(..., description="Talk ID")
    created_at: str = Field(..., description="Creation timestamp")
    created_by: str = Field(..., description="Creator ID")
    status: str = Field(..., description="Talk status")
    object: str = Field(..., description="Object type")


class DIdTalkStatusResponse(BaseModel):
    """Response model for D-ID talk status"""
    id: str = Field(..., description="Talk ID")
    status: str = Field(..., description="Talk status")
    result_url: Optional[str] = Field(None, description="Result video URL")
    audio_url: Optional[str] = Field(None, description="Audio URL")
    source_url: Optional[str] = Field(None, description="Source image URL")
    created_at: str = Field(..., description="Creation timestamp")
    modified_at: Optional[str] = Field(None, description="Last modification timestamp")
    started_at: Optional[str] = Field(None, description="Processing start timestamp")
    duration: Optional[float] = Field(None, description="Video duration in seconds")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Processing metadata")
    face: Optional[Dict[str, Any]] = Field(None, description="Face detection data")
    config: Optional[Dict[str, Any]] = Field(None, description="Talk configuration")
    error: Optional[Dict[str, Any]] = Field(None, description="Error information")


class DIdWebhookPayload(BaseModel):
    """Webhook payload from D-ID"""
    id: str = Field(..., description="Talk ID")
    status: str = Field(..., description="Talk status")
    result_url: Optional[str] = Field(None, description="Result video URL")
    audio_url: Optional[str] = Field(None, description="Audio URL")
    source_url: Optional[str] = Field(None, description="Source image URL")
    created_at: str = Field(..., description="Creation timestamp")
    modified_at: Optional[str] = Field(None, description="Last modification timestamp")
    started_at: Optional[str] = Field(None, description="Processing start timestamp")
    duration: Optional[float] = Field(None, description="Video duration in seconds")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Processing metadata")
    face: Optional[Dict[str, Any]] = Field(None, description="Face detection data")
    config: Optional[Dict[str, Any]] = Field(None, description="Talk configuration")
    created_by: Optional[str] = Field(None, description="Creator ID")
    user_id: Optional[str] = Field(None, description="User ID")
    driver_url: Optional[str] = Field(None, description="Driver URL")
    error: Optional[Dict[str, Any]] = Field(None, description="Error information") 