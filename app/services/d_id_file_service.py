"""
D-ID File Service for uploading and managing images and audio files
Following SOLID principles and existing architecture patterns
"""

import logging
import mimetypes
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.core.interfaces import (
    IDIdFileService, DIdFileUploadRequest, DIdFileUploadResponse,
    ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient


class DIdFileServiceError(ServiceError):
    """D-ID file service specific errors"""
    pass


class DIdFileConfigurationError(ConfigurationError):
    """D-ID file configuration errors"""
    pass


class DIdFileAPIError(APIError):
    """D-ID file API errors"""
    pass


class DIdFileService(IDIdFileService, BaseService):
    """
    D-ID file service implementation following SOLID principles:
    - Single Responsibility: Only handles D-ID file operations
    - Open/Closed: Extensible through interfaces
    - Liskov Substitution: Implements IDIdFileService interface
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # D-ID API configuration
        self.api_key = self.config.get_setting("D_ID_API_KEY")
        self.base_url = self.config.get_setting("D_ID_BASE_URL", "https://api.d-id.com")
        
        # Validate configuration
        if not self.api_key:
            raise DIdFileConfigurationError("D_ID_API_KEY is required")
        
        # API endpoints
        self.images_endpoint = f"{self.base_url}/images"
        self.audios_endpoint = f"{self.base_url}/audios"
        
        # Supported file types
        self.supported_image_types = ["image/jpeg", "image/png"]
        self.supported_audio_types = ["audio/", "video/"]  # D-ID accepts any audio/video format
        
        self.logger.info(f"DIdFileService initialized with base URL: {self.base_url}")
    
    @property
    def service_name(self) -> str:
        return "d_id_file"
    
    async def upload_image(self, request: DIdFileUploadRequest) -> DIdFileUploadResponse:
        """Upload image to D-ID temporary storage"""
        try:
            # Validate request
            self._validate_image_request(request)
            
            # Prepare headers
            headers = self._get_auth_headers()
            
            # Prepare files for multipart upload
            # According to D-ID documentation, the field name should be the file itself
            files = {
                'image': (
                    request.filename,
                    request.file_data,
                    request.content_type
                )
            }
            
            # Add persist parameter to prevent permanent storage
            data = {
                'persist': 'false'
            }
            
            # Make API request
            self.logger.info(f"Making request to D-ID API: {self.images_endpoint}")
            self.logger.info(f"Headers: {headers}")
            self.logger.info(f"File size: {len(request.file_data)} bytes")
            self.logger.info(f"Data params: {data}")
            
            response = await self.http_client.make_request(
                method="POST",
                url=self.images_endpoint,
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            self.logger.info(f"D-ID API response: {response}")
            
            # According to D-ID documentation, successful upload returns:
            # {
            #   "id": "string",
            #   "url": "string",
            #   "created_at": "string",
            #   "expires_at": "string"
            # }
            
            # Check if response is a string (error message)
            if isinstance(response, str):
                self.logger.error(f"D-ID API returned string response: {response}")
                raise DIdFileAPIError(
                    status_code=500,
                    message=f"D-ID API error: {response}"
                )
            
            # Validate required fields
            if not response.get("id"):
                self.logger.error(f"D-ID API response missing ID: {response}")
                raise DIdFileAPIError(
                    status_code=500,
                    message="D-ID API did not return file ID"
                )
            
            # Create response object
            upload_response = DIdFileUploadResponse(
                file_id=response.get("id"),
                url=response.get("url"),
                created_at=response.get("created_at") or self._get_current_timestamp(),
                expires_at=response.get("expires_at")
            )
            
            self.logger.info(f"Image uploaded successfully: {upload_response.file_id}")
            return upload_response
            
        except (DIdFileServiceError, DIdFileConfigurationError, DIdFileAPIError):
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error uploading image: {e}")
            raise DIdFileServiceError(f"Image upload failed: {str(e)}")
    
    async def upload_audio(self, request: DIdFileUploadRequest) -> DIdFileUploadResponse:
        """Upload audio file to D-ID temporary storage"""
        try:
            # Validate request
            self._validate_audio_request(request)
            
            # Prepare headers
            headers = self._get_auth_headers()
            
            # Prepare files for multipart upload
            # According to D-ID documentation, the field name should be the file itself
            files = {
                'audio': (
                    request.filename,
                    request.file_data,
                    request.content_type
                )
            }
            
            # Add persist parameter to prevent permanent storage
            data = {
                'persist': 'false'
            }
            
            # Make API request
            response = await self.http_client.make_request(
                method="POST",
                url=self.audios_endpoint,
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            # According to D-ID documentation, successful upload returns:
            # {
            #   "id": "string",
            #   "url": "string",
            #   "created_at": "string",
            #   "expires_at": "string"
            # }
            
            # Validate required fields
            if not response.get("id"):
                raise DIdFileAPIError(
                    status_code=500,
                    message="D-ID API did not return file ID"
                )
            
            # Create response object
            upload_response = DIdFileUploadResponse(
                file_id=response.get("id"),
                url=response.get("url"),
                created_at=response.get("created_at") or self._get_current_timestamp(),
                expires_at=response.get("expires_at")
            )
            
            self.logger.info(f"Audio uploaded successfully: {upload_response.file_id}")
            return upload_response
            
        except (DIdFileServiceError, DIdFileConfigurationError, DIdFileAPIError):
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error uploading audio: {e}")
            raise DIdFileServiceError(f"Audio upload failed: {str(e)}")
    
    async def delete_image(self, file_id: str) -> bool:
        """Delete image from D-ID storage"""
        try:
            # Validate file_id
            if not file_id:
                raise DIdFileServiceError("File ID is required")
            
            # Prepare headers
            headers = self._get_auth_headers()
            
            # Make API request
            response = await self.http_client.make_request(
                method="DELETE",
                url=f"{self.images_endpoint}/{file_id}",
                headers=headers,
                timeout=30
            )
            
            # For DELETE requests, D-ID API returns empty response on success
            # or error message on failure
            if isinstance(response, dict) and response.get("error"):
                self.logger.warning(f"Image deletion failed: {response}")
                return False
            
            # If we get here, deletion was successful
            self.logger.info(f"Image deleted successfully: {file_id}")
            return True
            
        except (DIdFileServiceError, DIdFileConfigurationError, DIdFileAPIError):
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error deleting image: {e}")
            raise DIdFileServiceError(f"Image deletion failed: {str(e)}")
    
    async def delete_audio(self, file_id: str) -> bool:
        """Delete audio file from D-ID storage"""
        try:
            # Validate file_id
            if not file_id:
                raise DIdFileServiceError("File ID is required")
            
            # Prepare headers
            headers = self._get_auth_headers()
            
            # Make API request
            response = await self.http_client.make_request(
                method="DELETE",
                url=f"{self.audios_endpoint}/{file_id}",
                headers=headers,
                timeout=30
            )
            
            # For DELETE requests, D-ID API returns empty response on success
            # or error message on failure
            if isinstance(response, dict) and response.get("error"):
                self.logger.warning(f"Audio deletion failed: {response}")
                return False
            
            # If we get here, deletion was successful
            self.logger.info(f"Audio deleted successfully: {file_id}")
            return True
            
        except (DIdFileServiceError, DIdFileConfigurationError, DIdFileAPIError):
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error deleting audio: {e}")
            raise DIdFileServiceError(f"Audio deletion failed: {str(e)}")
    
    async def test_authentication(self) -> Dict[str, Any]:
        """Test D-ID API authentication"""
        try:
            # Use the same approach as the main D-ID service
            endpoint = f"{self.base_url}/talks"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers,
                timeout=30
            )
            
            # If we get here, authentication was successful
            return {
                "authenticated": True,
                "message": "D-ID API authentication successful",
                "talks_count": len(response.get("talks", [])),
                "timestamp": self._get_current_timestamp()
            }
                
        except Exception as e:
            self.logger.error(f"Authentication test failed: {e}")
            return {
                "authenticated": False,
                "message": f"Authentication test failed: {str(e)}"
            }
    
    async def get_image_public_url(self, file_id: str) -> str:
        """Get public URL for D-ID image"""
        try:
            # D-ID images are accessible via their S3 URL
            # The URL format is: https://d-id-images-prod.s3.amazonaws.com/{file_id}/{filename}
            # But we need to get the actual public URL from D-ID API
            
            endpoint = f"{self.base_url}/images/{file_id}"
            headers = self._get_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers,
                timeout=30
            )
            
            # D-ID should return the public URL in the response
            if response.get("url"):
                return response["url"]
            else:
                # Fallback: construct the public URL
                return f"https://d-id-images-prod.s3.amazonaws.com/{file_id}/image.jpg"
                
        except Exception as e:
            self.logger.error(f"Error getting public URL for image {file_id}: {e}")
            # Fallback: construct the public URL
            return f"https://d-id-images-prod.s3.amazonaws.com/{file_id}/image.jpg"
    
    async def get_image_info(self, file_id: str) -> Dict[str, Any]:
        """Get information about D-ID image"""
        try:
            endpoint = f"{self.base_url}/images/{file_id}"
            headers = self._get_auth_headers()
            
            response = await self.http_client.make_request(
                method="GET",
                url=endpoint,
                headers=headers,
                timeout=30
            )
            
            return response
                
        except Exception as e:
            self.logger.error(f"Error getting image info for {file_id}: {e}")
            raise DIdFileServiceError(f"Failed to get image info: {str(e)}")
    
    def _validate_image_request(self, request: DIdFileUploadRequest) -> None:
        """Validate image upload request"""
        if not request.file_data:
            raise DIdFileServiceError("File data is required")
        
        if not request.filename:
            raise DIdFileServiceError("Filename is required")
        
        if not request.content_type:
            raise DIdFileServiceError("Content type is required")
        
        # Validate content type
        if request.content_type not in self.supported_image_types:
            raise DIdFileServiceError(f"Unsupported image type: {request.content_type}. Supported: {self.supported_image_types}")
        
        # Validate filename (D-ID requirements: up to 50 valid characters)
        if len(request.filename) > 50:
            raise DIdFileServiceError("Filename must be 50 characters or less")
        
        # Check for valid characters: a-z A-Z 0-9 . _ -
        import re
        if not re.match(r'^[a-zA-Z0-9._-]+$', request.filename):
            raise DIdFileServiceError("Filename contains invalid characters. Only a-z, A-Z, 0-9, ., _, - are allowed")
    
    def _validate_audio_request(self, request: DIdFileUploadRequest) -> None:
        """Validate audio upload request"""
        if not request.file_data:
            raise DIdFileServiceError("File data is required")
        
        if not request.filename:
            raise DIdFileServiceError("Filename is required")
        
        if not request.content_type:
            raise DIdFileServiceError("Content type is required")
        
        # Validate content type (D-ID accepts any audio/ or video/ type)
        if not any(request.content_type.startswith(prefix) for prefix in self.supported_audio_types):
            raise DIdFileServiceError(f"Unsupported audio type: {request.content_type}. Must start with audio/ or video/")
        
        # Validate filename (D-ID requirements: up to 50 valid characters)
        if len(request.filename) > 50:
            raise DIdFileServiceError("Filename must be 50 characters or less")
        
        # Check for valid characters: a-z A-Z 0-9 . _ -
        import re
        if not re.match(r'^[a-zA-Z0-9._-]+$', request.filename):
            raise DIdFileServiceError("Filename contains invalid characters. Only a-z, A-Z, 0-9, ., _, - are allowed")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for D-ID API"""
        # According to D-ID documentation, for file uploads we need:
        # - Authorization header with API key in Basic format
        # - accept: application/json
        # - Content-Type will be set automatically for multipart/form-data
        
        # Get the properly formatted authorization header
        auth_headers = self._get_headers()
        
        headers = {
            "Authorization": auth_headers["Authorization"],
            "accept": "application/json"
        }
        
        return headers
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.now(timezone.utc).isoformat()
