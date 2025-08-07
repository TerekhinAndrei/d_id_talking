from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskType(str, Enum):
    """Task type enumeration"""
    PROCESSING = "processing"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    VALIDATION = "validation"
    EXPORT = "export"


# Base Models
class TaskBase(BaseModel):
    """Base task model with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    task_type: TaskType = Field(..., description="Type of task")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional task metadata")


class TaskCreate(TaskBase):
    """Model for creating a new task"""
    user_id: Optional[str] = Field(None, description="User ID who created the task")
    input_data: Optional[Dict[str, Any]] = Field(default=None, description="Input data for the task")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Estimated duration in seconds")


class TaskUpdate(BaseModel):
    """Model for updating an existing task"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    priority: Optional[TaskPriority] = Field(None, description="Task priority")
    status: Optional[TaskStatus] = Field(None, description="Task status")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional task metadata")


class Task(TaskBase):
    """Complete task model for API responses"""
    id: str = Field(..., description="Unique task identifier")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Current task status")
    user_id: Optional[str] = Field(None, description="User ID who created the task")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Task last update timestamp")
    started_at: Optional[datetime] = Field(None, description="Task start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="Task progress percentage")
    input_data: Optional[Dict[str, Any]] = Field(default=None, description="Input data for the task")
    output_data: Optional[Dict[str, Any]] = Field(default=None, description="Output data from the task")
    error_message: Optional[str] = Field(None, description="Error message if task failed")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Estimated duration in seconds")
    actual_duration: Optional[int] = Field(None, ge=0, description="Actual duration in seconds")

    model_config = ConfigDict(from_attributes=True)


# Response Models
class TaskResponse(BaseModel):
    """Standard task response model"""
    success: bool = Field(..., description="Operation success status")
    data: Optional[Task] = Field(None, description="Task data")
    message: str = Field(..., description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class TaskListResponse(BaseModel):
    """Response model for task list operations"""
    success: bool = Field(..., description="Operation success status")
    data: List[Task] = Field(..., description="List of tasks")
    total: int = Field(..., ge=0, description="Total number of tasks")
    page: int = Field(..., ge=1, description="Current page number")
    per_page: int = Field(..., ge=1, le=100, description="Number of items per page")
    message: str = Field(..., description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class TaskProgressResponse(BaseModel):
    """Response model for task progress updates"""
    task_id: str = Field(..., description="Task identifier")
    status: TaskStatus = Field(..., description="Current task status")
    progress: float = Field(..., ge=0.0, le=100.0, description="Task progress percentage")
    message: Optional[str] = Field(None, description="Progress message")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Progress timestamp")


class TaskStatsResponse(BaseModel):
    """Response model for task statistics"""
    total_tasks: int = Field(..., ge=0, description="Total number of tasks")
    completed_tasks: int = Field(..., ge=0, description="Number of completed tasks")
    failed_tasks: int = Field(..., ge=0, description="Number of failed tasks")
    pending_tasks: int = Field(..., ge=0, description="Number of pending tasks")
    in_progress_tasks: int = Field(..., ge=0, description="Number of tasks in progress")
    average_duration: Optional[float] = Field(None, ge=0, description="Average task duration in seconds")
    success_rate: float = Field(..., ge=0.0, le=100.0, description="Task success rate percentage")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Statistics timestamp")


class TaskErrorResponse(BaseModel):
    """Error response model for task operations"""
    success: bool = Field(default=False, description="Operation success status")
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


# Webhook Models
class TaskWebhookPayload(BaseModel):
    """Webhook payload for task status updates"""
    task_id: str = Field(..., description="Task identifier")
    status: TaskStatus = Field(..., description="New task status")
    progress: float = Field(..., ge=0.0, le=100.0, description="Task progress percentage")
    message: Optional[str] = Field(None, description="Status message")
    output_data: Optional[Dict[str, Any]] = Field(None, description="Task output data")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Webhook timestamp")


# Filter Models
class TaskFilter(BaseModel):
    """Model for filtering tasks"""
    status: Optional[TaskStatus] = Field(None, description="Filter by task status")
    task_type: Optional[TaskType] = Field(None, description="Filter by task type")
    priority: Optional[TaskPriority] = Field(None, description="Filter by task priority")
    user_id: Optional[str] = Field(None, description="Filter by user ID")
    created_after: Optional[datetime] = Field(None, description="Filter tasks created after this date")
    created_before: Optional[datetime] = Field(None, description="Filter tasks created before this date")


# Search Models
class TaskSearch(BaseModel):
    """Model for searching tasks"""
    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    search_fields: Optional[List[str]] = Field(
        default=["title", "description"], 
        description="Fields to search in"
    )


# Pagination Models
class PaginationParams(BaseModel):
    """Model for pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default="created_at", description="Field to sort by")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


# Export Models
class TaskExport(BaseModel):
    """Model for task export operations"""
    format: str = Field(..., pattern="^(json|csv|excel)$", description="Export format")
    include_fields: Optional[List[str]] = Field(default=None, description="Fields to include in export")
    filters: Optional[TaskFilter] = Field(None, description="Filters to apply before export")


class TaskExportResponse(BaseModel):
    """Response model for task export operations"""
    success: bool = Field(..., description="Export success status")
    download_url: Optional[str] = Field(None, description="Download URL for exported file")
    file_size: Optional[int] = Field(None, ge=0, description="Exported file size in bytes")
    expires_at: Optional[datetime] = Field(None, description="Download link expiration time")
    message: str = Field(..., description="Export message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Export timestamp") 