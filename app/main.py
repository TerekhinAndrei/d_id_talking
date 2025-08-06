import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from fastapi import WebSocket, WebSocketDisconnect
import uvicorn
from contextlib import asynccontextmanager
import json
import asyncio

from app.core.config import settings as config
from app.api.v1.api import api_router
from app.services.d_id_websocket_service import DIdWebSocketService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting FastAPI application...")
    yield
    # Shutdown
    print("🛑 Shutting down FastAPI application...")


def create_application() -> FastAPI:
    """
    Create FastAPI application with all middleware and routes
    """
    app = FastAPI(
        title=config.PROJECT_NAME,
        version=config.VERSION,
        description="FastAPI Backend API",
        openapi_url=f"{config.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Set up trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=config.ALLOWED_HOSTS,
    )

    # Include API router
    app.include_router(api_router, prefix=config.API_V1_STR)

    # Simple test WebSocket endpoint
    @app.websocket("/ws/test")
    async def websocket_test_endpoint(websocket: WebSocket):
        """
        Simple test WebSocket endpoint
        """
        await websocket.accept()
        print("🔌 Test WebSocket подключение принято")
        
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
                    print(f"📨 Получено тестовое сообщение: {message}")
                    
                    await websocket.send_text(json.dumps({
                        "type": "test_response",
                        "message": "Test message received",
                        "data": message
                    }))
                    
                except WebSocketDisconnect:
                    print("Test WebSocket client disconnected")
                    break
                except Exception as e:
                    print(f"Test WebSocket error: {e}")
                    break
        
        except Exception as e:
            print(f"❌ Test WebSocket error: {e}")
            try:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Test connection failed: {str(e)}"
                }))
            except:
                pass  # WebSocket уже закрыт
        finally:
            try:
                await websocket.close()
            except:
                pass  # WebSocket уже закрыт

    # Simple streaming WebSocket endpoint (without D-ID service)
    @app.websocket("/ws/stream-simple")
    async def websocket_stream_simple_endpoint(websocket: WebSocket):
        """
        Simple streaming WebSocket endpoint without D-ID service
        """
        await websocket.accept()
        print("🔌 Simple Stream WebSocket подключение принято")
        
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
                    print(f"📨 Получено сообщение от клиента: {message}")
                    
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
                    print("Simple Stream WebSocket client disconnected")
                    break
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON message"
                    }))
                except Exception as e:
                    print(f"Simple Stream WebSocket error: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Internal error: {str(e)}"
                    }))
        
        except Exception as e:
            print(f"❌ Simple Stream WebSocket error: {e}")
            try:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Connection failed: {str(e)}"
                }))
            except:
                pass  # WebSocket уже закрыт
        finally:
            try:
                await websocket.close()
            except:
                pass  # WebSocket уже закрыт

    # WebSocket endpoint for streaming
    @app.websocket("/ws/stream")
    async def websocket_stream_endpoint(websocket: WebSocket):
        """
        WebSocket endpoint for real-time streaming
        """
        await websocket.accept()
        print("🔌 WebSocket подключение принято")
        
        service = DIdWebSocketService()
        print(f"🔧 Создан сервис. Тестовый режим: {service.test_mode}")
        
        try:
            # Connect to D-ID WebSocket (or test mode)
            async def on_message(data):
                print(f"📤 Отправляем сообщение клиенту: {data}")
                await websocket.send_text(json.dumps(data))
            
            async def on_connection_change(status):
                print(f"📤 Отправляем статус подключения: {status}")
                await websocket.send_text(json.dumps({"type": "connection_status", "status": status}))
            
            print("🔧 Начинаем подключение к сервису...")
            await service.connect(
                on_message=on_message,
                on_connection_change=on_connection_change
            )
            print("✅ Подключение к сервису завершено")
            
            # Listen for client messages
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    print(f"📨 Получено сообщение от клиента: {message}")
                    
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
                    print("WebSocket client disconnected")
                    break
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON message"
                    }))
                except Exception as e:
                    print(f"Error handling WebSocket message: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Internal error: {str(e)}"
                    }))
        
        except Exception as e:
            print(f"❌ WebSocket connection error: {e}")
            try:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Connection failed: {str(e)}"
                }))
            except:
                pass  # WebSocket уже закрыт
        finally:
            try:
                if service.is_connected:
                    await service.disconnect()
            except:
                pass  # Сервис уже отключен
            try:
                await websocket.close()
            except:
                pass  # WebSocket уже закрыт

    async def handle_client_message(service, message, websocket, session_id):
        """Handle client WebSocket messages"""
        try:
            message_type = message.get("type")
            
            if message_type == "init_stream":
                # Initialize stream
                source_url = message.get("source_url", "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg")
                presenter_type = message.get("presenter_type", "talk")
                
                await service.init_stream(source_url, presenter_type)
                await websocket.send_text(json.dumps({
                    "type": "init_stream_sent",
                    "message": "Stream initialization sent to D-ID"
                }))
                
            elif message_type == "text_to_speech":
                # Send text for TTS
                text = message.get("text", "")
                voice_id = message.get("voice_id", "en-US-JennyNeural")
                
                if not text:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Text is required for text-to-speech"
                    }))
                    return
                
                await service.send_stream_text(text, voice_id, session_id)
                await websocket.send_text(json.dumps({
                    "type": "text_to_speech_sent",
                    "message": "Text sent for processing"
                }))
                
            elif message_type == "speech_to_speech":
                # Send audio for STS
                audio_data = message.get("audio_data", "")
                
                if not audio_data:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Audio data is required for speech-to-speech"
                    }))
                    return
                
                # Decode base64 audio data
                import base64
                audio_bytes = base64.b64decode(audio_data)
                
                await service.send_stream_audio(audio_bytes, session_id)
                await websocket.send_text(json.dumps({
                    "type": "speech_to_speech_sent",
                    "message": "Audio sent for processing"
                }))
                
            elif message_type == "delete_stream":
                # Delete stream
                await service.delete_stream()
                await websocket.send_text(json.dumps({
                    "type": "stream_deleted",
                    "message": "Stream deleted"
                }))
                
        except Exception as e:
            print(f"Error handling client message: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error processing message: {str(e)}"
            }))

    # Root endpoint that redirects to docs
    @app.get("/")
    async def root():
        return RedirectResponse(url="/docs")

    return app


app = create_application()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    ) 