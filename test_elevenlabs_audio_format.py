#!/usr/bin/env python3
"""
Test script for ElevenLabs audio format
"""

import os
from dotenv import load_dotenv
from elevenlabs import stream
from elevenlabs.client import ElevenLabs

# Load environment variables
load_dotenv()

def test_elevenlabs_audio_format():
    """Test ElevenLabs audio format"""
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
        
        # Test streaming with specific format
        print("🎤 Testing streaming with MP3 format...")
        audio_stream = client.text_to_speech.stream(
            text="This is a test of audio format.",
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128"
        )
        
        # Process audio chunks and save to file
        chunk_count = 0
        total_bytes = 0
        audio_chunks = []
        
        for chunk in audio_stream:
            if isinstance(chunk, bytes):
                chunk_count += 1
                total_bytes += len(chunk)
                audio_chunks.append(chunk)
                print(f"📦 Chunk {chunk_count}: {len(chunk)} bytes")
        
        # Save combined audio to file
        if audio_chunks:
            combined_audio = b''.join(audio_chunks)
            with open('test_audio.mp3', 'wb') as f:
                f.write(combined_audio)
            print(f"💾 Saved audio to test_audio.mp3 ({len(combined_audio)} bytes)")
        
        print(f"✅ Streaming completed: {chunk_count} chunks, {total_bytes} total bytes")
        
        # Check file format
        if os.path.exists('test_audio.mp3'):
            with open('test_audio.mp3', 'rb') as f:
                header = f.read(10)
                print(f"📄 File header: {header[:10].hex()}")
                
                # Check for MP3 signature
                if header.startswith(b'\xff\xfb') or header.startswith(b'ID3'):
                    print("✅ File appears to be valid MP3")
                else:
                    print("⚠️ File may not be valid MP3")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing ElevenLabs audio format: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing ElevenLabs Audio Format...")
    success = test_elevenlabs_audio_format()
    
    if success:
        print("🎉 ElevenLabs audio format test passed!")
    else:
        print("💥 ElevenLabs audio format test failed!")
