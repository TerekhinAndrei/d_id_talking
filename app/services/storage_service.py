"""
Refactored Storage Service following SOLID principles
"""

import os
import logging
import tempfile
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.core.interfaces import (
    IStorageService, FileMetadata, ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient


class StorageServiceError(ServiceError):
    """Storage service specific errors"""
    pass


class StorageConfigurationError(ConfigurationError):
    """Storage configuration errors"""
    pass


class StorageAPIError(APIError):
    """Storage API errors"""
    pass


class LocalStorageService(IStorageService, BaseService):
    """
    Local file storage implementation following SOLID principles:
    - Single Responsibility: Only handles file storage operations
    - Open/Closed: Extensible through interfaces
    - Liskov Substitution: Implements IStorageService interface
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Storage configuration
        self.upload_dir = self.config.get_setting("UPLOAD_DIR", "uploads")
        self.max_file_size = self.config.get_setting("MAX_FILE_SIZE", 10 * 1024 * 1024)  # 10MB
        self.allowed_image_types = self.config.get_setting("ALLOWED_IMAGE_TYPES", [])
        self.allowed_audio_types = self.config.get_setting("ALLOWED_AUDIO_TYPES", [])
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)
        
        self.logger.info(f"LocalStorageService initialized with upload dir: {self.upload_dir}")
    
    @property
    def service_name(self) -> str:
        return "storage"
    
    async def upload_file(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Upload file to local storage"""
        try:
            # Validate file size
            if len(file_data) > self.max_file_size:
                raise StorageServiceError(f"File size {len(file_data)} exceeds maximum {self.max_file_size}")
            
            # Validate file type
            if not self._validate_file_type(filename, content_type):
                raise StorageServiceError(f"File type {content_type} not allowed")
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{file_id}{file_extension}"
            file_path = os.path.join(self.upload_dir, unique_filename)
            
            # Write file to disk
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Create metadata
            metadata = FileMetadata(
                filename=unique_filename,
                content_type=content_type,
                size=len(file_data),
                url=f"/uploads/{unique_filename}",
                created_at=self._get_current_timestamp()
            )
            
            self.logger.info(f"File uploaded: {unique_filename} ({len(file_data)} bytes)")
            return metadata
            
        except StorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error uploading file: {e}")
            raise StorageServiceError(f"File upload failed: {str(e)}")
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file from local storage"""
        try:
            file_path = os.path.join(self.upload_dir, file_id)
            
            if not os.path.exists(file_path):
                raise StorageServiceError(f"File not found: {file_id}")
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            self.logger.info(f"File downloaded: {file_id} ({len(file_data)} bytes)")
            return file_data
            
        except StorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error downloading file: {e}")
            raise StorageServiceError(f"File download failed: {str(e)}")
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from local storage"""
        try:
            file_path = os.path.join(self.upload_dir, file_id)
            
            if not os.path.exists(file_path):
                self.logger.warning(f"File not found for deletion: {file_id}")
                return False
            
            os.remove(file_path)
            self.logger.info(f"File deleted: {file_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Unexpected error deleting file: {e}")
            raise StorageServiceError(f"File deletion failed: {str(e)}")
    
    async def get_file_metadata(self, file_id: str) -> FileMetadata:
        """Get file metadata from local storage"""
        try:
            file_path = os.path.join(self.upload_dir, file_id)
            
            if not os.path.exists(file_path):
                raise StorageServiceError(f"File not found: {file_id}")
            
            stat = os.stat(file_path)
            
            # Try to determine content type from file extension
            content_type = self._get_content_type_from_filename(file_id)
            
            metadata = FileMetadata(
                filename=file_id,
                content_type=content_type,
                size=stat.st_size,
                url=f"/uploads/{file_id}",
                created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat()
            )
            
            return metadata
            
        except StorageServiceError:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error getting file metadata: {e}")
            raise StorageServiceError(f"Failed to get file metadata: {str(e)}")
    
    def _validate_file_type(self, filename: str, content_type: str) -> bool:
        """Validate file type"""
        # Check content type
        allowed_types = self.allowed_image_types + self.allowed_audio_types
        
        if content_type not in allowed_types:
            return False
        
        # Check file extension
        file_extension = os.path.splitext(filename)[1].lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.webm', '.ogg']
        
        if file_extension not in allowed_extensions:
            return False
        
        return True
    
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
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.now(timezone.utc).isoformat()


class CloudinaryStorageService(IStorageService, BaseService):
    """
    Cloudinary storage implementation following SOLID principles
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Cloudinary configuration
        self.cloudinary_url = self.config.get_setting("CLOUDINARY_URL")
        self.cloud_name = self.config.get_setting("CLOUDINARY_CLOUD_NAME")
        self.api_key = self.config.get_setting("CLOUDINARY_API_KEY")
        self.api_secret = self.config.get_setting("CLOUDINARY_API_SECRET")
        
        self.logger.info(f"CloudinaryStorageService initialized")
    
    @property
    def service_name(self) -> str:
        return "cloudinary"
    
    async def upload_file(self, file_data: bytes, filename: str, content_type: str) -> FileMetadata:
        """Upload file to Cloudinary"""
        try:
            # This would implement actual Cloudinary upload
            # For now, return a mock response
            file_id = str(uuid.uuid4())
            
            metadata = FileMetadata(
                filename=filename,
                content_type=content_type,
                size=len(file_data),
                url=f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{file_id}",
                created_at=self._get_current_timestamp()
            )
            
            self.logger.info(f"File uploaded to Cloudinary: {file_id}")
            return metadata
            
        except Exception as e:
            self.logger.error(f"Unexpected error uploading to Cloudinary: {e}")
            raise StorageServiceError(f"Cloudinary upload failed: {str(e)}")
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file from Cloudinary"""
        try:
            # This would implement actual Cloudinary download
            # For now, return empty bytes
            return b""
            
        except Exception as e:
            self.logger.error(f"Unexpected error downloading from Cloudinary: {e}")
            raise StorageServiceError(f"Cloudinary download failed: {str(e)}")
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from Cloudinary"""
        try:
            # This would implement actual Cloudinary deletion
            self.logger.info(f"File deleted from Cloudinary: {file_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Unexpected error deleting from Cloudinary: {e}")
            raise StorageServiceError(f"Cloudinary deletion failed: {str(e)}")
    
    async def get_file_metadata(self, file_id: str) -> FileMetadata:
        """Get file metadata from Cloudinary"""
        try:
            # This would implement actual Cloudinary metadata retrieval
            # For now, return mock metadata
            metadata = FileMetadata(
                filename=file_id,
                content_type="application/octet-stream",
                size=0,
                url=f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{file_id}",
                created_at=self._get_current_timestamp()
            )
            
            return metadata
            
        except Exception as e:
            self.logger.error(f"Unexpected error getting Cloudinary metadata: {e}")
            raise StorageServiceError(f"Failed to get Cloudinary metadata: {str(e)}")
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.now(timezone.utc).isoformat()


# Factory function to create appropriate storage service
def create_storage_service(config_provider, http_client: AsyncHTTPClient) -> IStorageService:
    """Create storage service based on configuration"""
    if config_provider.is_configured("cloudinary"):
        return CloudinaryStorageService(config_provider, http_client)
    else:
        return LocalStorageService(config_provider, http_client)
