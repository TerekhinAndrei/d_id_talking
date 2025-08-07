from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from app.services.webrtc_service import WebRTCService

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request/response
class CreateStreamRequest(BaseModel):
    source_url: str

class CreateStreamResponse(BaseModel):
    success: bool
    stream_id: Optional[str] = None
    session_id: Optional[str] = None
    offer: Optional[Dict[str, Any]] = None
    ice_servers: Optional[list] = None
    error: Optional[str] = None

class WebRTCConnectionRequest(BaseModel):
    stream_id: str
    session_id: str
    answer: str

class WebRTCConnectionResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class ICECandidateRequest(BaseModel):
    stream_id: str
    session_id: str
    candidate: str
    sdp_mid: str
    sdp_m_line_index: int

class ICECandidateResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class TalkStreamRequest(BaseModel):
    stream_id: str
    session_id: str
    script: Dict[str, Any]
    driver_url: Optional[str] = "bank://lively/"
    config: Optional[Dict[str, Any]] = None

class TalkStreamResponse(BaseModel):
    success: bool
    talk_id: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None

class DeleteStreamRequest(BaseModel):
    stream_id: str
    session_id: str

class DeleteStreamResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class StreamStatusResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Dependency to get WebRTC service
def get_webrtc_service() -> WebRTCService:
    return WebRTCService()

@router.post("/streams", response_model=CreateStreamResponse)
async def create_stream(
    request: CreateStreamRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 1: Create a new stream
    Creates a new D-ID streaming session with the provided source image URL.
    """
    try:
        result = await webrtc_service.create_stream(request.source_url)
        return CreateStreamResponse(
            success=True,
            stream_id=result.get("stream_id"),
            session_id=result.get("session_id"),
            offer=result.get("offer"),
            ice_servers=result.get("ice_servers")
        )
    except Exception as e:
        logger.error(f"Error creating stream: {e}")
        return CreateStreamResponse(
            success=False,
            error=f"Failed to create stream: {str(e)}"
        )

@router.post("/streams/sdp", response_model=WebRTCConnectionResponse)
async def start_webrtc_connection(
    request: WebRTCConnectionRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 2: Start a WebRTC connection
    Establishes the WebRTC connection using the SDP answer from the client.
    """
    try:
        result = await webrtc_service.start_webrtc_connection(
            request.stream_id,
            request.session_id,
            request.answer
        )
        return WebRTCConnectionResponse(
            success=True,
            message="WebRTC connection established successfully"
        )
    except Exception as e:
        logger.error(f"Error starting WebRTC connection: {e}")
        return WebRTCConnectionResponse(
            success=False,
            error=f"Failed to start WebRTC connection: {str(e)}"
        )

@router.post("/streams/ice", response_model=ICECandidateResponse)
async def submit_ice_candidate(
    request: ICECandidateRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 3: Submit ICE candidate
    Submits network information (ICE candidates) for the WebRTC connection.
    """
    try:
        result = await webrtc_service.submit_ice_candidate(
            request.stream_id,
            request.session_id,
            request.candidate,
            request.sdp_mid,
            request.sdp_m_line_index
        )
        return ICECandidateResponse(
            success=True,
            message="ICE candidate submitted successfully"
        )
    except Exception as e:
        logger.error(f"Error submitting ICE candidate: {e}")
        return ICECandidateResponse(
            success=False,
            error=f"Failed to submit ICE candidate: {str(e)}"
        )

@router.post("/streams/talk", response_model=TalkStreamResponse)
async def create_talk_stream(
    request: TalkStreamRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 4: Create a talk stream
    Creates a talk stream with the provided script and configuration.
    """
    try:
        result = await webrtc_service.create_talk_stream(
            request.stream_id,
            request.session_id,
            request.script,
            request.driver_url,
            request.config
        )
        return TalkStreamResponse(
            success=True,
            talk_id=result.get("talk_id"),
            message="Talk stream created successfully"
        )
    except Exception as e:
        logger.error(f"Error creating talk stream: {e}")
        return TalkStreamResponse(
            success=False,
            error=f"Failed to create talk stream: {str(e)}"
        )

@router.delete("/streams", response_model=DeleteStreamResponse)
async def delete_stream(
    request: DeleteStreamRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 5: Delete stream
    Closes and deletes the D-ID streaming session.
    """
    try:
        result = await webrtc_service.delete_stream(
            request.stream_id,
            request.session_id
        )
        return DeleteStreamResponse(
            success=True,
            message="Stream deleted successfully"
        )
    except Exception as e:
        logger.error(f"Error deleting stream: {e}")
        return DeleteStreamResponse(
            success=False,
            error=f"Failed to delete stream: {str(e)}"
        )

@router.get("/streams/{stream_id}/status", response_model=StreamStatusResponse)
async def get_stream_status(
    stream_id: str,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Get stream status
    Returns the current status of a D-ID streaming session.
    """
    try:
        result = await webrtc_service.get_stream_status(stream_id)
        return StreamStatusResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"Error getting stream status: {e}")
        return StreamStatusResponse(
            success=False,
            error=f"Failed to get stream status: {str(e)}"
        )

@router.post("/streams/audio-script")
async def create_audio_script(
    audio_url: str,
    script_type: str = "audio",
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Create audio script
    Creates an audio script for the streaming session.
    """
    try:
        result = await webrtc_service.create_audio_script(audio_url, script_type)
        return {
            "success": True,
            "data": result,
            "message": "Audio script created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating audio script: {e}")
        return {
            "success": False,
            "error": f"Failed to create audio script: {str(e)}"
        } 