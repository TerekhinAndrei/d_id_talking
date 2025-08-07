#!/usr/bin/env python3
"""
Test script for ElevenLabs WebSocket connection
"""

import asyncio
import logging
import sys
import os
import json
import websockets
import numpy as np

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

async def test_elevenlabs_websocket():
    """Test direct WebSocket connection to ElevenLabs"""
    
    # You need to set your ElevenLabs API key
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.error("❌ ELEVENLABS_API_KEY environment variable not set!")
        return
    
    voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    
    try:
        # Connect to ElevenLabs Streaming API
        elevenlabs_url = f"wss://api.elevenlabs.io/v1/speech-to-speech/stream/{voice_id}"
        logger.info(f"🔌 Connecting to ElevenLabs: {elevenlabs_url}")
        
        async with websockets.connect(
            elevenlabs_url,
            extra_headers={"xi-api-key": api_key}
        ) as websocket:
            logger.info("✅ Connected to ElevenLabs Streaming API")
            
            # Send configuration
            config_message = {
                "model_id": "eleven_multilingual_sts_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            logger.info(f"📤 Sending config: {config_message}")
            await websocket.send(json.dumps(config_message))
            
            # Send test audio
            test_audio = create_test_audio()
            logger.info(f"📤 Sending test audio: {len(test_audio)} bytes")
            await websocket.send(test_audio)
            
            # Receive response
            response_count = 0
            while response_count < 5:  # Limit to 5 responses for testing
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    
                    if isinstance(response, bytes):
                        logger.info(f"📥 Received audio chunk: {len(response)} bytes")
                        response_count += 1
                    else:
                        logger.info(f"📥 Received message: {response}")
                        
                except asyncio.TimeoutError:
                    logger.warning("⏰ Timeout waiting for response")
                    break
            
            logger.info("✅ ElevenLabs WebSocket test completed")
            
    except Exception as e:
        logger.error(f"❌ ElevenLabs WebSocket test failed: {e}")
        import traceback
        traceback.print_exc()

async def test_backend_websocket():
    """Test backend WebSocket endpoint"""
    
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
            
            # Receive responses
            response_count = 0
            while response_count < 5:  # Limit to 5 responses for testing
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

async def main():
    """Run all tests"""
    
    logger.info("🧪 Testing ElevenLabs WebSocket connections...")
    
    # Test 1: Direct ElevenLabs connection
    logger.info("\n=== Test 1: Direct ElevenLabs Connection ===")
    await test_elevenlabs_websocket()
    
    # Test 2: Backend WebSocket endpoint
    logger.info("\n=== Test 2: Backend WebSocket Endpoint ===")
    await test_backend_websocket()
    
    logger.info("\n🎉 All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
