#!/usr/bin/env python3
"""
Test script for complete audio streaming flow
"""

import asyncio
import websockets
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_audio_streaming():
    """Test complete audio streaming flow"""
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
            
            # Send multiple audio chunks to simulate real recording
            for i in range(5):
                # Simulate 1 second of audio data (44100 samples * 2 bytes per sample)
                test_audio = b'\x00' * 88200  # 1 second of silence at 44.1kHz
                print(f"📤 Sending audio chunk {i+1}: {len(test_audio)} bytes")
                await websocket.send(test_audio)
                
                # Wait a bit between chunks
                await asyncio.sleep(0.5)
            
            # Wait for processed audio
            print("⏳ Waiting for processed audio...")
            audio_chunks_received = 0
            
            # Wait for up to 10 seconds for audio
            for _ in range(20):  # 20 * 0.5 = 10 seconds
                try:
                    processed_audio = await asyncio.wait_for(websocket.recv(), timeout=0.5)
                    
                    if isinstance(processed_audio, bytes):
                        audio_chunks_received += 1
                        print(f"✅ Received audio chunk {audio_chunks_received}: {len(processed_audio)} bytes")
                    else:
                        print(f"📥 Received message: {processed_audio}")
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for audio...")
                    break
            
            # Send end signal
            await websocket.send(json.dumps({"type": "end"}))
            
            if audio_chunks_received > 0:
                print(f"✅ Test completed successfully! Received {audio_chunks_received} audio chunks")
                return True
            else:
                print("❌ No audio chunks received")
                return False
                
    except Exception as e:
        print(f"❌ Audio streaming test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Complete Audio Streaming Flow...")
    success = asyncio.run(test_audio_streaming())
    
    if success:
        print("🎉 Audio streaming test passed!")
    else:
        print("💥 Audio streaming test failed!")
