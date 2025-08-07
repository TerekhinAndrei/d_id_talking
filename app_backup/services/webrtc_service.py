import asyncio
import json
import logging
from typing import Dict, Optional, Any
import aiohttp
from app.core.config import settings as config

logger = logging.getLogger(__name__)

class WebRTCService:
    """
    Service for handling D-ID WebRTC streaming functionality.
    Based on D-ID Talks Streams API documentation.
    """
    
    def __init__(self):
        self.base_url = config.D_ID_BASE_URL
        self.api_key = config.D_ID_API_KEY
        self.headers = config.get_d_id_headers()
        
        # Log configuration for debugging
        logger.info(f"WebRTC Service initialized with base URL: {self.base_url}")
        logger.info(f"API Key configured: {'Yes' if self.api_key else 'No'}")
    
    async def create_stream(self, source_url: str) -> Dict[str, Any]:
        """
        Step 1: Create a new stream
        POST /talks/streams
        """
        try:
            url = f"{self.base_url}/talks/streams"
            payload = {
                "source_url": source_url
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"Stream created successfully: {data.get('id')}")
                    return {
                        'stream_id': data.get('id'),
                        'session_id': data.get('session_id'),
                        'offer': data.get('offer'),
                        'ice_servers': data.get('ice_servers', [])
                    }
                    
        except Exception as e:
            logger.error(f"Error creating stream: {e}")
            logger.error(f"Request URL: {url}")
            logger.error(f"Request payload: {payload}")
            logger.error(f"Headers: {self.headers}")
            raise
    
    async def start_webrtc_connection(self, stream_id: str, session_id: str, answer: Dict[str, Any]) -> Dict[str, Any]:
        """
        Step 2: Start a WebRTC connection
        POST /talks/streams/{stream_id}/sdp
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}/sdp"
            payload = {
                "answer": answer,
                "session_id": session_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"WebRTC connection started for stream: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error starting WebRTC connection: {e}")
            raise
    
    async def submit_ice_candidate(self, stream_id: str, session_id: str, candidate: str, sdp_mid: str, sdp_m_line_index: int) -> Dict[str, Any]:
        """
        Step 3: Submit network information (ICE candidates)
        POST /talks/streams/{stream_id}/ice
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}/ice"
            payload = {
                "candidate": candidate,
                "sdpMid": sdp_mid,
                "sdpMLineIndex": sdp_m_line_index,
                "session_id": session_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"ICE candidate submitted for stream: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error submitting ICE candidate: {e}")
            raise
    
    async def create_talk_stream(self, stream_id: str, session_id: str, script: Dict[str, Any], driver_url: str = "bank://lively/", config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Step 4: Create a talk stream
        POST /talks/streams/{stream_id}
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}"
            payload = {
                "script": script,
                "driver_url": driver_url,
                "config": config or {"stitch": True},
                "session_id": session_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"Talk stream created for stream: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error creating talk stream: {e}")
            raise
    
    async def delete_stream(self, stream_id: str, session_id: str) -> Dict[str, Any]:
        """
        Step 5: Delete a stream
        DELETE /talks/streams/{stream_id}
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}"
            payload = {
                "session_id": session_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"Stream deleted: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error deleting stream: {e}")
            raise
    
    async def create_audio_script(self, audio_url: str, type: str = "audio") -> Dict[str, Any]:
        """
        Helper method to create an audio script for streaming
        """
        return {
            "type": type,
            "audio_url": audio_url
        }
    
    async def get_stream_status(self, stream_id: str) -> Dict[str, Any]:
        """
        Get the status of a stream
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"Stream status retrieved for: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error getting stream status: {e}")
            raise 