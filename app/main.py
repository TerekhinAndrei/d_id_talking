"""
Refactored main application following SOLID principles
PROTECTION REMOVED - ALL CHANGES ALLOWED
"""

import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from fastapi import WebSocket, WebSocketDisconnect
import uvicorn
import json
import asyncio
import logging

from app.core.config import settings as config
from app.core.factory import get_service_container, ServiceContainer
from app.core.base import ConfigurationProvider
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)
logger = logging.getLogger(__name__)


class ApplicationManager:
    """
    Application manager following SOLID principles:
    - Single Responsibility: Manages application lifecycle
    - Open/Closed: Extensible through composition
    - Liskov Substitution: Uses interfaces
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self):
        self.app: Optional[FastAPI] = None
        self.service_container: Optional[ServiceContainer] = None
        self.config_provider: Optional[ConfigurationProvider] = None
    
    def create_application(self) -> FastAPI:
        """Create FastAPI application with all middleware and routes"""
        self.config_provider = ConfigurationProvider(config)
        
        self.app = FastAPI(
            title=config.PROJECT_NAME,
            version=config.VERSION,
            description="Refactored FastAPI Backend API following SOLID principles",
            openapi_url=f"{config.API_V1_STR}/openapi.json",
            lifespan=self._lifespan,
        )
        
        self._setup_middleware()
        self._setup_routes()
        self._setup_websocket_endpoints()
        
        return self.app
    
    def _setup_middleware(self):
        """Setup application middleware"""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=config.ALLOWED_HOSTS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Trusted host middleware - only in development
        if config.ENVIRONMENT == "development":
            self.app.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=config.ALLOWED_HOSTS,
            )
    
    def _setup_routes(self):
        """Setup application routes"""
        # Include API router with proper prefixes
        self.app.include_router(api_router, prefix=config.API_V1_STR)
        
        # Root endpoint that redirects to docs
        @self.app.get("/")
        async def root():
            return RedirectResponse(url="/docs")
    
    def _setup_websocket_endpoints(self):
        """Setup WebSocket endpoints"""
        self._setup_test_websocket()
        self._setup_simple_stream_websocket()
        self._setup_stream_websocket()
    
    def _setup_test_websocket(self):
        """Setup test WebSocket endpoint"""
        @self.app.websocket("/ws/test")
        async def websocket_test_endpoint(websocket: WebSocket):
            """Simple test WebSocket endpoint"""
            await websocket.accept()
            logger.info("🔌 Test WebSocket connection accepted")
            
            try:
                await websocket.send_text(json.dumps({
                    "type": "connection_status", 
                    "status": "connected",
                    "message": "Test WebSocket connected"
                }))
                
                # Listen for client messages
                while True:
                    try:
                        data = await websocket.receive_text()
                        message = json.loads(data)
                        logger.info(f"📨 Received test message: {message}")
                        
                        await websocket.send_text(json.dumps({
                            "type": "test_response",
                            "message": "Test message received",
                            "data": message
                        }))
                        
                    except WebSocketDisconnect:
                        logger.info("Test WebSocket client disconnected")
                        break
                    except Exception as e:
                        logger.error(f"Test WebSocket error: {e}")
                        break
            
            except Exception as e:
                logger.error(f"❌ Test WebSocket error: {e}")
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Test connection failed: {str(e)}"
                    }))
                except:
                    pass  # WebSocket already closed
            finally:
                try:
                    await websocket.close()
                except:
                    pass  # WebSocket already closed
    
    def _setup_simple_stream_websocket(self):
        """Setup simple streaming WebSocket endpoint"""
        @self.app.websocket("/ws/stream-simple")
        async def websocket_stream_simple_endpoint(websocket: WebSocket):
            """Simple streaming WebSocket endpoint without D-ID service"""
            await websocket.accept()
            logger.info("🔌 Simple Stream WebSocket connection accepted")
            
            try:
                await websocket.send_text(json.dumps({
                    "type": "connection_status", 
                    "status": "connected",
                    "message": "Simple Stream WebSocket connected (test mode)"
                }))
                
                # Listen for client messages
                while True:
                    try:
                        data = await websocket.receive_text()
                        message = json.loads(data)
                        logger.info(f"📨 Received client message: {message}")
                        
                        message_type = message.get("type")
                        
                        if message_type == "init_stream":
                            # Simulate stream initialization
                            import uuid
                            session_id = f"test-session-{uuid.uuid4().hex[:8]}"
                            stream_id = f"test-stream-{uuid.uuid4().hex[:8]}"
                            
                            await websocket.send_text(json.dumps({
                                "type": "stream_initialized",
                                "session_id": session_id,
                                "stream_id": stream_id,
                                "status": "ready",
                                "message": "Stream initialized (test mode)"
                            }))
                            
                        elif message_type == "text_to_speech":
                            # Simulate text-to-speech
                            text = message.get("text", "")
                            voice_id = message.get("voice_id", "en-US-JennyNeural")
                            
                            await websocket.send_text(json.dumps({
                                "type": "text_to_speech_sent",
                                "message": "Text sent for processing (test mode)"
                            }))
                            
                            # Simulate audio response
                            await asyncio.sleep(1)
                            await websocket.send_text(json.dumps({
                                "type": "audio_data",
                                "data": "dGVzdC1hdWRpby1kYXRh",  # base64 encoded "test-audio-data"
                                "timestamp": "2024-01-15T10:30:00Z"
                            }))
                            
                        elif message_type == "speech_to_speech":
                            # Simulate speech-to-speech
                            audio_data = message.get("audio_data", "")
                            
                            await websocket.send_text(json.dumps({
                                "type": "speech_to_speech_sent",
                                "message": "Audio sent for processing (test mode)"
                            }))
                            
                            # Simulate processed audio response
                            await asyncio.sleep(1)
                            await websocket.send_text(json.dumps({
                                "type": "audio_data",
                                "data": "dGVzdC1wcm9jZXNzZWQtYXVkaW8tZGF0YQ==",  # base64 encoded "test-processed-audio-data"
                                "timestamp": "2024-01-15T10:30:00Z"
                            }))
                            
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": f"Unknown message type: {message_type}"
                            }))
                        
                    except WebSocketDisconnect:
                        logger.info("Simple Stream WebSocket client disconnected")
                        break
                    except json.JSONDecodeError:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Invalid JSON message"
                        }))
                    except Exception as e:
                        logger.error(f"Simple Stream WebSocket error: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Internal error: {str(e)}"
                        }))
            
            except Exception as e:
                logger.error(f"❌ Simple Stream WebSocket error: {e}")
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Connection failed: {str(e)}"
                    }))
                except:
                    pass  # WebSocket already closed
            finally:
                try:
                    await websocket.close()
                except:
                    pass  # WebSocket already closed
    
    def _setup_stream_websocket(self):
        """Setup streaming WebSocket endpoint"""
        @self.app.websocket("/ws/stream")
        async def websocket_stream_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time streaming"""
            await websocket.accept()
            logger.info("🔌 WebSocket connection accepted")
            
            try:
                # Get service container
                service_container = get_service_container(self.config_provider)
                
                # Initialize services
                await service_container.initialize()
                
                # Get TTS service for streaming
                tts_service = service_container.get_tts_service()
                
                # Audio buffer for better quality
                audio_buffer = []
                buffer_size = 3  # Process 3 chunks at once
                
                await websocket.send_text(json.dumps({
                    "type": "connection_status", 
                    "status": "connected",
                    "message": "Stream WebSocket connected"
                }))
                
                # Listen for client messages
                while True:
                    try:
                        data = await websocket.receive_text()
                        message = json.loads(data)
                        logger.info(f"📨 Received client message: {message}")
                        
                        message_type = message.get("type")
                        
                        if message_type == "text_to_speech":
                            # Handle text-to-speech
                            text = message.get("text", "")
                            voice_id = message.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
                            
                            if not text:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "message": "Text is required for text-to-speech"
                                }))
                                continue
                            
                            try:
                                # Convert text to speech
                                audio_data = await tts_service.text_to_speech(text, voice_id)
                                
                                # Send audio data
                                import base64
                                audio_base64 = base64.b64encode(audio_data.data).decode('utf-8')
                                
                                await websocket.send_text(json.dumps({
                                    "type": "audio_data",
                                    "data": audio_base64,
                                    "timestamp": self._get_current_timestamp()
                                }))
                                
                            except Exception as e:
                                logger.error(f"TTS error: {e}")
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "message": f"Text-to-speech failed: {str(e)}"
                                }))
                        
                        elif message_type == "speech_to_speech":
                            # Handle speech-to-speech with WAV audio data
                            audio_data_base64 = message.get("audio_data", "")  # WAV data in base64
                            voice_id = message.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
                            sample_rate = message.get("sample_rate", 48000)
                            is_phrase = message.get("is_phrase", False)
                            
                            if not audio_data_base64:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "message": "Audio data is required for speech-to-speech"
                                }))
                                continue
                            
                            try:
                                # Decode base64 WAV data
                                import base64
                                wav_data = base64.b64decode(audio_data_base64)
                                
                                # Create audio data object
                                from app.core.interfaces import AudioData, AudioFormat
                                audio_data = AudioData(
                                    data=wav_data,
                                    format=AudioFormat.WAV,
                                    sample_rate=sample_rate,
                                    bitrate="128k"
                                )
                                
                                # Convert speech to speech
                                processed_audio = await tts_service.speech_to_speech(audio_data, voice_id)
                                
                                # Send processed audio data
                                processed_audio_base64 = base64.b64encode(processed_audio.data).decode('utf-8')
                                
                                await websocket.send_text(json.dumps({
                                    "type": "audio_data",
                                    "data": processed_audio_base64,
                                    "timestamp": self._get_current_timestamp(),
                                    "is_phrase": is_phrase
                                }))
                                
                            except Exception as e:
                                logger.error(f"STS error: {e}")
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "message": f"Speech-to-speech failed: {str(e)}"
                                }))
                        
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": f"Unknown message type: {message_type}"
                            }))
                    
                    except WebSocketDisconnect:
                        logger.info("WebSocket client disconnected")
                        break
                    except json.JSONDecodeError:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Invalid JSON message"
                        }))
                    except Exception as e:
                        logger.error(f"WebSocket error: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Internal error: {str(e)}"
                        }))
            
            except Exception as e:
                logger.error(f"❌ WebSocket connection error: {e}")
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Connection failed: {str(e)}"
                    }))
                except:
                    pass  # WebSocket already closed
            finally:
                try:
                    await websocket.close()
                except:
                    pass  # WebSocket already closed
    
    @asynccontextmanager
    async def _lifespan(self, app: FastAPI):
        """Application lifespan manager"""
        # Startup
        logger.info("🚀 Starting refactored FastAPI application...")
        
        try:
            # Initialize service container
            self.service_container = get_service_container(self.config_provider)
            await self.service_container.initialize()
            logger.info("✅ Services initialized successfully")
            

            
        except Exception as e:
            logger.error(f"❌ Service initialization failed: {e}")
        
        yield
        
        # Shutdown
        logger.info("🛑 Shutting down refactored FastAPI application...")
        
        try:
            if self.service_container:
                await self.service_container.cleanup()
            logger.info("✅ Services cleaned up successfully")
        except Exception as e:
            logger.error(f"❌ Service cleanup failed: {e}")
    

    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
    
    def _combine_wav_chunks(self, wav_chunks_base64):
        """Combine multiple WAV chunks into one"""
        try:
            import base64
            import wave
            from io import BytesIO
            
            # Decode all chunks
            wav_chunks = []
            for chunk_base64 in wav_chunks_base64:
                chunk_data = base64.b64decode(chunk_base64)
                wav_chunks.append(chunk_data)
            
            # Combine audio data
            combined_audio_data = b''
            sample_rate = 48000
            
            for i, chunk_data in enumerate(wav_chunks):
                # Read WAV header for first chunk
                if i == 0:
                    with wave.open(BytesIO(chunk_data), 'rb') as wav_file:
                        sample_rate = wav_file.getframerate()
                        combined_audio_data = wav_file.readframes(wav_file.getnframes())
                else:
                    # For subsequent chunks, skip header and read only audio data
                    with wave.open(BytesIO(chunk_data), 'rb') as wav_file:
                        combined_audio_data += wav_file.readframes(wav_file.getnframes())
            
            # Create new WAV file
            output_buffer = BytesIO()
            with wave.open(output_buffer, 'wb') as output_wav:
                output_wav.setnchannels(1)  # Mono
                output_wav.setsampwidth(2)  # 16-bit
                output_wav.setframerate(sample_rate)
                output_wav.writeframes(combined_audio_data)
            
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error combining WAV chunks: {e}")
            # Fallback: return first chunk
            return base64.b64decode(wav_chunks_base64[0])


# Load environment variables
load_dotenv()

# Create application manager
app_manager = ApplicationManager()

# Create application
app = app_manager.create_application()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
