#!/usr/bin/env python3
"""
Test script for ElevenLabs SDK streaming functionality
"""

import asyncio
import os
from dotenv import load_dotenv
from elevenlabs import stream
from elevenlabs.client import ElevenLabs

# Load environment variables
load_dotenv()

def test_elevenlabs_sdk():
    """Test ElevenLabs SDK streaming"""
    try:
        # Get API key from environment
        api_key = os.getenv('ELEVENLABS_API_KEY')
        if not api_key:
            print("❌ ELEVENLABS_API_KEY not found in environment")
            return False
        
        print("🔑 ElevenLabs API Key found")
        
        # Initialize client
        client = ElevenLabs(api_key=api_key)
        print("✅ ElevenLabs client initialized")
        
        # Test streaming
        print("🎤 Testing streaming...")
        audio_stream = client.text_to_speech.stream(
            text="This is a test of ElevenLabs streaming functionality.",
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel
            model_id="eleven_multilingual_v2"
        )
        
        # Process audio chunks
        chunk_count = 0
        total_bytes = 0
        
        for chunk in audio_stream:
            if isinstance(chunk, bytes):
                chunk_count += 1
                total_bytes += len(chunk)
                print(f"📦 Chunk {chunk_count}: {len(chunk)} bytes")
        
        print(f"✅ Streaming completed: {chunk_count} chunks, {total_bytes} total bytes")
        return True
        
    except Exception as e:
        print(f"❌ Error testing ElevenLabs SDK: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing ElevenLabs SDK Streaming...")
    success = test_elevenlabs_sdk()
    
    if success:
        print("🎉 ElevenLabs SDK test passed!")
    else:
        print("💥 ElevenLabs SDK test failed!")
