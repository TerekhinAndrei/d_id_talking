from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
import uuid
from datetime import datetime

from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    TaskProgressResponse, TaskStatsResponse, TaskErrorResponse,
    TaskFilter, TaskSearch, PaginationParams, TaskStatus, TaskPriority, TaskType
)

router = APIRouter()


# Mock database for demonstration
tasks_db = {}


@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    task_type: Optional[TaskType] = Query(None, description="Filter by task type"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    user_id: Optional[str] = Query(None, description="Filter by user ID")
):
    """
    Retrieve all tasks with pagination and filtering
    """
    # Apply filters
    filtered_tasks = list(tasks_db.values())
    
    if status:
        filtered_tasks = [t for t in filtered_tasks if t["status"] == status]
    if task_type:
        filtered_tasks = [t for t in filtered_tasks if t["task_type"] == task_type]
    if priority:
        filtered_tasks = [t for t in filtered_tasks if t["priority"] == priority]
    if user_id:
        filtered_tasks = [t for t in filtered_tasks if t.get("user_id") == user_id]
    
    # Apply pagination
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_tasks = filtered_tasks[start_idx:end_idx]
    
    return TaskListResponse(
        success=True,
        data=paginated_tasks,
        total=len(filtered_tasks),
        page=page,
        per_page=per_page,
        message=f"Retrieved {len(paginated_tasks)} tasks"
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """
    Retrieve a specific task by ID
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return TaskResponse(
        success=True,
        data=tasks_db[task_id],
        message="Task retrieved successfully"
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate):
    """
    Create a new task
    """
    task_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    task_data = {
        "id": task_id,
        "title": task.title,
        "description": task.description,
        "task_type": task.task_type,
        "priority": task.priority,
        "status": TaskStatus.PENDING,
        "user_id": task.user_id,
        "created_at": now,
        "updated_at": now,
        "progress": 0.0,
        "input_data": task.input_data,
        "estimated_duration": task.estimated_duration,
        "metadata": task.metadata
    }
    
    tasks_db[task_id] = task_data
    
    return TaskResponse(
        success=True,
        data=task_data,
        message="Task created successfully"
    )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate):
    """
    Update an existing task
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task_data = tasks_db[task_id]
    
    # Update only provided fields
    if task_update.title is not None:
        task_data["title"] = task_update.title
    if task_update.description is not None:
        task_data["description"] = task_update.description
    if task_update.priority is not None:
        task_data["priority"] = task_update.priority
    if task_update.status is not None:
        task_data["status"] = task_update.status
    if task_update.metadata is not None:
        task_data["metadata"] = task_update.metadata
    
    task_data["updated_at"] = datetime.utcnow()
    
    return TaskResponse(
        success=True,
        data=task_data,
        message="Task updated successfully"
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str):
    """
    Delete a task
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    del tasks_db[task_id]
    return None


@router.get("/{task_id}/progress", response_model=TaskProgressResponse)
async def get_task_progress(task_id: str):
    """
    Get task progress
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task = tasks_db[task_id]
    
    return TaskProgressResponse(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=f"Task {task['title']} is {task['status']}",
        estimated_completion=None  # Calculate based on progress and estimated duration
    )


@router.post("/{task_id}/start", response_model=TaskResponse)
async def start_task(task_id: str):
    """
    Start a task
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task = tasks_db[task_id]
    
    if task["status"] != TaskStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task can only be started if it's pending"
        )
    
    now = datetime.utcnow()
    task["status"] = TaskStatus.IN_PROGRESS
    task["started_at"] = now
    task["updated_at"] = now
    task["progress"] = 0.0
    
    return TaskResponse(
        success=True,
        data=task,
        message="Task started successfully"
    )


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: str, output_data: Optional[dict] = None):
    """
    Complete a task
    """
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task = tasks_db[task_id]
    
    if task["status"] not in [TaskStatus.IN_PROGRESS, TaskStatus.PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task can only be completed if it's in progress or pending"
        )
    
    now = datetime.utcnow()
    task["status"] = TaskStatus.COMPLETED
    task["completed_at"] = now
    task["updated_at"] = now
    task["progress"] = 100.0
    task["output_data"] = output_data
    
    # Calculate actual duration
    if task.get("started_at"):
        task["actual_duration"] = int((now - task["started_at"]).total_seconds())
    
    return TaskResponse(
        success=True,
        data=task,
        message="Task completed successfully"
    )


@router.get("/stats/overview", response_model=TaskStatsResponse)
async def get_task_stats():
    """
    Get task statistics
    """
    total_tasks = len(tasks_db)
    completed_tasks = len([t for t in tasks_db.values() if t["status"] == TaskStatus.COMPLETED])
    failed_tasks = len([t for t in tasks_db.values() if t["status"] == TaskStatus.FAILED])
    pending_tasks = len([t for t in tasks_db.values() if t["status"] == TaskStatus.PENDING])
    in_progress_tasks = len([t for t in tasks_db.values() if t["status"] == TaskStatus.IN_PROGRESS])
    
    # Calculate success rate
    total_processed = completed_tasks + failed_tasks
    success_rate = (completed_tasks / total_processed * 100) if total_processed > 0 else 0.0
    
    # Calculate average duration
    completed_with_duration = [t for t in tasks_db.values() 
                             if t["status"] == TaskStatus.COMPLETED and t.get("actual_duration")]
    average_duration = None
    if completed_with_duration:
        average_duration = sum(t["actual_duration"] for t in completed_with_duration) / len(completed_with_duration)
    
    return TaskStatsResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        failed_tasks=failed_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        average_duration=average_duration,
        success_rate=success_rate
    ) 