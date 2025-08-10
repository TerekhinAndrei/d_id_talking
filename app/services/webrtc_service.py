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
                    
                    # Extract session cookies from response headers
                    session_cookies = []
                    set_cookie = response.headers.get("set-cookie", "")
                    logger.info(f"Set-Cookie header: {set_cookie}")
                    
                    # Extract AWSALB and AWSALBCORS cookies like in tests
                    import re
                    alb = re.search(r"AWSALB=([^;]+)", set_cookie)
                    cors = re.search(r"AWSALBCORS=([^;]+)", set_cookie)
                    
                    if alb:
                        session_cookies.append(f"AWSALB={alb.group(1)}")
                    if cors:
                        session_cookies.append(f"AWSALBCORS={cors.group(1)}")
                    
                    # Also check if session_id is in the JSON response
                    if data.get('session_id'):
                        session_id_from_json = data.get('session_id')
                        logger.info(f"Session ID from JSON: {session_id_from_json[:100]}...")
                        
                        # Extract just the cookie values from the session_id string
                        alb_match = re.search(r"AWSALB=([^;]+)", session_id_from_json)
                        cors_match = re.search(r"AWSALBCORS=([^;]+)", session_id_from_json)
                        
                        if alb_match:
                            session_cookies.append(f"AWSALB={alb_match.group(1)}")
                        if cors_match:
                            session_cookies.append(f"AWSALBCORS={cors_match.group(1)}")
                    
                    session_id = '; '.join(session_cookies) if session_cookies else None
                    
                    logger.info(f"Stream created successfully: {data.get('id')}")
                    logger.info(f"Full D-ID API response: {data}")
                    logger.info(f"Session cookies extracted: {session_cookies}")
                    
                    return {
                        'stream_id': data.get('id'),
                        'session_id': session_id,
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
                "answer": answer
            }
            
            # Add session cookies if provided
            headers = self.headers.copy()
            if session_id and session_id != "default_session":
                headers["Cookie"] = session_id
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    logger.info(f"WebRTC connection started for stream: {stream_id}")
                    logger.info(f"SDP payload sent: {payload}")
                    
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
                "sdpMLineIndex": int(sdp_m_line_index)
            }
            
            # Add session cookies if provided
            headers = self.headers.copy()
            if session_id and session_id != "default_session":
                headers["Cookie"] = session_id
            
            logger.info(f"=== ICE CANDIDATE DEBUG ===")
            logger.info(f"URL: {url}")
            logger.info(f"Headers: {headers}")
            logger.info(f"Payload: {payload}")
            logger.info(f"========================")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    logger.info(f"D-ID API Response Status: {response.status}")
                    logger.info(f"D-ID API Response Headers: {dict(response.headers)}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"D-ID API Error Response: {error_text}")
                        response.raise_for_status()
                    
                    data = await response.json()
                    logger.info(f"D-ID API Success Response: {data}")
                    
                    logger.info(f"ICE candidate submitted for stream: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error submitting ICE candidate: {e}")
            logger.error(f"Exception type: {type(e)}")
            raise
    
    async def create_talk_stream(self, stream_id: str, session_id: str, script: Dict[str, Any]) -> Dict[str, Any]:
        """
        Step 4: Create a talk stream
        POST /talks/streams/{stream_id}
        """
        try:
            url = f"{self.base_url}/talks/streams/{stream_id}"
            payload = {
                "script": script
            }
            
            # Add session cookies if provided
            headers = self.headers.copy()
            if session_id and session_id != "default_session":
                headers["Cookie"] = session_id
            
            logger.info(f"Creating talk stream for stream: {stream_id}")
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            logger.info(f"Request headers: {headers}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    logger.info(f"D-ID API Response Status: {response.status}")
                    logger.info(f"D-ID API Response Headers: {dict(response.headers)}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"D-ID API Error Response: {error_text}")
                        response.raise_for_status()
                    
                    data = await response.json()
                    logger.info(f"D-ID API Success Response: {data}")
                    
                    logger.info(f"Talk stream created for stream: {stream_id}")
                    return data
                    
        except Exception as e:
            logger.error(f"Error creating talk stream: {e}")
            logger.error(f"Exception type: {type(e)}")
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

    async def submit_sdp_answer(self, stream_id: str, sdp_answer: str, session_id: str = None) -> Dict[str, Any]:
        """
        Submit SDP answer to D-ID API
        This is a wrapper around start_webrtc_connection for the endpoint
        """
        try:
            # Create answer object from SDP string
            answer = {
                "type": "answer",
                "sdp": sdp_answer
            }
            
            # Use provided session_id or default
            if not session_id:
                session_id = "default_session"
            
            return await self.start_webrtc_connection(stream_id, session_id, answer)
            
        except Exception as e:
            logger.error(f"Error submitting SDP answer: {e}")
            raise

    async def submit_ice_candidate_simple(self, stream_id: str, candidate: str, sdp_mid: str, sdp_mline_index: int, session_id: str = None) -> Dict[str, Any]:
        """
        Submit ICE candidate to D-ID API (simplified version for endpoint)
        """
        try:
            # Use provided session_id or default
            if not session_id:
                session_id = "default_session"
            
            return await self.submit_ice_candidate(stream_id, session_id, candidate, sdp_mid, sdp_mline_index)
            
        except Exception as e:
            logger.error(f"Error submitting ICE candidate: {e}")
            raise

    async def create_talk_stream_simple(self, stream_id: str, text: str, voice_id: Optional[str] = None, session_id: str = None) -> Dict[str, Any]:
        """
        Create talk stream with text (simplified version for endpoint)
        """
        try:
            # Create script object from text - using format from tests
            script = {
                "type": "text",
                "input": text,
                "provider": {
                    "type": "microsoft",
                    "voice_id": voice_id or "en-US-JennyNeural"
                }
            }
            
            # Use provided session_id or default
            if not session_id:
                session_id = "default_session"
            
            return await self.create_talk_stream(stream_id, session_id, script)
            
        except Exception as e:
            logger.error(f"Error creating talk stream: {e}")
            raise 

    async def create_talk_stream_audio(self, stream_id: str, audio_url: str, voice_id: Optional[str] = None, session_id: str = None) -> Dict[str, Any]:
        """
        Create talk stream with audio (simplified version for endpoint)
        """
        try:
            # Create script object with audio - using format from D-ID API docs
            script = {
                "type": "audio",
                "audio_url": audio_url,
                "provider": {
                    "type": "microsoft",
                    "voice_id": voice_id or "en-US-JennyNeural"
                }
            }
            
            # Use provided session_id or default
            if not session_id:
                session_id = "default_session"
            
            return await self.create_talk_stream(stream_id, session_id, script)
            
        except Exception as e:
            logger.error(f"Error creating talk stream with audio: {e}")
            raise 