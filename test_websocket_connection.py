#!/usr/bin/env python3
"""
Test script for WebSocket connection and audio streaming
"""

import asyncio
import websockets
import json
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_websocket_connection():
    """Test WebSocket connection to the streaming endpoint"""
    try:
        # Connect to WebSocket
        uri = "ws://localhost:8000/api/v1/streaming/ws/stream-audio/21m00Tcm4TlvDq8ikWAM"
        print(f"🔌 Connecting to {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send configuration
            config_message = {
                "type": "config",
                "sample_rate": 44100,
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "model_id": "eleven_multilingual_v2"
            }
            
            print("📤 Sending configuration...")
            await websocket.send(json.dumps(config_message))
            
            # Wait for response
            response = await websocket.recv()
            print(f"📥 Received response: {response}")
            
            # Send test audio data (simulated)
            test_audio = b'\x00' * 1024  # 1KB of silence
            print(f"📤 Sending test audio: {len(test_audio)} bytes")
            await websocket.send(test_audio)
            
            # Wait for processed audio
            print("⏳ Waiting for processed audio...")
            processed_audio = await websocket.recv()
            
            if isinstance(processed_audio, bytes):
                print(f"✅ Received processed audio: {len(processed_audio)} bytes")
            else:
                print(f"📥 Received message: {processed_audio}")
            
            # Send end signal
            await websocket.send(json.dumps({"type": "end"}))
            print("✅ Test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🧪 Testing WebSocket Connection...")
    success = asyncio.run(test_websocket_connection())
    
    if success:
        print("🎉 WebSocket test passed!")
    else:
        print("💥 WebSocket test failed!")
