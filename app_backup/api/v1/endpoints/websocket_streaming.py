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
import uuid

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
    session_id = None
    
    try:
        # Connect to D-ID WebSocket (or test mode)
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
            "message": "WebSocket connected to D-ID" + (" (test mode)" if service.test_mode else "")
        }))
        
        # Listen for client messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle D-ID API responses
                if message.get("messageType") == "init-stream":
                    # D-ID sent us session_id and stream_id
                    session_id = message.get("session_id")
                    stream_id = message.get("id")
                    
                    await websocket.send_text(json.dumps({
                        "type": "stream_initialized",
                        "session_id": session_id,
                        "stream_id": stream_id,
                        "status": "ready",
                        "message": "Stream initialized by D-ID" + (" (test mode)" if service.test_mode else "")
                    }))
                    
                    # Update service with session_id
                    service.session_id = session_id
                    service.stream_id = stream_id
                    
                elif message.get("type") in ["init_stream", "text_to_speech", "speech_to_speech", "delete_stream"]:
                    # Handle client messages
                    await handle_client_message(service, message, websocket, session_id)
                
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

async def handle_client_message(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket, session_id: Optional[str]):
    """Handle incoming WebSocket messages from client"""
    message_type = message.get("type")
    
    try:
        if message_type == "init_stream":
            session_id = await handle_init_stream(service, message, websocket)
        elif message_type == "text_to_speech":
            await handle_text_to_speech(service, message, websocket, session_id)
        elif message_type == "speech_to_speech":
            await handle_speech_to_speech(service, message, websocket, session_id)
        elif message_type == "delete_stream":
            await handle_delete_stream(service, message, websocket, session_id)
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

async def handle_init_stream(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket) -> str:
    """Handle init_stream message - session_id comes from D-ID API"""
    source_url = message.get("source_url")
    presenter_type = message.get("presenter_type", "talk")
    
    if not source_url:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "source_url is required"
        }))
        return None
    
    try:
        # Initialize stream - session_id will come from D-ID API response
        await service.init_stream(source_url, presenter_type)
        
        await websocket.send_text(json.dumps({
            "type": "init_stream_sent",
            "message": "Stream initialization sent to D-ID"
        }))
        
        return None  # session_id will be set when we receive response from D-ID
        
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to initialize stream: {str(e)}"
        }))
        return None

async def handle_text_to_speech(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket, session_id: Optional[str]):
    """Handle text_to_speech message"""
    text = message.get("text", "")
    voice_id = message.get("voice_id", "en-US-JennyNeural")
    
    if not text:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "text is required"
        }))
        return
    
    if not session_id:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Stream not initialized. Send init_stream first."
        }))
        return
    
    try:
        await service.send_stream_text(text, voice_id, session_id)
        await websocket.send_text(json.dumps({
            "type": "text_sent",
            "message": "Text sent for processing"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send text: {str(e)}"
        }))

async def handle_speech_to_speech(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket, session_id: Optional[str]):
    """Handle speech_to_speech message"""
    audio_data = message.get("audio_data", "")
    voice_id = message.get("voice_id", "en-US-JennyNeural")
    
    if not audio_data:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "audio_data is required"
        }))
        return
    
    if not session_id:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Stream not initialized. Send init_stream first."
        }))
        return
    
    try:
        # Convert base64 audio data to bytes
        import base64
        audio_bytes = base64.b64decode(audio_data)
        await service.send_stream_audio(audio_bytes, session_id)
        await websocket.send_text(json.dumps({
            "type": "audio_sent",
            "message": "Audio sent for processing"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to send audio: {str(e)}"
        }))

async def handle_delete_stream(service: DIdWebSocketService, message: Dict[str, Any], websocket: WebSocket, session_id: Optional[str]):
    """Handle delete_stream message"""
    try:
        await service.delete_stream()
        await websocket.send_text(json.dumps({
            "type": "stream_deleted",
            "message": "Stream deleted successfully"
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
        # Generate session_id
        session_id = str(uuid.uuid4())
        
        return WebSocketStreamResponse(
            success=True,
            session_id=session_id,
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