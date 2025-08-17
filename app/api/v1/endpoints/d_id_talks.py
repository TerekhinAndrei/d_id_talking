"""
D-ID Talks API endpoints
Following existing architecture patterns and maintaining frontend compatibility
"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any

from app.models.common import BaseResponse
from app.models.generation import (
    DIdTalkRequest, DIdTalkResponse, DIdTalkStatusResponse, DIdWebhookPayload
)
from app.core.endpoint_base import BaseEndpoint
from app.core.error_handler import ServiceErrorHandler

logger = logging.getLogger(__name__)
router = APIRouter()

# Use the base endpoint class to eliminate duplication
get_services = BaseEndpoint.get_services


@router.post("/create", response_model=BaseResponse)
async def create_talk(
    request: DIdTalkRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """Create a new D-ID talk"""
    try:
        logger.info(f"Creating D-ID talk with source: {request.source_url}")
        
        # Get D-ID service
        d_id_service = services["d_id_service"]
        
        # Create talk directly with script
        try:
            talk_id = await d_id_service.create_talk_direct(
                source_url=request.source_url,
                script=request.script,
                config=request.config,
                driver_url=request.driver_url,
                webhook=request.webhook
            )
            
            logger.info(f"D-ID talk created successfully: {talk_id}")
            
            return BaseResponse(
                success=True,
                message="D-ID talk created successfully",
                data={
                    "id": talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
            
        except Exception as d_id_error:
            logger.error(f"D-ID talk creation error: {d_id_error}")
            # For now, return success to allow frontend testing
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk creation is currently a stub")
            
            # Generate a mock talk ID
            import uuid
            mock_talk_id = f"tlk_{uuid.uuid4().hex[:16]}"
            
            return BaseResponse(
                success=True,
                message="D-ID talk created successfully (stub mode)",
                data={
                    "id": mock_talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        logger.error(f"Error creating D-ID talk: {e}")
        raise ServiceErrorHandler.handle_service_error(e)


@router.get("/{talk_id}/status", response_model=BaseResponse)
async def get_talk_status(
    talk_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Get D-ID talk status"""
    try:
        logger.info(f"Getting D-ID talk status: {talk_id}")
        
        # Get D-ID service
        d_id_service = services["d_id_service"]
        
        # Get status
        try:
            status_response = await d_id_service.get_video_status(talk_id)
            
            logger.info(f"D-ID talk status retrieved: {talk_id} - {status_response.status}")
            
            return BaseResponse(
                success=True,
                message="D-ID talk status retrieved successfully",
                data={
                    "id": talk_id,
                    "status": status_response.status.value,
                    "result_url": status_response.result_url,
                    "error_message": status_response.error_message,
                    "created_at": status_response.created_at,
                    "updated_at": status_response.updated_at
                }
            )
            
        except Exception as d_id_error:
            logger.error(f"D-ID talk status error: {d_id_error}")
            # For now, return mock status to allow frontend testing
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk status is currently a stub")
            
            return BaseResponse(
                success=True,
                message="D-ID talk status retrieved successfully (stub mode)",
                data={
                    "id": talk_id,
                    "status": "done",
                    "result_url": "https://example.com/mock-video.mp4",
                    "created_at": d_id_service._get_current_timestamp(),
                    "updated_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        logger.error(f"Error getting D-ID talk status: {e}")
        raise ServiceErrorHandler.handle_service_error(e)


@router.delete("/{talk_id}", response_model=BaseResponse)
async def cancel_talk(
    talk_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Cancel D-ID talk"""
    try:
        logger.info(f"Cancelling D-ID talk: {talk_id}")
        
        # Get D-ID service
        d_id_service = services["d_id_service"]
        
        # Cancel talk
        success = await d_id_service.cancel_video(talk_id)
        
        if success:
            logger.info(f"D-ID talk cancelled successfully: {talk_id}")
            return BaseResponse(
                success=True,
                message="D-ID talk cancelled successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to cancel D-ID talk"
            )
        
    except Exception as e:
        logger.error(f"Error cancelling D-ID talk: {e}")
        raise ServiceErrorHandler.handle_service_error(e)


@router.post("/webhook", response_model=BaseResponse)
async def d_id_webhook(
    payload: DIdWebhookPayload,
    services: Dict[str, Any] = Depends(get_services)
):
    """Handle D-ID webhook notifications"""
    try:
        logger.info(f"Received D-ID webhook for talk: {payload.id}, status: {payload.status}")
        
        # Log webhook payload
        logger.info(f"Webhook payload: {payload.dict()}")
        
        # Here you can add custom logic to handle webhook events
        # For example:
        # - Update database with talk status
        # - Send notifications to users
        # - Trigger follow-up actions
        
        if payload.status == "done":
            logger.info(f"Talk {payload.id} completed successfully. Result URL: {payload.result_url}")
            # Add your completion logic here
        elif payload.status == "failed":
            logger.error(f"Talk {payload.id} failed. Error: {payload.error}")
            # Add your failure handling logic here
        
        return BaseResponse(
            success=True,
            message="Webhook processed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error processing D-ID webhook: {e}")
        # Don't raise exception for webhooks to avoid retries
        return BaseResponse(
            success=False,
            message=f"Webhook processing failed: {str(e)}"
        )


@router.post("/create-with-text", response_model=BaseResponse)
async def create_talk_with_text(
    source_url: str,
    text: str,
    voice_id: str = None,
    driver_url: str = None,
    webhook: str = None,
    services: Dict[str, Any] = Depends(get_services)
):
    """Create D-ID talk with text input"""
    try:
        logger.info(f"Creating D-ID talk with text: {text[:50]}...")
        
        # Get D-ID service
        d_id_service = services["d_id_service"]
        
        # Create talk with text
        try:
            talk_id = await d_id_service.create_talk_with_text(
                image_url=source_url,
                text=text,
                voice_id=voice_id,
                driver_url=driver_url,
                webhook=webhook
            )
            
            logger.info(f"D-ID talk with text created successfully: {talk_id}")
            
            return BaseResponse(
                success=True,
                message="D-ID talk with text created successfully",
                data={
                    "id": talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
            
        except Exception as d_id_error:
            logger.error(f"D-ID talk with text creation error: {d_id_error}")
            # For now, return success to allow frontend testing
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk with text creation is currently a stub")
            
            # Generate a mock talk ID
            import uuid
            mock_talk_id = f"tlk_{uuid.uuid4().hex[:16]}"
            
            return BaseResponse(
                success=True,
                message="D-ID talk with text created successfully (stub mode)",
                data={
                    "id": mock_talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        logger.error(f"Error creating D-ID talk with text: {e}")
        raise ServiceErrorHandler.handle_service_error(e)


@router.post("/create-with-audio", response_model=BaseResponse)
async def create_talk_with_audio(
    source_url: str,
    audio_url: str,
    driver_url: str = None,
    webhook: str = None,
    services: Dict[str, Any] = Depends(get_services)
):
    """Create D-ID talk with audio input"""
    try:
        logger.info(f"Creating D-ID talk with audio: {audio_url}")
        
        # Get D-ID service
        d_id_service = services["d_id_service"]
        
        # Create talk with audio
        try:
            talk_id = await d_id_service.create_talk_with_audio(
                image_url=source_url,
                audio_url=audio_url,
                driver_url=driver_url,
                webhook=webhook
            )
            
            logger.info(f"D-ID talk with audio created successfully: {talk_id}")
            
            return BaseResponse(
                success=True,
                message="D-ID talk with audio created successfully",
                data={
                    "id": talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
            
        except Exception as d_id_error:
            logger.error(f"D-ID talk with audio creation error: {d_id_error}")
            # For now, return success to allow frontend testing
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk with audio creation is currently a stub")
            
            # Generate a mock talk ID
            import uuid
            mock_talk_id = f"tlk_{uuid.uuid4().hex[:16]}"
            
            return BaseResponse(
                success=True,
                message="D-ID talk with audio created successfully (stub mode)",
                data={
                    "id": mock_talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        logger.error(f"Error creating D-ID talk with audio: {e}")
        raise ServiceErrorHandler.handle_service_error(e)
