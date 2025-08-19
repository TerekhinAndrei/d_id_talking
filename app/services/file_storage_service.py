"""
Enhanced File Storage Service with automatic cleanup and avatar management
"""

import os
import logging
import asyncio
import shutil
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
import uuid
from pathlib import Path

from app.core.interfaces import (
    IStorageService, FileMetadata, ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient


class FileStorageServiceError(ServiceError):
    """File storage service specific errors"""
    pass


class FileStorageConfigurationError(ConfigurationError):
    """File storage configuration errors"""
    pass


class FileStorageAPIError(APIError):
    """File storage API errors"""
    pass


class FileStorageService(IStorageService, BaseService):
    """
    Enhanced file storage service with:
    - Automatic cleanup of audio files after 10 seconds
    - Avatar management (single image that gets replaced)
    - Public URL generation for hosted environment
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Storage configuration
        self.upload_dir = self.config.get_setting("UPLOAD_DIR", "uploads")
        self.avatar_dir = self.config.get_setting("AVATAR_DIR", "uploads/avatar")
        self.audio_dir = self.config.get_setting("AUDIO_DIR", "uploads/audio")
        self.max_file_size = self.config.get_setting("MAX_FILE_SIZE", 10 * 1024 * 1024)  # 10MB
        self.audio_cleanup_delay = self.config.get_setting("AUDIO_CLEANUP_DELAY", 10)  # seconds
        
        # Allowed file types
        self.allowed_image_types = self.config.get_setting("ALLOWED_IMAGE_TYPES", [])
        if isinstance(self.allowed_image_types, str):
            self.allowed_image_types = [t.strip() for t in self.allowed_image_types.split(",")]
        
        self.allowed_audio_types = self.config.get_setting("ALLOWED_AUDIO_TYPES", [])
        if isinstance(self.allowed_audio_types, str):
            self.allowed_audio_types = [t.strip() for t in self.allowed_audio_types.split(",")]
        
        # Base URL for public access
        self.base_url = self.config.get_setting("BASE_URL", "http://localhost:8000")
        self.is_production = self.config.get_setting("ENVIRONMENT", "development") == "production"
        
        # Ensure directories exist
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.avatar_dir, exist_ok=True)
        os.makedirs(self.audio_dir, exist_ok=True)
        
        # Initialize default avatar
        self._initialize_default_avatar()
        
        # Track audio files for cleanup
        self._audio_cleanup_tasks: Dict[str, asyncio.Task] = {}
        
        self.logger.info(f"FileStorageService initialized with upload dir: {self.upload_dir}")
    
    @property
    def service_name(self) -> str:
        return "file_storage"
    
    def _initialize_default_avatar(self):
        """Initialize default avatar from frontend if not exists"""
        default_avatar_path = os.path.join(self.avatar_dir, "default_avatar.jpg")
        
        if not os.path.exists(default_avatar_path):
            # Try to copy from frontend
            frontend_avatar_path = "frontend/public/default_avatar.jpg"
            if os.path.exists(frontend_avatar_path):
                shutil.copy2(frontend_avatar_path, default_avatar_path)
                self.logger.info("Default avatar copied from frontend")
            else:
                # Create a placeholder file
                with open(default_avatar_path, 'wb') as f:
                    f.write(b'placeholder')
                self.logger.warning("Default avatar not found, created placeholder")
    
    async def upload_image(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Upload image file (replaces existing avatar)"""
        try:
            # Validate file size
            if len(file_data) > self.max_file_size:
                raise FileStorageServiceError(f"File size {len(file_data)} exceeds maximum {self.max_file_size}")
            
            # Validate file type
            if not self._validate_image_type(filename, content_type):
                raise FileStorageServiceError(f"File type {content_type} not allowed for images")
            
            # Generate unique filename for avatar
            file_extension = os.path.splitext(filename)[1]
            avatar_filename = f"avatar{file_extension}"
            avatar_path = os.path.join(self.avatar_dir, avatar_filename)
            
            # Remove existing avatar files
            self._cleanup_existing_avatars()
            
            # Write new avatar file
            with open(avatar_path, 'wb') as f:
                f.write(file_data)
            
            # Create metadata
            metadata = FileMetadata(
                filename=avatar_filename,
                content_type=content_type,
                size=len(file_data),
                url=self._get_public_url(f"avatar/{avatar_filename}"),
                created_at=self._get_current_timestamp()
            )
            
            self.logger.info(f"Avatar uploaded: {avatar_filename} ({len(file_data)} bytes)")
            return metadata
            
        except FileStorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error uploading avatar: {e}")
            raise FileStorageServiceError(f"Avatar upload failed: {str(e)}")
    
    async def upload_audio(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Upload audio file with automatic cleanup"""
        try:
            # Validate file size
            if len(file_data) > self.max_file_size:
                raise FileStorageServiceError(f"File size {len(file_data)} exceeds maximum {self.max_file_size}")
            
            # Validate file type
            if not self._validate_audio_type(filename, content_type):
                raise FileStorageServiceError(f"File type {content_type} not allowed for audio")
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(filename)[1]
            audio_filename = f"{file_id}{file_extension}"
            audio_path = os.path.join(self.audio_dir, audio_filename)
            
            # Write file to disk
            with open(audio_path, 'wb') as f:
                f.write(file_data)
            
            # Create metadata
            metadata = FileMetadata(
                filename=audio_filename,
                content_type=content_type,
                size=len(file_data),
                url=self._get_public_url(f"audio/{audio_filename}"),
                created_at=self._get_current_timestamp()
            )
            
            # Schedule cleanup
            self._schedule_audio_cleanup(audio_filename, audio_path)
            
            self.logger.info(f"Audio uploaded: {audio_filename} ({len(file_data)} bytes), cleanup scheduled in {self.audio_cleanup_delay}s")
            return metadata
            
        except FileStorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error uploading audio: {e}")
            raise FileStorageServiceError(f"Audio upload failed: {str(e)}")
    
    async def upload_file(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Generic file upload - delegates to specific methods based on content type"""
        if content_type.startswith('image/'):
            return await self.upload_image(file_data, filename, content_type)
        elif content_type.startswith('audio/'):
            return await self.upload_audio(file_data, filename, content_type)
        else:
            raise FileStorageServiceError(f"Unsupported content type: {content_type}")
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file from storage"""
        try:
            # Try to find file in different directories
            possible_paths = [
                os.path.join(self.avatar_dir, file_id),
                os.path.join(self.audio_dir, file_id),
                os.path.join(self.upload_dir, file_id)
            ]
            
            file_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    file_path = path
                    break
            
            if not file_path:
                raise FileStorageServiceError(f"File not found: {file_id}")
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            self.logger.info(f"File downloaded: {file_id} ({len(file_data)} bytes)")
            return file_data
            
        except FileStorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error downloading file: {e}")
            raise FileStorageServiceError(f"File download failed: {str(e)}")
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from storage"""
        try:
            # Try to find file in different directories
            possible_paths = [
                os.path.join(self.avatar_dir, file_id),
                os.path.join(self.audio_dir, file_id),
                os.path.join(self.upload_dir, file_id)
            ]
            
            file_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    file_path = path
                    break
            
            if not file_path:
                self.logger.warning(f"File not found for deletion: {file_id}")
                return False
            
            os.remove(file_path)
            
            # Cancel cleanup task if exists
            if file_id in self._audio_cleanup_tasks:
                self._audio_cleanup_tasks[file_id].cancel()
                del self._audio_cleanup_tasks[file_id]
            
            self.logger.info(f"File deleted: {file_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Unexpected error deleting file: {e}")
            raise FileStorageServiceError(f"File deletion failed: {str(e)}")
    
    async def get_file_metadata(self, file_id: str) -> FileMetadata:
        """Get file metadata from storage"""
        try:
            # Try to find file in different directories
            possible_paths = [
                os.path.join(self.avatar_dir, file_id),
                os.path.join(self.audio_dir, file_id),
                os.path.join(self.upload_dir, file_id)
            ]
            
            file_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    file_path = path
                    break
            
            if not file_path:
                raise FileStorageServiceError(f"File not found: {file_id}")
            
            stat = os.stat(file_path)
            
            # Determine content type from file extension
            content_type = self._get_content_type_from_filename(file_id)
            
            # Determine URL based on file location
            if file_path.startswith(self.avatar_dir):
                url = self._get_public_url(f"avatar/{file_id}")
            elif file_path.startswith(self.audio_dir):
                url = self._get_public_url(f"audio/{file_id}")
            else:
                url = self._get_public_url(file_id)
            
            metadata = FileMetadata(
                filename=file_id,
                content_type=content_type,
                size=stat.st_size,
                url=url,
                created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat()
            )
            
            return metadata
            
        except FileStorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error getting file metadata: {e}")
            raise FileStorageServiceError(f"Failed to get file metadata: {str(e)}")
    
    async def get_current_avatar(self) -> Optional[FileMetadata]:
        """Get current avatar metadata"""
        try:
            avatar_files = [f for f in os.listdir(self.avatar_dir) if f.startswith('avatar')]
            if not avatar_files:
                return None
            
            # Get the most recent avatar file
            avatar_file = avatar_files[0]  # Should be only one
            return await self.get_file_metadata(avatar_file)
            
        except Exception as e:
            self.logger.error(f"Error getting current avatar: {e}")
            return None
    
    def _validate_image_type(self, filename: str, content_type: str) -> bool:
        """Validate image file type"""
        # Check content type
        if content_type not in self.allowed_image_types:
            return False
        
        # Check file extension
        file_extension = os.path.splitext(filename)[1].lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        
        if file_extension not in allowed_extensions:
            return False
        
        return True
    
    def _validate_audio_type(self, filename: str, content_type: str) -> bool:
        """Validate audio file type"""
        # Check content type
        if content_type not in self.allowed_audio_types:
            return False
        
        # Check file extension
        file_extension = os.path.splitext(filename)[1].lower()
        allowed_extensions = ['.mp3', '.wav', '.webm', '.ogg']
        
        if file_extension not in allowed_extensions:
            return False
        
        return True
    
    def _cleanup_existing_avatars(self):
        """Remove existing avatar files"""
        try:
            for filename in os.listdir(self.avatar_dir):
                if filename.startswith('avatar'):
                    file_path = os.path.join(self.avatar_dir, filename)
                    os.remove(file_path)
                    self.logger.info(f"Removed existing avatar: {filename}")
        except Exception as e:
            self.logger.error(f"Error cleaning up existing avatars: {e}")
    
    def _schedule_audio_cleanup(self, filename: str, file_path: str):
        """Schedule audio file cleanup after delay"""
        async def cleanup_audio():
            try:
                await asyncio.sleep(self.audio_cleanup_delay)
                
                if os.path.exists(file_path):
                    os.remove(file_path)
                    self.logger.info(f"Audio file automatically cleaned up: {filename}")
                
                # Remove task from tracking
                if filename in self._audio_cleanup_tasks:
                    del self._audio_cleanup_tasks[filename]
                    
            except asyncio.CancelledError:
                self.logger.info(f"Audio cleanup cancelled for: {filename}")
            except Exception as e:
                self.logger.error(f"Error during audio cleanup: {e}")
        
        # Cancel existing task if any
        if filename in self._audio_cleanup_tasks:
            self._audio_cleanup_tasks[filename].cancel()
        
        # Create new cleanup task
        task = asyncio.create_task(cleanup_audio())
        self._audio_cleanup_tasks[filename] = task
    
    def _get_content_type_from_filename(self, filename: str) -> str:
        """Get content type from filename"""
        extension = os.path.splitext(filename)[1].lower()
        
        content_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.webm': 'audio/webm',
            '.ogg': 'audio/ogg'
        }
        
        return content_type_map.get(extension, 'application/octet-stream')
    
    def _get_public_url(self, file_path: str) -> str:
        """Generate public URL for file"""
        if self.is_production:
            # In production, use the actual domain
            return f"{self.base_url}/api/v1/files/serve/{file_path}"
        else:
            # In development, use localhost
            return f"http://localhost:8000/api/v1/files/serve/{file_path}"
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.now(timezone.utc).isoformat()
    
    async def cleanup_expired_audio_files(self):
        """Clean up any expired audio files that weren't properly cleaned up"""
        try:
            current_time = datetime.now(timezone.utc)
            
            for filename in os.listdir(self.audio_dir):
                file_path = os.path.join(self.audio_dir, filename)
                file_stat = os.stat(file_path)
                file_created = datetime.fromtimestamp(file_stat.st_ctime, tz=timezone.utc)
                
                # If file is older than cleanup delay, remove it
                if current_time - file_created > timedelta(seconds=self.audio_cleanup_delay):
                    os.remove(file_path)
                    self.logger.info(f"Cleaned up expired audio file: {filename}")
                    
        except Exception as e:
            self.logger.error(f"Error cleaning up expired audio files: {e}")
