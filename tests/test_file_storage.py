"""
Tests for FileStorageService
"""

import pytest
import asyncio
import os
import tempfile
import shutil
from unittest.mock import Mock, AsyncMock
from pathlib import Path

from app.services.file_storage_service import FileStorageService
from app.core.interfaces import FileMetadata


class TestFileStorageService:
    """Test cases for FileStorageService"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for tests"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def mock_config(self, temp_dir):
        """Mock configuration provider"""
        config = Mock()
        config.get_setting.side_effect = lambda key, default=None: {
            "UPLOAD_DIR": temp_dir,
            "AVATAR_DIR": os.path.join(temp_dir, "avatar"),
            "AUDIO_DIR": os.path.join(temp_dir, "audio"),
            "MAX_FILE_SIZE": 10 * 1024 * 1024,
            "AUDIO_CLEANUP_DELAY": 10,
            "ALLOWED_IMAGE_TYPES": "image/jpeg,image/png,image/webp",
            "ALLOWED_AUDIO_TYPES": "audio/mpeg,audio/wav,audio/webm,audio/ogg",
            "BASE_URL": "http://localhost:8000",
            "ENVIRONMENT": "development"
        }.get(key, default)
        return config
    
    @pytest.fixture
    def mock_http_client(self):
        """Mock HTTP client"""
        return AsyncMock()
    
    @pytest.fixture
    def storage_service(self, mock_config, mock_http_client):
        """Create FileStorageService instance"""
        return FileStorageService(mock_config, mock_http_client)
    
    @pytest.mark.asyncio
    async def test_upload_image(self, storage_service, temp_dir):
        """Test image upload"""
        # Create test image data
        image_data = b"fake_image_data"
        filename = "test.jpg"
        content_type = "image/jpeg"
        
        # Upload image
        metadata = await storage_service.upload_image(image_data, filename, content_type)
        
        # Check metadata
        assert isinstance(metadata, FileMetadata)
        assert metadata.filename.startswith("avatar")
        assert metadata.filename.endswith(".jpg")
        assert metadata.content_type == content_type
        assert metadata.size == len(image_data)
        assert metadata.url is not None
        
        # Check file exists
        avatar_dir = os.path.join(temp_dir, "avatar")
        avatar_files = os.listdir(avatar_dir)
        assert len(avatar_files) == 1
        assert avatar_files[0].startswith("avatar")
    
    @pytest.mark.asyncio
    async def test_upload_audio(self, storage_service, temp_dir):
        """Test audio upload"""
        # Create test audio data
        audio_data = b"fake_audio_data"
        filename = "test.mp3"
        content_type = "audio/mpeg"
        
        # Upload audio
        metadata = await storage_service.upload_audio(audio_data, filename, content_type)
        
        # Check metadata
        assert isinstance(metadata, FileMetadata)
        assert metadata.filename.endswith(".mp3")
        assert metadata.content_type == content_type
        assert metadata.size == len(audio_data)
        assert metadata.url is not None
        
        # Check file exists
        audio_dir = os.path.join(temp_dir, "audio")
        audio_files = os.listdir(audio_dir)
        assert len(audio_files) == 1
        assert audio_files[0].endswith(".mp3")
    
    @pytest.mark.asyncio
    async def test_upload_image_replaces_existing(self, storage_service, temp_dir):
        """Test that uploading new image replaces existing avatar"""
        # Upload first image
        image_data1 = b"first_image"
        metadata1 = await storage_service.upload_image(image_data1, "first.jpg", "image/jpeg")
        
        # Upload second image
        image_data2 = b"second_image"
        metadata2 = await storage_service.upload_image(image_data2, "second.jpg", "image/jpeg")
        
        # Check that only one avatar file exists
        avatar_dir = os.path.join(temp_dir, "avatar")
        avatar_files = os.listdir(avatar_dir)
        assert len(avatar_files) == 1
        
        # Check that the file contains second image data
        avatar_path = os.path.join(avatar_dir, avatar_files[0])
        with open(avatar_path, 'rb') as f:
            file_content = f.read()
        assert file_content == image_data2
    
    @pytest.mark.asyncio
    async def test_audio_cleanup_scheduling(self, storage_service, temp_dir):
        """Test that audio cleanup is scheduled"""
        # Upload audio file
        audio_data = b"fake_audio_data"
        metadata = await storage_service.upload_audio(audio_data, "test.mp3", "audio/mpeg")
        
        # Check that cleanup task is scheduled
        assert metadata.filename in storage_service._audio_cleanup_tasks
        
        # Cancel the task to avoid actual cleanup during test
        storage_service._audio_cleanup_tasks[metadata.filename].cancel()
    
    @pytest.mark.asyncio
    async def test_get_current_avatar(self, storage_service, temp_dir):
        """Test getting current avatar"""
        # Upload image first
        image_data = b"fake_image_data"
        metadata = await storage_service.upload_image(image_data, "test.jpg", "image/jpeg")
        
        # Get current avatar
        current_avatar = await storage_service.get_current_avatar()
        
        # Check that avatar is returned
        assert current_avatar is not None
        assert current_avatar.filename == metadata.filename
    
    @pytest.mark.asyncio
    async def test_get_current_avatar_none(self, storage_service):
        """Test getting current avatar when none exists"""
        # Get current avatar without uploading
        current_avatar = await storage_service.get_current_avatar()
        
        # Check that None is returned
        assert current_avatar is None
    
    @pytest.mark.asyncio
    async def test_download_file(self, storage_service, temp_dir):
        """Test file download"""
        # Upload file first
        file_data = b"test_file_content"
        metadata = await storage_service.upload_audio(file_data, "test.mp3", "audio/mpeg")
        
        # Download file
        downloaded_data = await storage_service.download_file(metadata.filename)
        
        # Check that data matches
        assert downloaded_data == file_data
    
    @pytest.mark.asyncio
    async def test_delete_file(self, storage_service, temp_dir):
        """Test file deletion"""
        # Upload file first
        file_data = b"test_file_content"
        metadata = await storage_service.upload_audio(file_data, "test.mp3", "audio/mpeg")
        
        # Check file exists
        audio_dir = os.path.join(temp_dir, "audio")
        assert metadata.filename in os.listdir(audio_dir)
        
        # Delete file
        success = await storage_service.delete_file(metadata.filename)
        
        # Check deletion was successful
        assert success is True
        
        # Check file no longer exists
        assert metadata.filename not in os.listdir(audio_dir)
    
    @pytest.mark.asyncio
    async def test_validate_file_types(self, storage_service):
        """Test file type validation"""
        # Test valid image types
        assert storage_service._validate_image_type("test.jpg", "image/jpeg") is True
        assert storage_service._validate_image_type("test.png", "image/png") is True
        assert storage_service._validate_image_type("test.webp", "image/webp") is True
        
        # Test invalid image types
        assert storage_service._validate_image_type("test.gif", "image/gif") is False
        assert storage_service._validate_image_type("test.txt", "text/plain") is False
        
        # Test valid audio types
        assert storage_service._validate_audio_type("test.mp3", "audio/mpeg") is True
        assert storage_service._validate_audio_type("test.wav", "audio/wav") is True
        assert storage_service._validate_audio_type("test.webm", "audio/webm") is True
        assert storage_service._validate_audio_type("test.ogg", "audio/ogg") is True
        
        # Test invalid audio types
        assert storage_service._validate_audio_type("test.txt", "text/plain") is False
        assert storage_service._validate_audio_type("test.jpg", "image/jpeg") is False
    
    def test_get_public_url(self, storage_service):
        """Test public URL generation"""
        # Test development environment
        url = storage_service._get_public_url("avatar/test.jpg")
        assert url == "http://localhost:8000/uploads/avatar/test.jpg"
        
        # Test production environment
        storage_service.is_production = True
        storage_service.base_url = "https://example.com"
        url = storage_service._get_public_url("avatar/test.jpg")
        assert url == "https://example.com/uploads/avatar/test.jpg"
