"""
D-ID Live Streaming Service
Specialized service for D-ID Live Streaming API with comprehensive error handling
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
import aiohttp
from app.core.config import settings as config

logger = logging.getLogger(__name__)

# Custom Exception Hierarchy
class DIdStreamingError(Exception):
    """Base exception for D-ID streaming errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)

class DIdConnectionError(DIdStreamingError):
    """Exception for connection-related errors"""
    pass

class DIdAuthenticationError(DIdStreamingError):
    """Exception for authentication errors"""
    pass

class DIdStreamCreationError(DIdStreamingError):
    """Exception for stream creation errors"""
    pass

class DIdStreamOperationError(DIdStreamingError):
    """Exception for stream operation errors"""
    pass

class DIdResourceError(DIdStreamingError):
    """Exception for resource-related errors"""
    pass

@dataclass
class StreamSession:
    """Data class for stream session information"""
    stream_id: str
    session_id: str
    sdp_offer: str
    ice_servers: list
    image_url: str
    voice_id: str
    created_at: str = ""
    status: str = "created"

@dataclass
class StreamResponse:
    """Data class for stream operation responses"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: Optional[int] = None
    stream_id: Optional[str] = None
    message: Optional[str] = None

class DIdStreamingService:
    """
    D-ID Live Streaming Service
    
    This service encapsulates all logic for interacting with D-ID Live Streaming API.
    Provides comprehensive error handling and session management.
    """
    
    _instance = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
            
        self.base_url = config.D_ID_BASE_URL
        self.api_key = config.D_ID_API_KEY
        self.headers = config.get_d_id_headers()
        self.session: Optional[aiohttp.ClientSession] = None
        self.active_sessions: Dict[str, StreamSession] = {}
        
        # Validate configuration
        if not self.api_key:
            raise DIdAuthenticationError("D-ID API key not configured")
        
        self._initialized = True
        logger.info(f"D-ID Streaming Service initialized with base URL: {self.base_url}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _create_session_if_needed(self) -> aiohttp.ClientSession:
        """Create aiohttp session if not exists"""
        if not self.session or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        expected_status: int = 200
    ) -> StreamResponse:
        """
        Make HTTP request to D-ID API with error handling
        
        Args:
            method: HTTP method (GET, POST, DELETE)
            endpoint: API endpoint
            data: Request data
            expected_status: Expected HTTP status code
            
        Returns:
            StreamResponse with result data
        """
        session = self._create_session_if_needed()
        url = f"{self.base_url}{endpoint}"
        
        try:
            logger.debug(f"Making {method} request to {url}")
            if data:
                logger.debug(f"Request data: {json.dumps(data, indent=2)}")
            
            async with session.request(method, url, json=data, headers=self.headers) as response:
                response_text = await response.text()
                
                logger.debug(f"Response status: {response.status}")
                logger.debug(f"Response body: {response_text}")
                
                if response.status == expected_status:
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                        return StreamResponse(
                            success=True,
                            data=response_data,
                            status_code=response.status
                        )
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON response: {e}")
                        return StreamResponse(
                            success=False,
                            error=f"Invalid JSON response: {e}",
                            status_code=response.status
                        )
                else:
                    # Handle specific error cases
                    error_message = self._parse_error_response(response.status, response_text)
                    return StreamResponse(
                        success=False,
                        error=error_message,
                        status_code=response.status
                    )
                    
        except aiohttp.ClientConnectorError as e:
            error_msg = f"Connection error: {e}"
            logger.error(error_msg)
            raise DIdConnectionError(error_msg)
        except aiohttp.ClientTimeout as e:
            error_msg = f"Request timeout: {e}"
            logger.error(error_msg)
            raise DIdConnectionError(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {e}"
            logger.error(error_msg)
            raise DIdStreamingError(error_msg)
    
    def _parse_error_response(self, status_code: int, response_text: str) -> str:
        """Parse error response and return meaningful error message"""
        try:
            error_data = json.loads(response_text)
            
            # Handle specific D-ID error types
            if status_code == 401:
                return "Authentication failed. Please check your D-ID API key."
            elif status_code == 403:
                return "Access denied. Your account may not have streaming permissions."
            elif status_code == 451:
                if "CelebrityDetectedError" in response_text:
                    return "Celebrity detected in image. Please use a different image."
                else:
                    return "Content not allowed for legal reasons."
            elif status_code == 500:
                return "D-ID server error. Streaming service may be unavailable."
            elif status_code == 422:
                return f"Invalid request: {error_data.get('message', 'Validation error')}"
            else:
                return error_data.get('message', f"HTTP {status_code} error")
                
        except json.JSONDecodeError:
            return f"HTTP {status_code} error: {response_text}"
    
    async def create_stream_session(self, image_url: str) -> StreamSession:
        """
        Create a new streaming session
        
        Args:
            image_url: Public URL of the image to animate
            
        Returns:
            StreamSession with session information
            
        Raises:
            DIdStreamCreationError: If stream creation fails
            DIdAuthenticationError: If authentication fails
            DIdConnectionError: If connection fails
        """
        logger.info(f"Creating stream session for image: {image_url}")
        
        try:
            # Validate image URL
            if not image_url or not image_url.startswith(('http://', 'https://')):
                raise DIdStreamCreationError("Invalid image URL provided")
            
            # Make request to create stream
            response = await self._make_request(
                method="POST",
                endpoint="/talks/streams",
                data={"source_url": image_url}
            )
            
            if not response.success:
                if response.status_code == 401:
                    raise DIdAuthenticationError(response.error)
                elif response.status_code == 451:
                    raise DIdStreamCreationError(response.error)
                elif response.status_code == 500:
                    raise DIdStreamCreationError("Streaming service unavailable. Check your D-ID account permissions.")
                else:
                    raise DIdStreamCreationError(response.error)
            
            # Parse response data
            data = response.data
            if not data or 'id' not in data:
                raise DIdStreamCreationError("Invalid response format from D-ID API")
            
            # Create session object
            session = StreamSession(
                stream_id=data['id'],
                session_id=data.get('session_id', ''),
                sdp_offer=data.get('offer', ''),
                ice_servers=data.get('ice_servers', []),
                created_at=data.get('created_at', ''),
                status='created'
            )
            
            # Store active session
            self.active_sessions[session.stream_id] = session
            
            logger.info(f"Stream session created successfully: {session.stream_id}")
            return session
            
        except (DIdAuthenticationError, DIdStreamCreationError, DIdConnectionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating stream session: {e}")
            raise DIdStreamCreationError(f"Failed to create stream session: {e}")
    
    async def start_stream(
        self, 
        stream_id: str, 
        session_id: str, 
        sdp_answer: str
    ) -> StreamResponse:
        """
        Start WebRTC stream with SDP answer
        
        Args:
            stream_id: Stream ID from create_stream_session
            session_id: Session ID from create_stream_session
            sdp_answer: SDP answer from frontend WebRTC
            
        Returns:
            StreamResponse with operation result
            
        Raises:
            DIdStreamOperationError: If stream start fails
            DIdConnectionError: If connection fails
        """
        logger.info(f"Starting stream: {stream_id}")
        
        try:
            # Validate parameters
            if not stream_id or not session_id or not sdp_answer:
                raise DIdStreamOperationError("Missing required parameters for stream start")
            
            # Make request to start stream
            response = await self._make_request(
                method="POST",
                endpoint=f"/talks/streams/{stream_id}/sdp",
                data={
                    "answer": sdp_answer,
                    "session_id": session_id
                }
            )
            
            if not response.success:
                if response.status_code == 404:
                    raise DIdStreamOperationError("Stream not found. Session may have expired.")
                elif response.status_code == 422:
                    raise DIdStreamOperationError("Invalid SDP answer format.")
                else:
                    raise DIdStreamOperationError(response.error)
            
            # Update session status
            if stream_id in self.active_sessions:
                self.active_sessions[stream_id].status = 'started'
            
            logger.info(f"Stream started successfully: {stream_id}")
            return response
            
        except (DIdStreamOperationError, DIdConnectionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error starting stream: {e}")
            raise DIdStreamOperationError(f"Failed to start stream: {e}")
    
    async def submit_ice_candidate(
        self, 
        stream_id: str, 
        session_id: str, 
        candidate: str, 
        sdp_mid: str, 
        sdp_m_line_index: int
    ) -> StreamResponse:
        """
        Submit ICE candidate for WebRTC connection
        
        Args:
            stream_id: Stream ID
            session_id: Session ID
            candidate: ICE candidate string
            sdp_mid: SDP media ID
            sdp_m_line_index: SDP media line index
            
        Returns:
            StreamResponse with operation result
        """
        logger.debug(f"Submitting ICE candidate for stream: {stream_id}")
        
        try:
            session = self._create_session_if_needed()
            url = f"{self.base_url}/talks/streams/{stream_id}/ice"
            
            payload = {
                "candidate": candidate,
                "sdpMid": sdp_mid,
                "sdpMLineIndex": sdp_m_line_index,
                "session_id": session_id
            }
            
            logger.debug(f"Making POST request to {url}")
            logger.debug(f"Request data: {json.dumps(payload, indent=2)}")
            
            async with session.post(url, json=payload, headers=self.headers) as response:
                response_text = await response.text()
                
                logger.debug(f"Response status: {response.status}")
                logger.debug(f"Response body: {response_text}")
                
                # ICE candidate submission can return 200, 201, or other success codes
                if response.status in [200, 201]:
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                        logger.info(f"ICE candidate submitted successfully: {stream_id}")
                        return StreamResponse(
                            success=True,
                            data=response_data,
                            status_code=response.status
                        )
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON response: {e}")
                        return StreamResponse(
                            success=False,
                            error=f"Invalid JSON response: {e}",
                            status_code=response.status
                        )
                else:
                    # Handle error cases
                    error_message = self._parse_error_response(response.status, response_text)
                    logger.warning(f"ICE candidate submission failed: {error_message}")
                    return StreamResponse(
                        success=False,
                        error=error_message,
                        status_code=response.status
                    )
                    
        except aiohttp.ClientConnectorError as e:
            error_msg = f"Connection error: {e}"
            logger.error(error_msg)
            return StreamResponse(success=False, error=error_msg)
        except aiohttp.ClientTimeout as e:
            error_msg = f"Request timeout: {e}"
            logger.error(error_msg)
            return StreamResponse(success=False, error=error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {e}"
            logger.error(error_msg)
            return StreamResponse(success=False, error=error_msg)
    
    async def create_talk_stream(
        self, 
        stream_id: str, 
        session_id: str, 
        script: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        audio_optimization: Optional[str] = "2",
        result_url: Optional[str] = None
    ) -> StreamResponse:
        """
        Create talk stream with text-to-speech
        
        Args:
            stream_id: Stream ID
            session_id: Session ID
            script: Script configuration with text and provider
            config: Additional configuration
            audio_optimization: Audio optimization level
            result_url: Result URL for the output
            
        Returns:
            StreamResponse with operation result
        """
        logger.info(f"Creating talk stream: {stream_id}")
        
        try:
            payload = {
                "script": script,
                "session_id": session_id,
                "audio_optimization": audio_optimization
            }
            
            if config:
                payload["config"] = config
            else:
                payload["config"] = {
                    "fluent": "false",
                    "pad_audio": "0.0",
                    "auto_match": True,
                    "result_format": "mp4"
                }
            
            if result_url:
                payload["result_url"] = result_url
            
            logger.debug(f"Talk stream payload: {json.dumps(payload, indent=2)}")
            
            response = await self._make_request(
                method="POST",
                endpoint=f"/talks/streams/{stream_id}",
                data=payload
            )
            
            if not response.success:
                raise DIdStreamOperationError(response.error)
            
            # Update session status
            if stream_id in self.active_sessions:
                self.active_sessions[stream_id].status = 'talking'
            
            logger.info(f"Talk stream created successfully: {stream_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error creating talk stream: {e}")
            raise DIdStreamOperationError(f"Failed to create talk stream: {e}")
    
    async def close_stream_session(self, stream_id: str, session_id: str) -> StreamResponse:
        """
        Close stream session and free resources
        
        Args:
            stream_id: Stream ID to close
            session_id: Session ID for the stream
            
        Returns:
            StreamResponse with operation result
        """
        logger.info(f"Closing stream session: {stream_id}")
        
        try:
            payload = {
                "session_id": session_id
            }
            
            logger.debug(f"Delete stream payload: {json.dumps(payload, indent=2)}")
            
            response = await self._make_request(
                method="DELETE",
                endpoint=f"/talks/streams/{stream_id}",
                data=payload
            )
            
            # Remove from active sessions
            if stream_id in self.active_sessions:
                del self.active_sessions[stream_id]
            
            if not response.success:
                logger.warning(f"Stream cleanup failed: {response.error}")
            else:
                logger.info(f"Stream session closed successfully: {stream_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error closing stream session: {e}")
            return StreamResponse(
                success=False,
                error=f"Failed to close stream session: {e}"
            )
    
    async def get_stream_status(self, stream_id: str) -> StreamResponse:
        """
        Get current stream status
        
        Args:
            stream_id: Stream ID to check
            
        Returns:
            StreamResponse with status information
        """
        logger.debug(f"Getting stream status: {stream_id}")
        
        try:
            response = await self._make_request(
                method="GET",
                endpoint=f"/talks/streams/{stream_id}"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting stream status: {e}")
            return StreamResponse(
                success=False,
                error=f"Failed to get stream status: {e}"
            )
    
    def get_active_sessions(self) -> Dict[str, StreamSession]:
        """Get all active sessions"""
        return self.active_sessions.copy()
    
    def get_session(self, stream_id: str) -> Optional[StreamSession]:
        """Get specific session by stream ID"""
        return self.active_sessions.get(stream_id)
    
    async def cleanup_all_sessions(self):
        """Clean up all active sessions"""
        logger.info("Cleaning up all active sessions")
        
        for stream_id in list(self.active_sessions.keys()):
            try:
                await self.close_stream_session(stream_id)
            except Exception as e:
                logger.error(f"Error cleaning up session {stream_id}: {e}")
    
    async def health_check(self) -> bool:
        """Check if D-ID API is accessible"""
        try:
            response = await self._make_request(
                method="GET",
                endpoint="/talks"
            )
            return response.success
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False 

    async def get_sdp_offer(self, session_id: str) -> StreamResponse:
        """
        Get SDP offer from D-ID API using session_id.
        
        Args:
            session_id: The session ID from create_webrtc_session
            
        Returns:
            StreamResponse with SDP offer data
            
        Raises:
            DIdConnectionError: If SDP retrieval fails
            DIdAuthenticationError: If authentication fails
        """
        try:
            logger.info(f"Getting SDP offer for session: {session_id}")
            
            session = self._create_session_if_needed()
            async with session.get(
                f"{self.base_url}/talks/streams/{session_id}/sdp",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"SDP offer retrieved successfully for session: {session_id}")
                    
                    return StreamResponse(
                        success=True,
                        data=data,
                        status_code=response.status,
                        message="SDP offer retrieved successfully"
                    )
                else:
                    error_msg = self._parse_error_response(response.status, await response.text())
                    logger.error(f"Failed to get SDP offer: {response.status} - {error_msg}")
                    raise DIdConnectionError(f"SDP retrieval failed: {error_msg}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during SDP retrieval: {e}")
            raise DIdConnectionError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during SDP retrieval: {e}")
            raise DIdStreamingError(f"Unexpected error: {str(e)}")

    async def create_webrtc_session(self, image_url: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> StreamSession:
        """
        Create a new WebRTC streaming session with D-ID.
        
        Args:
            image_url: Public URL of the image to use for the avatar
            voice_id: D-ID voice ID (default: Rachel voice)
            
        Returns:
            StreamSession with stream_id, session_id, and SDP offer
            
        Raises:
            DIdStreamCreationError: If session creation fails
            DIdAuthenticationError: If authentication fails
        """
        try:
            # Prepare the request payload according to D-ID documentation
            payload = {
                "stream_warmup": "false",
                "source_url": image_url
            }
            
            logger.info(f"Creating WebRTC session with image: {image_url}")
            logger.info(f"Using voice ID: {voice_id}")
            
            session = self._create_session_if_needed()
            async with session.post(
                f"{self.base_url}/talks/streams",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    logger.info(f"WebRTC session created successfully: {data.get('id')}")
                    
                    # Extract session details according to real response format
                    stream_id = data.get('id')
                    session_id = data.get('session_id')
                    offer_data = data.get('offer', {})
                    sdp_offer = offer_data.get('sdp') if offer_data else None
                    ice_servers = data.get('ice_servers', [])
                    
                    if not all([stream_id, session_id, sdp_offer]):
                        raise DIdStreamCreationError("Invalid response: missing required fields")
                    
                    # Create and store session
                    stream_session = StreamSession(
                        stream_id=stream_id,
                        session_id=session_id,
                        sdp_offer=sdp_offer,
                        ice_servers=ice_servers,
                        image_url=image_url,
                        voice_id=voice_id,
                        status="created"
                    )
                    
                    self.active_sessions[stream_id] = stream_session
                    logger.info(f"Session stored: {stream_id}")
                    
                    return stream_session
                else:
                    error_msg = self._parse_error_response(response.status, await response.text())
                    logger.error(f"Failed to create WebRTC session: {response.status} - {error_msg}")
                    raise DIdStreamCreationError(f"Session creation failed: {error_msg}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during WebRTC session creation: {e}")
            raise DIdConnectionError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during WebRTC session creation: {e}")
            raise DIdStreamingError(f"Unexpected error: {str(e)}")

    async def submit_webrtc_answer(self, stream_id: str, sdp_answer: str) -> StreamResponse:
        """
        Submit SDP answer to establish WebRTC connection.
        
        Args:
            stream_id: The stream ID from create_webrtc_session
            sdp_answer: SDP answer from the client
            
        Returns:
            StreamResponse with connection status
            
        Raises:
            DIdConnectionError: If connection establishment fails
        """
        try:
            if stream_id not in self.active_sessions:
                raise DIdConnectionError(f"Stream {stream_id} not found")
            
            session = self.active_sessions[stream_id]
            payload = {
                "answer": {
                    "type": "answer",
                    "sdp": sdp_answer
                },
                "session_id": session.session_id
            }
            
            logger.info(f"Submitting SDP answer for stream: {stream_id}")
            
            client_session = self._create_session_if_needed()
            async with client_session.post(
                f"{self.base_url}/talks/streams/{stream_id}/sdp",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    session.status = "connected"
                    logger.info(f"WebRTC connection established for stream: {stream_id}")
                    
                    return StreamResponse(
                        success=True,
                        message="WebRTC connection established"
                    )
                else:
                    error_msg = self._parse_error_response(response.status, await response.text())
                    logger.error(f"Failed to establish WebRTC connection: {response.status} - {error_msg}")
                    raise DIdConnectionError(f"Connection establishment failed: {error_msg}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during SDP answer submission: {e}")
            raise DIdConnectionError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during SDP answer submission: {e}")
            raise DIdStreamingError(f"Unexpected error: {str(e)}")

    async def submit_webrtc_answer_direct(self, answer: Dict[str, Any], session_id: str) -> StreamResponse:
        """
        Submit SDP answer directly to D-ID without stream_id lookup.
        
        Args:
            answer: SDP answer object with type and sdp
            session_id: Session ID from the stream creation
            
        Returns:
            StreamResponse with connection status
        """
        try:
            # Find stream by session_id
            stream_id = None
            logger.debug(f"Looking for stream with session_id: {session_id}")
            logger.debug(f"Active sessions: {list(self.active_sessions.keys())}")
            
            for sid, session in self.active_sessions.items():
                logger.debug(f"Checking session {sid}: {session.session_id}")
                if session.session_id == session_id:
                    stream_id = sid
                    logger.debug(f"Found stream_id: {stream_id}")
                    break
            
            if not stream_id:
                logger.error(f"Stream not found for session: {session_id}")
                logger.error(f"Available sessions: {[(sid, session.session_id) for sid, session in self.active_sessions.items()]}")
                return StreamResponse(success=False, error=f"Stream not found for session: {session_id}")
            
            payload = {
                "answer": answer,
                "session_id": session_id
            }
            
            logger.info(f"Submitting SDP answer directly for session: {session_id}")
            
            client_session = self._create_session_if_needed()
            async with client_session.post(
                f"{self.base_url}/talks/streams/{stream_id}/sdp",
                headers=self.headers,
                json=payload
            ) as response:
                response_text = await response.text()
                logger.debug(f"Response status: {response.status}")
                logger.debug(f"Response body: {response_text}")
                
                if response.status in [200, 201]:
                    logger.info(f"WebRTC connection established for session: {session_id}")
                    return StreamResponse(
                        success=True,
                        message="WebRTC connection established"
                    )
                else:
                    error_msg = self._parse_error_response(response.status, response_text)
                    logger.error(f"Failed to establish WebRTC connection: {response.status} - {error_msg}")
                    return StreamResponse(
                        success=False,
                        error=f"Connection establishment failed: {error_msg}"
                    )
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during SDP answer submission: {e}")
            return StreamResponse(success=False, error=f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during SDP answer submission: {e}")
            return StreamResponse(success=False, error=f"Unexpected error: {str(e)}")

    async def send_audio_chunk(self, stream_id: str, audio_data: bytes) -> StreamResponse:
        """
        Send audio chunk to D-ID for real-time processing.
        
        Args:
            stream_id: The stream ID
            audio_data: Audio data in bytes
            
        Returns:
            StreamResponse with processing status
        """
        try:
            if stream_id not in self.active_sessions:
                raise DIdConnectionError(f"Stream {stream_id} not found")
            
            session = self.active_sessions[stream_id]
            if session.status != "connected":
                raise DIdConnectionError(f"Stream {stream_id} not connected")
            
            # Prepare audio data for D-ID
            headers = self.headers.copy()
            headers['Content-Type'] = 'audio/wav'  # Adjust based on audio format
            
            client_session = self._create_session_if_needed()
            async with client_session.post(
                f"{self.base_url}/talks/streams/{stream_id}/audio",
                headers=headers,
                data=audio_data
            ) as response:
                if response.status == 200:
                    logger.debug(f"Audio chunk sent successfully to stream: {stream_id}")
                    return StreamResponse(
                        success=True,
                        stream_id=stream_id,
                        message="Audio chunk processed"
                    )
                else:
                    error_msg = self._parse_error_response(response.status, await response.text())
                    logger.error(f"Failed to send audio chunk: {response.status} - {error_msg}")
                    raise DIdConnectionError(f"Audio processing failed: {error_msg}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error during audio chunk sending: {e}")
            raise DIdConnectionError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during audio chunk sending: {e}")
            raise DIdStreamingError(f"Unexpected error: {str(e)}") 