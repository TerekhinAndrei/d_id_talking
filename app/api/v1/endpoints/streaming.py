"""
Streaming API Endpoints
API endpoints for D-ID Live Streaming functionality
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, HttpUrl
from typing import Dict, Any, Optional
import logging
from app.services.d_id_streaming_service import (
    DIdStreamingService,
    DIdStreamingError,
    DIdConnectionError,
    DIdAuthenticationError,
    DIdStreamCreationError,
    DIdStreamOperationError
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response Models
class StartStreamRequest(BaseModel):
    """Request model for starting a stream"""
    image_url: HttpUrl
    description: Optional[str] = None

class StartStreamResponse(BaseModel):
    """Response model for stream start"""
    success: bool
    stream_id: Optional[str] = None
    session_id: Optional[str] = None
    sdp_offer: Optional[str] = None
    ice_servers: Optional[list] = None
    error: Optional[str] = None

class SdpRequest(BaseModel):
    """Request model for SDP exchange"""
    answer: Dict[str, Any]
    session_id: str

class SdpResponse(BaseModel):
    """Response model for SDP exchange"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class StreamStatusResponse(BaseModel):
    """Response model for stream status"""
    success: bool
    stream_id: Optional[str] = None
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class StreamListResponse(BaseModel):
    """Response model for stream list"""
    success: bool
    streams: list
    count: int
    error: Optional[str] = None

class WebRTCSessionRequest(BaseModel):
    image_url: HttpUrl
    voice_id: Optional[str] = "21m00Tcm4TlvDq8ikWAM"
    description: Optional[str] = None

class WebRTCSessionResponse(BaseModel):
    success: bool
    stream_id: Optional[str] = None
    session_id: Optional[str] = None
    sdp_offer: Optional[str] = None
    ice_servers: Optional[list] = None
    error: Optional[str] = None

class WebRTCAnswerRequest(BaseModel):
    stream_id: str
    sdp_answer: str

class WebRTCAnswerResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class AudioChunkRequest(BaseModel):
    stream_id: str
    audio_data: str  # Base64 encoded audio data

class AudioChunkResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class TalkStreamRequest(BaseModel):
    """Request model for talk stream creation"""
    script: Dict[str, Any]
    config: Optional[Dict[str, Any]] = None
    audio_optimization: Optional[str] = "2"
    session_id: str
    result_url: Optional[str] = None

class TalkStreamResponse(BaseModel):
    """Response model for talk stream creation"""
    success: bool
    talk_id: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None

class DeleteStreamRequest(BaseModel):
    """Request model for stream deletion"""
    session_id: str

class DeleteStreamResponse(BaseModel):
    """Response model for stream deletion"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class IceCandidateRequest(BaseModel):
    """Request model for ICE candidate submission"""
    candidate: str
    sdpMid: str
    sdpMLineIndex: int
    session_id: str

class IceCandidateResponse(BaseModel):
    """Response model for ICE candidate submission"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

# Dependency injection
def get_streaming_service() -> DIdStreamingService:
    """Get streaming service instance"""
    return DIdStreamingService()

@router.post("/start", response_model=StartStreamResponse)
async def start_stream(
    request: StartStreamRequest,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Start a new streaming session
    
    Creates a new D-ID streaming session with the provided image URL.
    Returns stream_id, session_id, and SDP offer for WebRTC connection.
    """
    logger.info(f"Starting stream session for image: {request.image_url}")
    
    try:
        # Create stream session
        session = await streaming_service.create_webrtc_session(str(request.image_url))
        
        logger.info(f"Stream session created successfully: {session.stream_id}")
        
        return StartStreamResponse(
            success=True,
            stream_id=session.stream_id,
            session_id=session.session_id,
            sdp_offer=session.sdp_offer,
            ice_servers=session.ice_servers
        )
        
    except DIdAuthenticationError as e:
        logger.error(f"Authentication error starting stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
        
    except DIdStreamCreationError as e:
        logger.error(f"Stream creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create stream: {str(e)}"
        )
        
    except DIdConnectionError as e:
        logger.error(f"Connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
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
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Exchange SDP for WebRTC connection
    
    Accepts SDP answer from frontend and establishes WebRTC connection.
    """
    logger.info(f"Processing SDP exchange")
    
    try:
        # Extract SDP answer from the request
        sdp_answer = request.answer.get('sdp')
        if not sdp_answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing SDP answer in request"
            )
        
        # Submit SDP answer to D-ID according to documentation
        response = await streaming_service.submit_webrtc_answer_direct(
            request.answer,
            request.session_id
        )
        
        if response.success:
            logger.info(f"SDP exchange successful")
            return SdpResponse(
                success=True,
                message="WebRTC connection established successfully"
            )
        else:
            logger.error(f"SDP exchange failed: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SDP exchange failed: {response.error}"
            )
            
    except DIdStreamOperationError as e:
        logger.error(f"Stream operation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stream operation failed: {str(e)}"
        )
        
    except DIdConnectionError as e:
        logger.error(f"Connection error during SDP exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during SDP exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{stream_id}", response_model=DeleteStreamResponse)
async def close_stream(
    stream_id: str,
    request: DeleteStreamRequest,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Close streaming session
    
    Closes the specified streaming session and frees resources.
    """
    logger.info(f"Closing stream session: {stream_id}")
    
    try:
        # Close stream session with session_id
        response = await streaming_service.close_stream_session(stream_id, request.session_id)
        
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
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Get stream status
    
    Returns the current status of the specified streaming session.
    """
    logger.debug(f"Getting status for stream: {stream_id}")
    
    try:
        # Get stream status from D-ID API
        response = await streaming_service.get_stream_status(stream_id)
        
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
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    List active streaming sessions
    
    Returns all currently active streaming sessions.
    """
    logger.debug("Listing active streaming sessions")
    
    try:
        # Get active sessions
        active_sessions = streaming_service.get_active_sessions()
        
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
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Submit ICE candidate
    
    Submits an ICE candidate for WebRTC connection establishment.
    """
    logger.debug(f"Submitting ICE candidate for stream: {stream_id}")
    
    try:
        response = await streaming_service.submit_ice_candidate(
            stream_id,
            request.session_id,
            request.candidate,
            request.sdpMid,
            request.sdpMLineIndex
        )
        
        if response.success:
            logger.debug(f"ICE candidate submitted successfully: {stream_id}")
            return IceCandidateResponse(
                success=True,
                message="ICE candidate submitted successfully"
            )
        else:
            logger.warning(f"ICE candidate submission failed: {response.error}")
            return IceCandidateResponse(
                success=False,
                error=response.error
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
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Create talk stream
    
    Creates a talking stream with text-to-speech for the specified session.
    """
    logger.info(f"Creating talk stream: {stream_id}")
    
    try:
        response = await streaming_service.create_talk_stream(
            stream_id,
            request.session_id,
            request.script,
            request.config,
            request.audio_optimization,
            request.result_url
        )
        
        if response.success:
            logger.info(f"Talk stream created successfully: {stream_id}")
            return TalkStreamResponse(
                success=True,
                talk_id=response.data.get('id') if response.data else None,
                status=response.data.get('status') if response.data else None,
                message="Talk stream created successfully"
            )
        else:
            logger.error(f"Talk stream creation failed: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create talk stream: {response.error}"
            )
            
    except DIdStreamOperationError as e:
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

@router.post("/webrtc/session", response_model=WebRTCSessionResponse)
async def create_webrtc_session(
    request: WebRTCSessionRequest,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Create a new WebRTC streaming session with D-ID.
    
    This endpoint initiates a real-time streaming session where the client
    can send audio chunks and receive video streams directly via WebRTC.
    """
    try:
        session = await streaming_service.create_webrtc_session(
            str(request.image_url), 
            request.voice_id
        )
        return WebRTCSessionResponse(
            success=True,
            stream_id=session.stream_id,
            session_id=session.session_id,
            sdp_offer=session.sdp_offer,
            ice_servers=session.ice_servers
        )
    except DIdAuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Authentication failed: {str(e)}"
        )
    except DIdStreamCreationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Failed to create WebRTC session: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_webrtc_session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/webrtc/answer", response_model=WebRTCAnswerResponse)
async def submit_webrtc_answer(
    request: WebRTCAnswerRequest,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Submit SDP answer to establish WebRTC connection.
    
    After the client receives the SDP offer from create_webrtc_session,
    it should create an RTCPeerConnection, set the remote description,
    and send the SDP answer back to this endpoint.
    """
    try:
        result = await streaming_service.submit_webrtc_answer(
            request.stream_id, 
            request.sdp_answer
        )
        return WebRTCAnswerResponse(
            success=True,
            message=result.message
        )
    except DIdConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Connection establishment failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in submit_webrtc_answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/webrtc/audio", response_model=AudioChunkResponse)
async def send_audio_chunk(
    request: AudioChunkRequest,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Send audio chunk to D-ID for real-time processing.
    
    This endpoint accepts base64-encoded audio data and sends it to D-ID
    for processing in the active WebRTC stream.
    """
    try:
        import base64
        audio_data = base64.b64decode(request.audio_data)
        
        result = await streaming_service.send_audio_chunk(
            request.stream_id, 
            audio_data
        )
        return AudioChunkResponse(
            success=True,
            message=result.message
        )
    except DIdConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Audio processing failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in send_audio_chunk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/webrtc/{stream_id}/status")
async def get_webrtc_status(
    stream_id: str,
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Get the status of a WebRTC streaming session.
    """
    try:
        session = streaming_service.get_session(stream_id)
        if session:
            return {
                "success": True,
                "stream_id": session.stream_id,
                "status": session.status,
                "image_url": session.image_url,
                "voice_id": session.voice_id
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stream {stream_id} not found"
            )
    except Exception as e:
        logger.error(f"Error getting WebRTC status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/health", response_model=Dict[str, Any])
async def streaming_health_check(
    streaming_service: DIdStreamingService = Depends(get_streaming_service)
):
    """
    Health check for streaming service
    
    Checks if the D-ID streaming service is accessible.
    """
    logger.debug("Performing streaming service health check")
    
    try:
        is_healthy = await streaming_service.health_check()
        
        return {
            "service": "streaming",
            "status": "healthy" if is_healthy else "unhealthy",
            "d_id_api_accessible": is_healthy,
            "active_sessions": len(streaming_service.get_active_sessions())
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "streaming",
            "status": "error",
            "d_id_api_accessible": False,
            "error": str(e)
        } 