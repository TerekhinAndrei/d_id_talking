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
    stream_id: str
    session_id: str
    offer: Dict[str, Any]
    ice_servers: list

class WebRTCConnectionRequest(BaseModel):
    stream_id: str
    session_id: str
    answer: str

class ICECandidateRequest(BaseModel):
    stream_id: str
    session_id: str
    candidate: str
    sdp_mid: str
    sdp_m_line_index: int

class TalkStreamRequest(BaseModel):
    stream_id: str
    session_id: str
    script: Dict[str, Any]
    driver_url: Optional[str] = "bank://lively/"
    config: Optional[Dict[str, Any]] = None

class DeleteStreamRequest(BaseModel):
    stream_id: str
    session_id: str

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
        return CreateStreamResponse(**result)
    except Exception as e:
        logger.error(f"Error creating stream: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create stream: {str(e)}")

@router.post("/streams/sdp")
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
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error starting WebRTC connection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start WebRTC connection: {str(e)}")

@router.post("/streams/ice")
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
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error submitting ICE candidate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit ICE candidate: {str(e)}")

@router.post("/streams/talk")
async def create_talk_stream(
    request: TalkStreamRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 4: Create a talk stream
    Starts the actual video streaming with audio script.
    """
    try:
        result = await webrtc_service.create_talk_stream(
            request.stream_id,
            request.session_id,
            request.script,
            request.driver_url,
            request.config
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error creating talk stream: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create talk stream: {str(e)}")

@router.delete("/streams")
async def delete_stream(
    request: DeleteStreamRequest,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Step 5: Delete a stream
    Cleans up the streaming session and resources.
    """
    try:
        result = await webrtc_service.delete_stream(
            request.stream_id,
            request.session_id
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error deleting stream: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete stream: {str(e)}")

@router.get("/streams/{stream_id}/status")
async def get_stream_status(
    stream_id: str,
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Get the status of a stream
    """
    try:
        result = await webrtc_service.get_stream_status(stream_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error getting stream status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stream status: {str(e)}")

@router.post("/streams/audio-script")
async def create_audio_script(
    audio_url: str,
    script_type: str = "audio",
    webrtc_service: WebRTCService = Depends(get_webrtc_service)
):
    """
    Helper endpoint to create an audio script for streaming
    """
    try:
        script = await webrtc_service.create_audio_script(audio_url, script_type)
        return {"status": "success", "script": script}
    except Exception as e:
        logger.error(f"Error creating audio script: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create audio script: {str(e)}") 