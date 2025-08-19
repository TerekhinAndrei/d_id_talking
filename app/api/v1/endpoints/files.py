"""
File upload and management endpoints
"""

import logging
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends, Query
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional
import os

from app.models.common import BaseResponse
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config
from app.services.file_storage_service import FileStorageService

logger = logging.getLogger(__name__)
router = APIRouter()

def get_services():
    """Dependency injection for services"""
    try:
        config_provider = ConfigurationProvider(config)
        container = get_service_container(config_provider)
        return {
            "file_storage_service": container.get_file_storage_service(),
            "config_provider": config_provider
        }
    except Exception as e:
        logger.error(f"Error in get_services: {e}")
        raise

@router.get("/test", response_model=BaseResponse)
async def test_endpoint():
    """Test endpoint to check if files router is working"""
    return BaseResponse(
        success=True,
        message="Files router is working",
        data={"status": "ok"}
    )

@router.post("/upload/image", response_model=BaseResponse)
async def upload_image(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an image file (replaces current avatar)"""
    try:
        logger.info(f"Uploading image: {file.filename}, size: {file.size} bytes")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Upload using file storage service
        file_storage_service = services["file_storage_service"]
        metadata = await file_storage_service.upload_image(file_content, file.filename, file.content_type)
        
        logger.info(f"Image uploaded successfully: {metadata.filename}")
        
        return BaseResponse(
            success=True,
            message="Image uploaded successfully",
            data={
                "url": metadata.url,
                "filename": metadata.filename,
                "size": metadata.size,
                "content_type": metadata.content_type,
                "created_at": metadata.created_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/upload/audio", response_model=BaseResponse)
async def upload_audio(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an audio file (automatically deleted after 10 seconds)"""
    try:
        logger.info(f"Uploading audio: {file.filename}, size: {file.size} bytes")
        
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an audio file"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Upload using file storage service
        file_storage_service = services["file_storage_service"]
        metadata = await file_storage_service.upload_audio(file_content, file.filename, file.content_type)
        
        logger.info(f"Audio uploaded successfully: {metadata.filename}")
        
        return BaseResponse(
            success=True,
            message="Audio uploaded successfully (will be automatically deleted in 10 seconds)",
            data={
                "url": metadata.url,
                "filename": metadata.filename,
                "size": metadata.size,
                "content_type": metadata.content_type,
                "created_at": metadata.created_at,
                "auto_delete": True,
                "delete_after_seconds": 10
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/avatar", response_model=BaseResponse)
async def get_current_avatar(services: Dict[str, Any] = Depends(get_services)):
    """Get current avatar metadata"""
    try:
        file_storage_service = services["file_storage_service"]
        avatar_metadata = await file_storage_service.get_current_avatar()
        
        if not avatar_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No avatar found"
            )
        
        return BaseResponse(
            success=True,
            message="Avatar retrieved successfully",
            data={
                "url": avatar_metadata.url,
                "filename": avatar_metadata.filename,
                "size": avatar_metadata.size,
                "content_type": avatar_metadata.content_type,
                "created_at": avatar_metadata.created_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )



@router.get("/files/{file_id}", response_model=BaseResponse)
async def get_file_metadata(
    file_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Get file metadata by ID"""
    try:
        file_storage_service = services["file_storage_service"]
        metadata = await file_storage_service.get_file_metadata(file_id)
        
        return BaseResponse(
            success=True,
            message="File metadata retrieved successfully",
            data={
                "url": metadata.url,
                "filename": metadata.filename,
                "size": metadata.size,
                "content_type": metadata.content_type,
                "created_at": metadata.created_at
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting file metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {str(e)}"
        )

@router.delete("/files/{file_id}", response_model=BaseResponse)
async def delete_file(
    file_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Delete a file by ID"""
    try:
        file_storage_service = services["file_storage_service"]
        success = await file_storage_service.delete_file(file_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return BaseResponse(
            success=True,
            message="File deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/serve/{file_path:path}")
async def serve_file(file_path: str):
    """Serve uploaded files"""
    try:
        # Security check - prevent directory traversal
        if ".." in file_path or file_path.startswith("/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )
        
        # Construct full file path
        upload_dir = config.UPLOAD_DIR if hasattr(config, 'UPLOAD_DIR') else "uploads"
        full_path = os.path.join(upload_dir, file_path)
        
        # Check if file exists
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Determine content type
        content_type = "application/octet-stream"
        if file_path.endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif file_path.endswith('.png'):
            content_type = "image/png"
        elif file_path.endswith('.webp'):
            content_type = "image/webp"
        elif file_path.endswith('.mp3'):
            content_type = "audio/mpeg"
        elif file_path.endswith('.wav'):
            content_type = "audio/wav"
        elif file_path.endswith('.webm'):
            content_type = "audio/webm"
        elif file_path.endswith('.ogg'):
            content_type = "audio/ogg"
        
        return FileResponse(
            path=full_path,
            media_type=content_type,
            filename=os.path.basename(file_path)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
