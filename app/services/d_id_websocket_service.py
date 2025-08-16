"""
D-ID WebSocket Service for real-time streaming
Based on D-ID WebSocket API documentation and test requirements
"""

import asyncio
import json
import base64
import logging
from typing import Optional, Callable, Dict, Any
import websockets
from app.core.config import settings as config

logger = logging.getLogger(__name__)

class DIdWebSocketService:
    """
    WebSocket service for D-ID real-time streaming
    Handles WebSocket connection, message sending, and event handling
    """
    
    def __init__(self):
        self.api_key = config.D_ID_API_KEY
        self.websocket_url = "wss://api.d-id.com/streams"
        self.is_connected = False
        self.websocket = None
        self.stream_id = None
        self.session_id = None
        self.on_message_callback = None
        self.on_connection_change_callback = None
        
        logger.info(f"WebSocket Service initialized with API key: {'Yes' if self.api_key else 'No'}")
    
    async def connect(self, on_message: Optional[Callable] = None, on_connection_change: Optional[Callable] = None):
        """
        Connect to D-ID WebSocket API
        
        Args:
            on_message: Callback for incoming messages
            on_connection_change: Callback for connection status changes
        """
        try:
            self.on_message_callback = on_message
            self.on_connection_change_callback = on_connection_change
            
            # Construct WebSocket URL with authorization
            ws_url = f"{self.websocket_url}?authorization=Basic {self.api_key}"
            
            logger.info(f"Connecting to WebSocket: {ws_url.replace(self.api_key, '***')}")
            
            # Connect to WebSocket
            self.websocket = await websockets.connect(ws_url)
            self.is_connected = True
            
            logger.info("WebSocket connection established")
            
            # Notify connection change
            if self.on_connection_change_callback:
                await self.on_connection_change_callback("connected")
            
            # Start listening for messages
            await self._listen_for_messages()
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            self.is_connected = False
            
            if self.on_connection_change_callback:
                await self.on_connection_change_callback("failed")
            
            raise
    
    async def _listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    logger.debug(f"Received WebSocket message: {data}")
                    
                    # Update stream_id and session_id if provided
                    if data.get("stream_id"):
                        self.stream_id = data["stream_id"]
                    if data.get("session_id"):
                        self.session_id = data["session_id"]
                    
                    # Call message callback
                    if self.on_message_callback:
                        await self.on_message_callback(data)
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse WebSocket message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
            
            if self.on_connection_change_callback:
                await self.on_connection_change_callback("disconnected")
    
    async def send_message(self, message: Dict[str, Any]):
        """Send a message to D-ID WebSocket API"""
        if not self.is_connected or not self.websocket:
            raise Exception("WebSocket not connected")
        
        try:
            message_json = json.dumps(message)
            await self.websocket.send(message_json)
            logger.debug(f"Sent WebSocket message: {message}")
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")
            raise
    
    async def init_stream(self, source_url: str, presenter_type: str = "talk"):
        """
        Initialize a new stream
        
        Args:
            source_url: URL of the presenter image
            presenter_type: Type of presenter (talk, audio, etc.)
        """
        message = {
            "type": "init_stream",
            "source_url": source_url,
            "presenter_type": presenter_type
        }
        
        await self.send_message(message)
        logger.info(f"Stream initialized with source: {source_url}")
    
    async def send_stream_text(self, text: str, voice_id: str, index: int = 0):
        """
        Send text for streaming
        
        Args:
            text: Text to speak
            voice_id: Voice ID to use
            index: Message index
        """
        message = {
            "type": "stream_text",
            "text": text,
            "voice_id": voice_id,
            "index": index
        }
        
        await self.send_message(message)
        logger.info(f"Text sent for streaming: {text[:50]}...")
    
    async def send_stream_audio(self, audio_data: bytes, index: int = 0):
        """
        Send audio for streaming
        
        Args:
            audio_data: Raw audio data
            index: Message index
        """
        # Encode audio data as base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        message = {
            "type": "stream_audio",
            "audio": audio_base64,
            "index": index
        }
        
        await self.send_message(message)
        logger.info(f"Audio sent for streaming: {len(audio_data)} bytes")
    
    async def send_sdp_answer(self, sdp_answer: str, session_id: str):
        """
        Send SDP answer
        
        Args:
            sdp_answer: SDP answer string
            session_id: Session ID
        """
        message = {
            "type": "sdp",
            "answer": sdp_answer,
            "session_id": session_id
        }
        
        await self.send_message(message)
        logger.info("SDP answer sent")
    
    async def send_ice_candidate(self, candidate: str, sdp_mid: str, sdp_mline_index: int, session_id: str):
        """
        Send ICE candidate
        
        Args:
            candidate: ICE candidate string
            sdp_mid: SDP media ID
            sdp_mline_index: SDP media line index
            session_id: Session ID
        """
        message = {
            "type": "ice",
            "candidate": candidate,
            "sdpMid": sdp_mid,
            "sdpMLineIndex": sdp_mline_index,
            "session_id": session_id
        }
        
        await self.send_message(message)
        logger.debug("ICE candidate sent")
    
    async def delete_stream(self):
        """Delete the current stream"""
        if not self.stream_id:
            logger.warning("No stream to delete")
            return
        
        message = {
            "type": "delete_stream",
            "stream_id": self.stream_id
        }
        
        await self.send_message(message)
        logger.info(f"Stream deletion requested: {self.stream_id}")
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            self.websocket = None
            logger.info("WebSocket disconnected")
