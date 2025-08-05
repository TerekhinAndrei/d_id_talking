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