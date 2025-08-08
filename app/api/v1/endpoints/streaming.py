"""
Streaming API endpoints for real-time audio and video processing
"""
import base64
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import HttpUrl

from app.models.common import (
    CreateStreamRequest, CreateStreamResponse,
    StartStreamRequest, StartStreamResponse,
    SdpRequest, SdpResponse,
    WebRTCSessionRequest, WebRTCSessionResponse,
    WebRTCAnswerRequest, WebRTCAnswerResponse,
    AudioChunkRequest, AudioChunkResponse,
    TalkStreamRequest, TalkStreamResponse,
    DeleteStreamRequest, DeleteStreamResponse,
    IceCandidateRequest, IceCandidateResponse,
    GetSdpRequest, GetSdpResponse,
    SubmitSdpAnswerRequest, SubmitSdpAnswerResponse,
    SubmitIceCandidateRequest, SubmitIceCandidateResponse,
    CreateTalkStreamRequest, CreateTalkStreamResponse,
    StreamStatusResponse, StreamListResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["streaming"])

# Dependency injection
def get_services():
    """Dependency injection for services"""
    from app.core.factory import get_service_container
    from app.core.base import ConfigurationProvider
    from app.core.config import settings as config
    from app.services.webrtc_service import WebRTCService
    
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "d_id_service": container.get_video_generator(),
        "storage_service": container.get_storage_service(),
        "webrtc_service": WebRTCService(),
        "config_provider": config_provider
    }

@router.post("/start", response_model=StartStreamResponse)
async def start_stream(
    request: StartStreamRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Start a new streaming session
    
    Creates a new D-ID streaming session with the provided image URL.
    Returns stream_id, session_id, and SDP offer for WebRTC connection.
    """
    logger.info(f"Starting stream session for image: {request.image_url}")
    
    try:
        # Extract services
        webrtc_service = services["webrtc_service"]
        
        # Create stream session using WebRTC service
        session_data = await webrtc_service.create_stream(str(request.image_url))
        
        # Create session object with expected structure
        class SessionData:
            def __init__(self, data):
                self.stream_id = data['stream_id']
                # Get session_id from D-ID API response
                session_id = data.get('session_id', '')
                # Use the full session_id as provided by D-ID API
                if not session_id:
                    import uuid
                    session_id = str(uuid.uuid4())
                self.session_id = session_id
                # D-ID API returns offer as object with type and sdp fields
                self.sdp_offer = data['offer']['sdp'] if isinstance(data['offer'], dict) else data['offer']
                self.ice_servers = data['ice_servers']
        
        session = SessionData(session_data)
        
        logger.info(f"Stream session created successfully: {session.stream_id}")
        
        return StartStreamResponse(
            success=True,
            stream_id=session.stream_id,
            session_id=session.session_id,
            sdp_offer=session.sdp_offer,
            ice_servers=session.ice_servers
        )
        
    except Exception as e:
        logger.error(f"Unexpected error starting stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/{stream_id}/sdp", response_model=SdpResponse)
async def exchange_sdp(
    stream_id: str,
    request: SdpRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Exchange SDP for WebRTC connection
    
    Accepts SDP answer from frontend and establishes WebRTC connection.
    """
    logger.info(f"Processing SDP exchange")
    
    try:
        # Extract SDP answer from the request
        if not request.answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing SDP answer in request"
            )
        
        # Extract SDP string from the answer object
        sdp_answer = request.answer.get('sdp') if isinstance(request.answer, dict) else str(request.answer)
        
        if not sdp_answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing SDP string in answer object"
            )
        
        # Submit SDP answer to D-ID according to documentation
        response = await services["webrtc_service"].start_webrtc_connection(
            stream_id,
            request.session_id,
            sdp_answer
        )
        
        # WebRTC service returns raw data, not a response object
        logger.info(f"SDP exchange successful")
        return SdpResponse(
            success=True,
            message="WebRTC connection established successfully"
        )
            
    except Exception as e:
        logger.error(f"Error during SDP exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SDP exchange failed: {str(e)}"
        )

@router.delete("/{stream_id}", response_model=DeleteStreamResponse)
async def close_stream(
    stream_id: str,
    request: DeleteStreamRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Close streaming session
    
    Closes the specified streaming session and frees resources.
    """
    logger.info(f"Closing stream session: {stream_id}")
    
    try:
        # Close stream session with session_id
        response = await services["webrtc_service"].delete_stream(stream_id, request.session_id)
        
        if response.success:
            logger.info(f"Stream session closed successfully: {stream_id}")
            return DeleteStreamResponse(
                success=True,
                message=f"Stream session {stream_id} closed successfully"
            )
        else:
            logger.warning(f"Stream cleanup failed: {response.error}")
            # Even if cleanup fails, we return success as the session is no longer active
            return DeleteStreamResponse(
                success=True,
                message=f"Stream session {stream_id} marked as closed"
            )
            
    except Exception as e:
        logger.error(f"Error closing stream session {stream_id}: {e}")
        # Don't raise exception for cleanup errors, just log them
        return DeleteStreamResponse(
            success=True,
            message=f"Stream session {stream_id} cleanup attempted"
        )

@router.get("/{stream_id}/status", response_model=StreamStatusResponse)
async def get_stream_status(
    stream_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Get stream status
    
    Returns the current status of the specified streaming session.
    """
    logger.debug(f"Getting status for stream: {stream_id}")
    
    try:
        # Get stream status from D-ID API
        response = await services["webrtc_service"].get_stream_status(stream_id)
        
        if response.success:
            logger.debug(f"Stream status retrieved successfully: {stream_id}")
            return StreamStatusResponse(
                success=True,
                stream_id=stream_id,
                status="active",
                data=response.data
            )
        else:
            logger.warning(f"Failed to get stream status: {response.error}")
            return StreamStatusResponse(
                success=False,
                stream_id=stream_id,
                error=response.error
            )
            
    except Exception as e:
        logger.error(f"Error getting stream status {stream_id}: {e}")
        return StreamStatusResponse(
            success=False,
            stream_id=stream_id,
            error=f"Failed to get status: {str(e)}"
        )

@router.get("/sessions", response_model=StreamListResponse)
async def list_active_sessions(
    services: Dict[str, Any] = Depends(get_services)
):
    """
    List active streaming sessions
    
    Returns all currently active streaming sessions.
    """
    logger.debug("Listing active streaming sessions")
    
    try:
        # Get active sessions - for now return empty list
        active_sessions = []
        
        # Convert sessions to list format
        sessions_list = []
        for stream_id, session in active_sessions.items():
            sessions_list.append({
                "stream_id": session.stream_id,
                "session_id": session.session_id,
                "status": session.status,
                "created_at": session.created_at
            })
        
        logger.debug(f"Found {len(sessions_list)} active sessions")
        
        return StreamListResponse(
            success=True,
            streams=sessions_list,
            count=len(sessions_list)
        )
        
    except Exception as e:
        logger.error(f"Error listing active sessions: {e}")
        return StreamListResponse(
            success=False,
            streams=[],
            count=0,
            error=f"Failed to list sessions: {str(e)}"
        )

@router.post("/{stream_id}/ice", response_model=IceCandidateResponse)
async def submit_ice_candidate(
    stream_id: str,
    request: IceCandidateRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Submit ICE candidate
    
    Submits an ICE candidate for WebRTC connection establishment.
    """
    logger.debug(f"Submitting ICE candidate for stream: {stream_id}")
    
    try:
        response = await services["webrtc_service"].submit_ice_candidate(
            stream_id,
            request.session_id,
            request.candidate,
            request.sdpMid,
            request.sdpMLineIndex
        )
        
        # WebRTC service returns raw data, not a response object
        logger.debug(f"ICE candidate submitted successfully: {stream_id}")
        return IceCandidateResponse(
            success=True,
            message="ICE candidate submitted successfully"
        )
            
    except Exception as e:
        logger.error(f"Error submitting ICE candidate: {e}")
        return IceCandidateResponse(
            success=False,
            error=f"Failed to submit ICE candidate: {str(e)}"
        )

@router.post("/{stream_id}/talk", response_model=TalkStreamResponse)
async def create_talk_stream(
    stream_id: str,
    request: TalkStreamRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """
    Create talk stream
    
    Creates a talking stream with text-to-speech for the specified session.
    """
    logger.info(f"Creating talk stream: {stream_id}")
    
    try:
        response = await services["webrtc_service"].create_talk_stream(
            stream_id,
            request.session_id,
            request.script
        )
        
        # WebRTC service returns raw data, not a response object
        logger.info(f"Talk stream created successfully: {stream_id}")
        return TalkStreamResponse(
            success=True,
            talk_id=response.get('id') if response else None,
            status=response.get('status') if response else None,
            message="Talk stream created successfully"
        )
            
    except Exception as e:
        logger.error(f"Talk stream operation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Talk stream operation failed: {str(e)}"
        )
        
    except Exception as e:
        logger.error(f"Unexpected error creating talk stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 