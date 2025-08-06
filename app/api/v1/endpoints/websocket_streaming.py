"""
WebSocket Streaming API Endpoints
Provides endpoints for WebSocket-based D-ID streaming
"""

from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, HttpUrl
from typing import Dict, Any, Optional
import logging
import json
import asyncio

from app.services.d_id_websocket_service import DIdWebSocketService

logger = logging.getLogger(__name__)
router = APIRouter()

class WebSocketStreamRequest(BaseModel):
    source_url: HttpUrl
    presenter_type: str = "talk"

class WebSocketStreamResponse(BaseModel):
    success: bool
    stream_id: Optional[str] = None
    session_id: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None

class TextStreamRequest(BaseModel):
    text: str
    voice_id: str = "en-US-JennyNeural"
    index: int = 0

class AudioStreamRequest(BaseModel):
    audio_data: str  # Base64 encoded audio data
    index: int = 0

# Dependency injection
def get_websocket_service() -> DIdWebSocketService:
    return DIdWebSocketService()

@router.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time streaming
    
    This endpoint establishes a WebSocket connection for real-time
    D-ID streaming with text and audio support.
    """
    await websocket.accept()
    
    service = DIdWebSocketService()
    connection_status = "disconnected"
    
    try:
        # Connect to D-ID WebSocket
        await service.connect(
            on_message=lambda data: asyncio.create_task(websocket.send_text(json.dumps(data))),
            on_connection_change=lambda status: asyncio.create_task(
                websocket.send_text(json.dumps({"type": "connection_status", "status": status}))
            )
        )
        
        connection_status = "connected"
        await websocket.send_text(json.dumps({
            "type": "connection_status", 
            "status": "connected",
            "message": "WebSocket connected to D-ID"
        }))
        
        # Listen for client messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                await handle_client_message(service, message, websocket)
                
            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON message"
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Internal error: {str(e)}"
                }))
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Connection failed: {str(e)}"
        }))
    finally:
        if service.is_connected:
            await service.disconnect()
        await websocket.close()

async def handle_client_message(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle incoming WebSocket messages from client"""
    message_type = message.get("type")
    
    try:
        if message_type == "init-stream":
            await handle_init_stream(service, message, websocket)
        elif message_type == "sdp":
            await handle_sdp(service, message, websocket)
        elif message_type == "ice":
            await handle_ice(service, message, websocket)
        elif message_type == "stream-text":
            await handle_stream_text(service, message, websocket)
        elif message_type == "stream-audio":
            await handle_stream_audio(service, message, websocket)
        elif message_type == "delete-stream":
            await handle_delete_stream(service, message, websocket)
        else:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }))
    
    except Exception as e:
        logger.error(f"Error handling {message_type}: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to handle {message_type}: {str(e)}"
        }))

async def handle_init_stream(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle init-stream message"""
    payload = message.get("payload", {})
    source_url = payload.get("source_url")
    presenter_type = payload.get("presenter_type", "talk")
    
    if not source_url:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "source_url is required"
        }))
        return
    
    try:
        await service.init_stream(source_url, presenter_type)
        await websocket.send_text(json.dumps({
            "type": "init-stream-sent",
            "message": "Stream initialization sent"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to initialize stream: {str(e)}"
        }))

async def handle_sdp(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle SDP message"""
    payload = message.get("payload", {})
    answer = payload.get("answer")
    session_id = payload.get("session_id")
    presenter_type = payload.get("presenter_type", "talk")
    
    if not all([answer, session_id]):
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "answer and session_id are required"
        }))
        return
    
    try:
        await service.send_sdp_answer(answer, session_id, presenter_type)
        await websocket.send_text(json.dumps({
            "type": "sdp-sent",
            "message": "SDP answer sent"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send SDP: {str(e)}"
        }))

async def handle_ice(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle ICE candidate message"""
    payload = message.get("payload", {})
    candidate = payload.get("candidate")
    sdp_mid = payload.get("sdpMid")
    sdp_m_line_index = payload.get("sdpMLineIndex")
    session_id = payload.get("session_id")
    
    if not all([candidate, sdp_mid, sdp_m_line_index, session_id]):
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "candidate, sdpMid, sdpMLineIndex, and session_id are required"
        }))
        return
    
    try:
        await service.send_ice_candidate(candidate, sdp_mid, sdp_m_line_index, session_id)
        await websocket.send_text(json.dumps({
            "type": "ice-sent",
            "message": "ICE candidate sent"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send ICE candidate: {str(e)}"
        }))

async def handle_stream_text(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle stream-text message"""
    payload = message.get("payload", {})
    script = payload.get("script", {})
    text = script.get("input", "")
    voice_id = script.get("provider", {}).get("voice_id", "en-US-JennyNeural")
    index = payload.get("index", 0)
    
    if not text:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "text input is required"
        }))
        return
    
    try:
        await service.send_stream_text(text, voice_id, index)
        await websocket.send_text(json.dumps({
            "type": "text-sent",
            "message": "Text chunk sent"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send text: {str(e)}"
        }))

async def handle_stream_audio(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle stream-audio message"""
    payload = message.get("payload", {})
    script = payload.get("script", {})
    audio_data = script.get("input", [])
    index = payload.get("index", 0)
    
    if not audio_data:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "audio data is required"
        }))
        return
    
    try:
        # Convert array back to bytes
        audio_bytes = bytes(audio_data)
        await service.send_stream_audio(audio_bytes, index)
        await websocket.send_text(json.dumps({
            "type": "audio-sent",
            "message": "Audio chunk sent"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send audio: {str(e)}"
        }))

async def handle_delete_stream(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket):
    """Handle delete-stream message"""
    try:
        await service.delete_stream()
        await websocket.send_text(json.dumps({
            "type": "stream-deleted",
            "message": "Stream deleted"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to delete stream: {str(e)}"
        }))

@router.post("/websocket/init", response_model=WebSocketStreamResponse)
async def init_websocket_stream(
    request: WebSocketStreamRequest,
    service: DIdWebSocketService = Depends(get_websocket_service)
):
    """
    Initialize WebSocket streaming session
    
    This endpoint initiates a WebSocket connection for real-time streaming.
    The actual streaming happens through the WebSocket connection.
    """
    try:
        # Note: This is a placeholder. The actual WebSocket connection
        # should be established through the /ws/stream endpoint
        return WebSocketStreamResponse(
            success=True,
            message="WebSocket streaming initialized. Connect to /ws/stream for real-time streaming."
        )
    except Exception as e:
        logger.error(f"Failed to initialize WebSocket stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize stream: {str(e)}"
        )

@router.get("/websocket/status")
async def get_websocket_status():
    """Get WebSocket streaming status"""
    return {
        "status": "available",
        "endpoint": "/ws/stream",
        "message": "WebSocket streaming is available. Connect to /ws/stream for real-time streaming."
    } 