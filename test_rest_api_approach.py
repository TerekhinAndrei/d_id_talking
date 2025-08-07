#!/usr/bin/env python3
"""
Test script for REST API approach
"""

import asyncio
import websockets
import json
import numpy as np
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_audio():
    """Create test audio data"""
    sample_rate = 16000
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Create speech-like audio
    speech_audio = np.sin(2 * np.pi * 440 * t) * 0.3
    speech_audio += np.sin(2 * np.pi * 880 * t) * 0.2
    
    # Convert to 16-bit PCM
    speech_audio = (speech_audio * 32767).astype(np.int16)
    return speech_audio.tobytes()

async def test_backend_websocket():
    """Test backend WebSocket endpoint with REST API approach"""
    
    try:
        # Connect to our backend WebSocket
        backend_url = "ws://localhost:8000/api/v1/streaming/ws/stream-audio/21m00Tcm4TlvDq8ikWAM"
        logger.info(f"🔌 Connecting to backend: {backend_url}")
        
        async with websockets.connect(backend_url) as websocket:
            logger.info("✅ Connected to backend WebSocket")
            
            # Send configuration
            config_message = {
                "type": "config",
                "sample_rate": 16000,
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "model_id": "eleven_multilingual_sts_v2"
            }
            
            logger.info(f"📤 Sending config to backend: {config_message}")
            await websocket.send(json.dumps(config_message))
            
            # Wait for status response
            response = await websocket.recv()
            logger.info(f"📥 Received from backend: {response}")
            
            # Send test audio
            test_audio = create_test_audio()
            logger.info(f"📤 Sending test audio to backend: {len(test_audio)} bytes")
            await websocket.send(test_audio)
            
            # Wait a bit for processing
            await asyncio.sleep(2)
            
            # Send end signal
            end_message = {"type": "end"}
            await websocket.send(json.dumps(end_message))
            
            # Receive responses
            response_count = 0
            while response_count < 3:  # Limit to 3 responses for testing
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    
                    if isinstance(response, bytes):
                        logger.info(f"📥 Received audio chunk from backend: {len(response)} bytes")
                        response_count += 1
                    else:
                        logger.info(f"📥 Received message from backend: {response}")
                        
                except asyncio.TimeoutError:
                    logger.warning("⏰ Timeout waiting for backend response")
                    break
            
            logger.info("✅ Backend WebSocket test completed")
            
    except Exception as e:
        logger.error(f"❌ Backend WebSocket test failed: {e}")
        import traceback
        traceback.print_exc()

async def test_elevenlabs_rest_direct():
    """Test direct ElevenLabs REST API call"""
    
    try:
        from app.services.elevenlabs_service import ElevenLabsService
        
        # Load environment
        load_dotenv()
        
        # Create service
        service = ElevenLabsService()
        
        # Create test audio
        test_audio = create_test_audio()
        logger.info(f"🧪 Testing ElevenLabs REST API with {len(test_audio)} bytes of audio")
        
        # Test speech-to-speech
        processed_audio = service.speech_to_speech_stream(
            audio_data=test_audio,
            voice_id="21m00Tcm4TlvDq8ikWAM",
            model_id="eleven_multilingual_sts_v2"
        )
        
        if processed_audio:
            logger.info(f"✅ ElevenLabs REST API works! Processed audio: {len(processed_audio)} bytes")
            return True
        else:
            logger.error("❌ ElevenLabs REST API returned no audio")
            return False
            
    except Exception as e:
        logger.error(f"❌ ElevenLabs REST API test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    
    logger.info("🧪 Testing REST API approach...")
    
    # Test 1: Direct ElevenLabs REST API
    logger.info("\n=== Test 1: Direct ElevenLabs REST API ===")
    rest_works = await test_elevenlabs_rest_direct()
    
    # Test 2: Backend WebSocket with REST API
    logger.info("\n=== Test 2: Backend WebSocket with REST API ===")
    await test_backend_websocket()
    
    # Summary
    logger.info("\n=== Summary ===")
    logger.info(f"ElevenLabs REST API: {'✅ Works' if rest_works else '❌ Failed'}")
    
    if rest_works:
        logger.info("🎉 REST API approach should work!")
    else:
        logger.info("💡 REST API approach needs investigation")

if __name__ == "__main__":
    asyncio.run(main())
