"""
D-ID WebSocket Streaming Service
Implements WebSocket-based streaming with D-ID according to official documentation
"""

import asyncio
import json
import logging
import base64
from typing import Dict, Any, Optional, Callable
import websockets
from app.config import config

logger = logging.getLogger(__name__)

class DIdWebSocketService:
    """
    D-ID WebSocket Streaming Service
    
    Implements the WebSocket-based streaming protocol as shown in the official example.
    """
    
    def __init__(self):
        self.api_key = config.D_ID_API_KEY
        self.websocket_url = "wss://api.d-id.com/streams"
        self.ws = None
        self.stream_id = None
        self.session_id = None
        self.peer_connection = None
        self.is_connected = False
        self.on_message_callback = None
        self.on_connection_change = None
        
        if not self.api_key:
            raise ValueError("D-ID API key not configured")
    
    async def connect(self, on_message: Optional[Callable] = None, on_connection_change: Optional[Callable] = None):
        """
        Connect to D-ID WebSocket streaming service
        
        Args:
            on_message: Callback for WebSocket messages
            on_connection_change: Callback for connection state changes
        """
        try:
            self.on_message_callback = on_message
            self.on_connection_change = on_connection_change
            
            # Create WebSocket URL with authorization
            ws_url = f"{self.websocket_url}?authorization=Basic {self.api_key}"
            
            logger.info(f"Connecting to D-ID WebSocket: {self.websocket_url}")
            
            self.ws = await websockets.connect(ws_url)
            self.is_connected = True
            
            if self.on_connection_change:
                self.on_connection_change("connected")
            
            logger.info("WebSocket connected successfully")
            
            # Start listening for messages
            await self._listen_for_messages()
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            self.is_connected = False
            if self.on_connection_change:
                self.on_connection_change("failed")
            raise
    
    async def _listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    logger.debug(f"Received WebSocket message: {data}")
                    
                    if self.on_message_callback:
                        await self.on_message_callback(data)
                    
                    # Handle specific message types
                    await self._handle_message(data)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse WebSocket message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
            if self.on_connection_change:
                self.on_connection_change("closed")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.is_connected = False
            if self.on_connection_change:
                self.on_connection_change("error")
    
    async def _handle_message(self, data: Dict[str, Any]):
        """Handle specific WebSocket message types"""
        message_type = data.get("messageType")
        
        if message_type == "init-stream":
            await self._handle_init_stream(data)
        elif message_type == "sdp":
            await self._handle_sdp(data)
        elif message_type == "delete-stream":
            await self._handle_delete_stream(data)
        elif message_type == "stream/ready":
            await self._handle_stream_ready(data)
        elif message_type == "stream/started":
            await self._handle_stream_started(data)
        elif message_type == "stream/done":
            await self._handle_stream_done(data)
        elif message_type == "stream/error":
            await self._handle_stream_error(data)
    
    async def _handle_init_stream(self, data: Dict[str, Any]):
        """Handle init-stream message"""
        self.stream_id = data.get("id")
        self.session_id = data.get("session_id")
        offer = data.get("offer")
        ice_servers = data.get("ice_servers", [])
        
        logger.info(f"Stream initialized: {self.stream_id}, Session: {self.session_id}")
        
        # Here you would typically create RTCPeerConnection and send SDP answer
        # This is handled by the frontend in the official example
    
    async def _handle_sdp(self, data: Dict[str, Any]):
        """Handle SDP message"""
        logger.info("SDP message received")
    
    async def _handle_delete_stream(self, data: Dict[str, Any]):
        """Handle delete-stream message"""
        logger.info("Stream deleted")
        self.stream_id = None
        self.session_id = None
    
    async def _handle_stream_ready(self, data: Dict[str, Any]):
        """Handle stream/ready message"""
        logger.info("Stream ready")
    
    async def _handle_stream_started(self, data: Dict[str, Any]):
        """Handle stream/started message"""
        logger.info("Stream started")
    
    async def _handle_stream_done(self, data: Dict[str, Any]):
        """Handle stream/done message"""
        logger.info("Stream done")
    
    async def _handle_stream_error(self, data: Dict[str, Any]):
        """Handle stream/error message"""
        logger.error(f"Stream error: {data}")
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message to WebSocket"""
        if not self.ws or not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        try:
            message_str = json.dumps(message)
            await self.ws.send(message_str)
            logger.debug(f"Sent message: {message}")
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise
    
    async def init_stream(self, source_url: str, presenter_type: str = "talk"):
        """
        Initialize streaming session
        
        Args:
            source_url: URL of the avatar image
            presenter_type: Type of presenter (talk or clip)
        """
        message = {
            "type": "init-stream",
            "payload": {
                "source_url": source_url,
                "presenter_type": presenter_type
            }
        }
        
        await self.send_message(message)
        logger.info(f"Stream initialization requested for: {source_url}")
    
    async def send_sdp_answer(self, answer: str, session_id: str, presenter_type: str = "talk"):
        """
        Send SDP answer to establish WebRTC connection
        
        Args:
            answer: SDP answer from RTCPeerConnection
            session_id: Session ID from init-stream
            presenter_type: Type of presenter
        """
        message = {
            "type": "sdp",
            "payload": {
                "answer": answer,
                "session_id": session_id,
                "presenter_type": presenter_type
            }
        }
        
        await self.send_message(message)
        logger.info("SDP answer sent")
    
    async def send_ice_candidate(self, candidate: str, sdp_mid: str, sdp_m_line_index: int, session_id: str):
        """
        Send ICE candidate
        
        Args:
            candidate: ICE candidate string
            sdp_mid: SDP media ID
            sdp_m_line_index: SDP media line index
            session_id: Session ID
        """
        message = {
            "type": "ice",
            "payload": {
                "session_id": session_id,
                "candidate": candidate,
                "sdpMid": sdp_mid,
                "sdpMLineIndex": sdp_m_line_index
            }
        }
        
        await self.send_message(message)
        logger.debug("ICE candidate sent")
    
    async def send_stream_text(self, text: str, voice_id: str = "en-US-JennyNeural", index: int = 0):
        """
        Send text chunk for streaming
        
        Args:
            text: Text to stream
            voice_id: Voice ID for TTS
            index: Chunk index for ordering
        """
        if not self.stream_id or not self.session_id:
            raise ValueError("Stream not initialized")
        
        message = {
            "type": "stream-text",
            "payload": {
                "script": {
                    "type": "text",
                    "input": text,
                    "provider": {
                        "type": "microsoft",
                        "voice_id": voice_id
                    },
                    "ssml": True
                },
                "config": {
                    "stitch": True
                },
                "background": {
                    "color": "#FFFFFF"
                },
                "index": index,
                "session_id": self.session_id,
                "stream_id": self.stream_id,
                "presenter_type": "talk"
            }
        }
        
        await self.send_message(message)
        logger.debug(f"Text chunk sent: {text[:50]}...")
    
    async def send_stream_audio(self, audio_data: bytes, index: int = 0):
        """
        Send audio chunk for streaming
        
        Args:
            audio_data: Audio data in bytes
            index: Chunk index for ordering
        """
        if not self.stream_id or not self.session_id:
            raise ValueError("Stream not initialized")
        
        # Convert bytes to array for JSON serialization
        audio_array = list(audio_data)
        
        message = {
            "type": "stream-audio",
            "payload": {
                "script": {
                    "type": "audio",
                    "input": audio_array
                },
                "config": {
                    "stitch": True
                },
                "background": {
                    "color": "#FFFFFF"
                },
                "index": index,
                "session_id": self.session_id,
                "stream_id": self.stream_id,
                "presenter_type": "talk"
            }
        }
        
        await self.send_message(message)
        logger.debug(f"Audio chunk sent: {len(audio_data)} bytes")
    
    async def delete_stream(self):
        """Delete the current stream"""
        if not self.stream_id or not self.session_id:
            return
        
        message = {
            "type": "delete-stream",
            "payload": {
                "session_id": self.session_id,
                "stream_id": self.stream_id
            }
        }
        
        await self.send_message(message)
        logger.info("Stream deletion requested")
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        if self.ws:
            await self.ws.close()
            self.ws = None
            self.is_connected = False
            self.stream_id = None
            self.session_id = None
            
            if self.on_connection_change:
                self.on_connection_change("disconnected")
            
            logger.info("WebSocket disconnected")
    
    def is_stream_ready(self) -> bool:
        """Check if stream is ready"""
        return self.is_connected and self.stream_id is not None and self.session_id is not None 