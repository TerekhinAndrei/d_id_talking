"""
Storage management endpoints with D-ID API integration
Maintaining frontend compatibility while adding D-ID file support
"""
import logging
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends, Query
from typing import List, Dict, Any, Optional
import cloudinary
import cloudinary.uploader
from app.models.common import BaseResponse
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config
from app.core.interfaces import DIdFileUploadRequest

logger = logging.getLogger(__name__)
router = APIRouter()

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "storage_service": container.get_storage_service(),
        "d_id_file_service": container.get_d_id_file_service(),
        "config_provider": config_provider
    }

@router.post("/upload/image", response_model=BaseResponse)
async def upload_image(
    file: UploadFile = File(...),
    use_d_id: bool = Query(False, description="Use D-ID API instead of Cloudinary"),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an image to Cloudinary or D-ID"""
    try:
        logger.info(f"Uploading image: {file.filename}, size: {file.size} bytes, use_d_id: {use_d_id}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Read file content
        file_content = await file.read()
        
        if use_d_id:
            # Upload to D-ID
            try:
                upload_request = DIdFileUploadRequest(
                    file_data=file_content,
                    filename=file.filename,
                    content_type=file.content_type
                )
                
                d_id_file_service = services["d_id_file_service"]
                upload_response = await d_id_file_service.upload_image(upload_request)
                
                logger.info(f"Image uploaded successfully to D-ID: {upload_response.file_id}")
                
                return BaseResponse(
                    success=True,
                    message="Image uploaded successfully to D-ID",
                    data={
                        "url": upload_response.url,
                        "public_id": upload_response.file_id,
                        "secure_url": upload_response.url,
                        "d_id_file_id": upload_response.file_id,
                        "storage_type": "d_id"
                    }
                )
                
            except Exception as d_id_error:
                logger.error(f"D-ID upload error: {d_id_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload to D-ID: {str(d_id_error)}"
                )
        else:
            # Upload to Cloudinary (existing logic)
            try:
                # Configure Cloudinary
                cloudinary_url = config.CLOUDINARY_URL
                if cloudinary_url:
                    # Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
                    url_parts = cloudinary_url.replace('cloudinary://', '').split('@')
                    if len(url_parts) == 2:
                        credentials, cloud_name = url_parts
                        api_key, api_secret = credentials.split(':')
                        
                        cloudinary.config(
                            cloud_name=cloud_name,
                            api_key=api_key,
                            api_secret=api_secret
                        )
                    else:
                        raise ValueError("Invalid CLOUDINARY_URL format")
                else:
                    # Fallback to individual config fields
                    cloudinary.config(
                        cloud_name=config.CLOUDINARY_CLOUD_NAME,
                        api_key=config.CLOUDINARY_API_KEY,
                        api_secret=config.CLOUDINARY_API_SECRET
                    )
                
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    file_content,
                    folder="d_id_talking",
                    public_id=f"image_{file.filename}",
                    overwrite=True
                )
                
                logger.info(f"Cloudinary upload result: {result}")
                logger.info(f"Image uploaded successfully to Cloudinary: {result.get('url')}")
                
                return BaseResponse(
                    success=True,
                    message="Image uploaded successfully",
                    data={
                        "url": result.get('url'),
                        "public_id": result.get('public_id'),
                        "secure_url": result.get('secure_url'),
                        "storage_type": "cloudinary"
                    }
                )
                
            except Exception as cloudinary_error:
                logger.error(f"Cloudinary upload error: {cloudinary_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload to Cloudinary: {str(cloudinary_error)}"
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
    use_d_id: bool = Query(False, description="Use D-ID API instead of Cloudinary"),
    services: Dict[str, Any] = Depends(get_services)
):
    """Upload an audio file to Cloudinary or D-ID"""
    try:
        logger.info(f"Uploading audio: {file.filename}, size: {file.size} bytes, use_d_id: {use_d_id}")
        
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an audio file"
            )
        
        # Read file content
        file_content = await file.read()
        
        if use_d_id:
            # Upload to D-ID
            try:
                upload_request = DIdFileUploadRequest(
                    file_data=file_content,
                    filename=file.filename,
                    content_type=file.content_type
                )
                
                d_id_file_service = services["d_id_file_service"]
                upload_response = await d_id_file_service.upload_audio(upload_request)
                
                logger.info(f"Audio uploaded successfully to D-ID: {upload_response.file_id}")
                
                return BaseResponse(
                    success=True,
                    message="Audio uploaded successfully to D-ID",
                    data={
                        "url": upload_response.url,
                        "public_id": upload_response.file_id,
                        "secure_url": upload_response.url,
                        "d_id_file_id": upload_response.file_id,
                        "storage_type": "d_id"
                    }
                )
                
            except Exception as d_id_error:
                logger.error(f"D-ID upload error: {d_id_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload to D-ID: {str(d_id_error)}"
                )
        else:
            # Upload to Cloudinary (existing logic)
            try:
                # Configure Cloudinary
                cloudinary_url = config.CLOUDINARY_URL
                if cloudinary_url:
                    # Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
                    url_parts = cloudinary_url.replace('cloudinary://', '').split('@')
                    if len(url_parts) == 2:
                        credentials, cloud_name = url_parts
                        api_key, api_secret = credentials.split(':')
                        
                        cloudinary.config(
                            cloud_name=cloud_name,
                            api_key=api_key,
                            api_secret=api_secret
                        )
                    else:
                        raise ValueError("Invalid CLOUDINARY_URL format")
                else:
                    # Fallback to individual config fields
                    cloudinary.config(
                        cloud_name=config.CLOUDINARY_CLOUD_NAME,
                        api_key=config.CLOUDINARY_API_KEY,
                        api_secret=config.CLOUDINARY_API_SECRET
                    )
                
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    file_content,
                    folder="d_id_talking/audio",
                    public_id=f"audio_{file.filename}",
                    resource_type="video",  # Cloudinary treats audio as video
                    overwrite=True
                )
                
                logger.info(f"Audio uploaded successfully to Cloudinary: {result.get('url')}")
                
                return BaseResponse(
                    success=True,
                    message="Audio uploaded successfully",
                    data={
                        "url": result.get('url'),
                        "public_id": result.get('public_id'),
                        "secure_url": result.get('secure_url'),
                        "storage_type": "cloudinary"
                    }
                )
                
            except Exception as cloudinary_error:
                logger.error(f"Cloudinary upload error: {cloudinary_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload to Cloudinary: {str(cloudinary_error)}"
                )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/files", response_model=BaseResponse)
async def list_files(services: Dict[str, Any] = Depends(get_services)):
    """List uploaded files"""
    try:
        # For now, return empty list since we don't have a database
        return BaseResponse(
            success=True,
            message="Files listed successfully",
            data={"files": []}
        )
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )

@router.delete("/files/{file_id}", response_model=BaseResponse)
async def delete_file(
    file_id: str, 
    storage_type: str = Query("cloudinary", description="Storage type: cloudinary or d_id"),
    services: Dict[str, Any] = Depends(get_services)
):
    """Delete a file from Cloudinary or D-ID"""
    try:
        if storage_type == "d_id":
            # Delete from D-ID
            try:
                d_id_file_service = services["d_id_file_service"]
                success = await d_id_file_service.delete_image(file_id)  # Try image first
                
                if not success:
                    success = await d_id_file_service.delete_audio(file_id)  # Try audio if image failed
                
                if success:
                    return BaseResponse(
                        success=True,
                        message="File deleted successfully from D-ID"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found in D-ID storage"
                    )
                    
            except Exception as d_id_error:
                logger.error(f"D-ID deletion error: {d_id_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to delete from D-ID: {str(d_id_error)}"
                )
        else:
            # Delete from Cloudinary (existing logic)
            try:
                # Configure Cloudinary
                cloudinary.config(
                    cloud_name=config.CLOUDINARY_CLOUD_NAME,
                    api_key=config.CLOUDINARY_API_KEY,
                    api_secret=config.CLOUDINARY_API_SECRET
                )
                
                # Delete from Cloudinary
                result = cloudinary.uploader.destroy(file_id)
                
                if result.get('result') == 'ok':
                    return BaseResponse(
                        success=True,
                        message="File deleted successfully"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found"
                    )
                    
            except Exception as cloudinary_error:
                logger.error(f"Cloudinary deletion error: {cloudinary_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to delete from Cloudinary: {str(cloudinary_error)}"
                )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
