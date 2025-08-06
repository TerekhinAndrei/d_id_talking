import pytest
from datetime import datetime, timezone
from app.models.tasks import (
    TaskCreate, TaskUpdate, Task, TaskResponse, TaskListResponse,
    TaskStatus, TaskPriority, TaskType
)


class TestTaskModels:
    """Test cases for task Pydantic models"""
    
    def test_task_create_valid(self):
        """Test creating a valid TaskCreate model"""
        task_data = {
            "title": "Test Task",
            "description": "A test task description",
            "task_type": TaskType.PROCESSING,
            "priority": TaskPriority.HIGH,
            "user_id": "user123",
            "input_data": {"key": "value"},
            "estimated_duration": 300
        }
        
        task = TaskCreate(**task_data)
        assert task.title == "Test Task"
        assert task.task_type == TaskType.PROCESSING
        assert task.priority == TaskPriority.HIGH
        assert task.user_id == "user123"
    
    def test_task_create_minimal(self):
        """Test creating a TaskCreate model with minimal required fields"""
        task_data = {
            "title": "Minimal Task",
            "task_type": TaskType.ANALYSIS
        }
        
        task = TaskCreate(**task_data)
        assert task.title == "Minimal Task"
        assert task.task_type == TaskType.ANALYSIS
        assert task.priority == TaskPriority.MEDIUM  # Default value
        assert task.description is None
    
    def test_task_create_invalid_title(self):
        """Test that empty title raises validation error"""
        task_data = {
            "title": "",  # Empty title should fail
            "task_type": TaskType.PROCESSING
        }
        
        with pytest.raises(ValueError):
            TaskCreate(**task_data)
    
    def test_task_create_title_too_long(self):
        """Test that very long title raises validation error"""
        task_data = {
            "title": "A" * 201,  # Title too long
            "task_type": TaskType.PROCESSING
        }
        
        with pytest.raises(ValueError):
            TaskCreate(**task_data)
    
    def test_task_update_partial(self):
        """Test updating a task with partial data"""
        update_data = {
            "title": "Updated Title",
            "priority": TaskPriority.URGENT
        }
        
        task_update = TaskUpdate(**update_data)
        assert task_update.title == "Updated Title"
        assert task_update.priority == TaskPriority.URGENT
        assert task_update.description is None
    
    def test_task_complete_model(self):
        """Test creating a complete Task model"""
        now = datetime.now(timezone.utc)
        task_data = {
            "id": "task123",
            "title": "Complete Task",
            "description": "A complete task",
            "task_type": TaskType.GENERATION,
            "priority": TaskPriority.MEDIUM,
            "status": TaskStatus.IN_PROGRESS,
            "user_id": "user123",
            "created_at": now,
            "updated_at": now,
            "progress": 50.0,
            "input_data": {"input": "data"},
            "output_data": {"output": "data"},
            "estimated_duration": 600,
            "actual_duration": 300
        }
        
        task = Task(**task_data)
        assert task.id == "task123"
        assert task.status == TaskStatus.IN_PROGRESS
        assert task.progress == 50.0
    
    def test_task_response_model(self):
        """Test creating a TaskResponse model"""
        task_data = {
            "id": "task123",
            "title": "Test Task",
            "task_type": TaskType.PROCESSING,
            "priority": TaskPriority.MEDIUM,
            "status": TaskStatus.COMPLETED,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "progress": 100.0
        }
        
        response = TaskResponse(
            success=True,
            data=task_data,
            message="Task completed successfully"
        )
        
        assert response.success is True
        assert response.data.id == "task123"
        assert response.message == "Task completed successfully"
    
    def test_task_list_response_model(self):
        """Test creating a TaskListResponse model"""
        tasks = [
            {
                "id": "task1",
                "title": "Task 1",
                "task_type": TaskType.PROCESSING,
                "priority": TaskPriority.MEDIUM,
                "status": TaskStatus.COMPLETED,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "progress": 100.0
            },
            {
                "id": "task2",
                "title": "Task 2",
                "task_type": TaskType.ANALYSIS,
                "priority": TaskPriority.HIGH,
                "status": TaskStatus.IN_PROGRESS,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "progress": 50.0
            }
        ]
        
        response = TaskListResponse(
            success=True,
            data=tasks,
            total=2,
            page=1,
            per_page=20,
            message="Retrieved 2 tasks"
        )
        
        assert response.success is True
        assert len(response.data) == 2
        assert response.total == 2
        assert response.page == 1
    
    def test_enum_values(self):
        """Test that enum values are correct"""
        assert TaskStatus.PENDING == "pending"
        assert TaskStatus.COMPLETED == "completed"
        assert TaskPriority.LOW == "low"
        assert TaskPriority.URGENT == "urgent"
        assert TaskType.PROCESSING == "processing"
        assert TaskType.EXPORT == "export"


if __name__ == "__main__":
    pytest.main([__file__]) 