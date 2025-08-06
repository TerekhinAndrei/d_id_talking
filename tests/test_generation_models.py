import pytest
from datetime import datetime, timezone
from app.models.generation import (
    GenerationTask, GenerationResponse, GenerationStatusResponse,
    GenerationErrorResponse, GenerationStatus
)


class TestGenerationModels:
    """Test cases for generation Pydantic models"""
    
    def test_generation_response_valid(self):
        """Test creating a valid GenerationResponse model"""
        response_data = {
            "task_id": "test-task-123",
            "status": GenerationStatus.PROCESSING
        }
        
        response = GenerationResponse(**response_data)
        assert response.task_id == "test-task-123"
        assert response.status == GenerationStatus.PROCESSING
    
    def test_generation_status_response_valid(self):
        """Test creating a valid GenerationStatusResponse model"""
        now = datetime.now(timezone.utc)
        status_data = {
            "task_id": "test-task-123",
            "status": GenerationStatus.COMPLETED,
            "progress": 100.0,
            "created_at": now,
            "updated_at": now,
            "result_url": "/results/test-task-123/animation.mp4",
            "error_message": None
        }
        
        response = GenerationStatusResponse(**status_data)
        assert response.task_id == "test-task-123"
        assert response.status == GenerationStatus.COMPLETED
        assert response.progress == 100.0
        assert response.result_url == "/results/test-task-123/animation.mp4"
    
    def test_generation_status_response_failed(self):
        """Test creating a GenerationStatusResponse model for failed task"""
        now = datetime.now(timezone.utc)
        status_data = {
            "task_id": "test-task-123",
            "status": GenerationStatus.FAILED,
            "progress": 50.0,
            "created_at": now,
            "updated_at": now,
            "result_url": None,
            "error_message": "Processing failed due to invalid file format"
        }
        
        response = GenerationStatusResponse(**status_data)
        assert response.task_id == "test-task-123"
        assert response.status == GenerationStatus.FAILED
        assert response.progress == 50.0
        assert response.error_message == "Processing failed due to invalid file format"
    
    def test_generation_error_response(self):
        """Test creating a GenerationErrorResponse model"""
        error_data = {
            "error": "File upload failed",
            "detail": "The uploaded file is too large",
            "task_id": "test-task-123"
        }
        
        response = GenerationErrorResponse(**error_data)
        assert response.error == "File upload failed"
        assert response.detail == "The uploaded file is too large"
        assert response.task_id == "test-task-123"
    
    def test_generation_task_complete(self):
        """Test creating a complete GenerationTask model"""
        now = datetime.now(timezone.utc)
        task_data = {
            "task_id": "test-task-123",
            "status": GenerationStatus.PROCESSING,
            "created_at": now,
            "updated_at": now,
            "image_filename": "image.jpg",
            "audio_filename": "audio.mp3",
            "progress": 75.0,
            "result_url": None,
            "error_message": None,
            "metadata": {
                "original_image_name": "photo.jpg",
                "original_audio_name": "voice.mp3",
                "image_size": 1024000,
                "audio_size": 2048000
            }
        }
        
        task = GenerationTask(**task_data)
        assert task.task_id == "test-task-123"
        assert task.status == GenerationStatus.PROCESSING
        assert task.progress == 75.0
        assert task.image_filename == "image.jpg"
        assert task.audio_filename == "audio.mp3"
        assert task.metadata["image_size"] == 1024000
    
    def test_enum_values(self):
        """Test that enum values are correct"""
        assert GenerationStatus.PROCESSING == "processing"
        assert GenerationStatus.COMPLETED == "completed"
        assert GenerationStatus.FAILED == "failed"
        assert GenerationStatus.CANCELLED == "cancelled"
    
    def test_progress_validation(self):
        """Test that progress validation works correctly"""
        # Valid progress values
        valid_progress_values = [0.0, 25.0, 50.0, 75.0, 100.0]
        for progress in valid_progress_values:
            task_data = {
                "task_id": "test-task-123",
                "status": GenerationStatus.PROCESSING,
                "progress": progress
            }
            task = GenerationTask(**task_data)
            assert task.progress == progress
        
        # Invalid progress values should raise validation error
        invalid_progress_values = [-1.0, 101.0, 150.0]
        for progress in invalid_progress_values:
            with pytest.raises(ValueError):
                task_data = {
                    "task_id": "test-task-123",
                    "status": GenerationStatus.PROCESSING,
                    "progress": progress
                }
                GenerationTask(**task_data)


if __name__ == "__main__":
    pytest.main([__file__]) 