"""
D-ID File management endpoints
Following existing architecture patterns and maintaining frontend compatibility
"""
import logging
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends
from typing import List, Dict, Any

from app.models.common import BaseResponse
from app.core.endpoint_base import BaseEndpoint
from app.core.error_handler import ServiceErrorHandler
from app.core.interfaces import DIdFileUploadRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Use the base endpoint class to eliminate duplication
get_services = BaseEndpoint.get_services

@router.post("/upload/image", response_model=BaseResponse)
async def upload_image_to_d_id(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an image to D-ID temporary storage"""
    try:
        logger.info(f"Uploading image to D-ID: {file.filename}, size: {file.size} bytes")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise ServiceErrorHandler.handle_validation_error(
                "file", "File must be an image"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Create D-ID upload request
        upload_request = DIdFileUploadRequest(
            file_data=file_content,
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Upload to D-ID
        d_id_file_service = services["d_id_file_service"]
        upload_response = await d_id_file_service.upload_image(upload_request)
        
        logger.info(f"Image uploaded successfully to D-ID: {upload_response.file_id}")
        
        return BaseResponse(
            success=True,
            message="Image uploaded successfully to D-ID",
            data={
                "file_id": upload_response.file_id,
                "url": upload_response.url,
                "created_at": upload_response.created_at,
                "expires_at": upload_response.expires_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading image to D-ID: {e}")
        raise ServiceErrorHandler.handle_service_error(e)

@router.post("/upload/audio", response_model=BaseResponse)
async def upload_audio_to_d_id(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an audio file to D-ID temporary storage"""
    try:
        logger.info(f"Uploading audio to D-ID: {file.filename}, size: {file.size} bytes")
        
        # Validate file type
        if not (file.content_type.startswith('audio/') or file.content_type.startswith('video/')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an audio or video file"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Create D-ID upload request
        upload_request = DIdFileUploadRequest(
            file_data=file_content,
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Upload to D-ID
        d_id_file_service = services["d_id_file_service"]
        upload_response = await d_id_file_service.upload_audio(upload_request)
        
        logger.info(f"Audio uploaded successfully to D-ID: {upload_response.file_id}")
        
        return BaseResponse(
            success=True,
            message="Audio uploaded successfully to D-ID",
            data={
                "file_id": upload_response.file_id,
                "url": upload_response.url,
                "created_at": upload_response.created_at,
                "expires_at": upload_response.expires_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading audio to D-ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/images/{file_id}", response_model=BaseResponse)
async def delete_image_from_d_id(
    file_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Delete an image from D-ID storage"""
    try:
        logger.info(f"Deleting image from D-ID: {file_id}")
        
        d_id_file_service = services["d_id_file_service"]
        success = await d_id_file_service.delete_image(file_id)
        
        if success:
            return BaseResponse(
                success=True,
                message="Image deleted successfully from D-ID"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found in D-ID storage"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image from D-ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete image from D-ID: {str(e)}"
        )

@router.delete("/audios/{file_id}", response_model=BaseResponse)
async def delete_audio_from_d_id(
    file_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Delete an audio file from D-ID storage"""
    try:
        logger.info(f"Deleting audio from D-ID: {file_id}")
        
        d_id_file_service = services["d_id_file_service"]
        success = await d_id_file_service.delete_audio(file_id)
        
        if success:
            return BaseResponse(
                success=True,
                message="Audio deleted successfully from D-ID"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found in D-ID storage"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting audio from D-ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete audio from D-ID: {str(e)}"
        )

@router.get("/test-auth", response_model=BaseResponse)
async def test_d_id_authentication(
    services: Dict[str, Any] = Depends(get_services)
):
    """Test D-ID API authentication"""
    try:
        logger.info("Testing D-ID API authentication")
        
        d_id_file_service = services["d_id_file_service"]
        auth_result = await d_id_file_service.test_authentication()
        
        return BaseResponse(
            success=auth_result.get("authenticated", False),
            message=auth_result.get("message", "Authentication test completed"),
            data=auth_result
        )
        
    except Exception as e:
        logger.error(f"Error testing D-ID authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication test failed: {str(e)}"
        )
