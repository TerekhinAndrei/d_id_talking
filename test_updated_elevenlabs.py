#!/usr/bin/env python3

import requests
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_elevenlabs_with_requests():
    """Test ElevenLabs API using requests library with correct endpoint"""
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    base_url = "https://api.elevenlabs.io/v1"
    
    print("=== Testing ElevenLabs API with requests library ===")
    print(f"API Key: {api_key[:20]}...")
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    # Test 1: Get available voices
    print("\n1. Testing voices endpoint...")
    try:
        response = requests.get(f"{base_url}/voices", headers=headers, timeout=30)
        response.raise_for_status()
        voices_data = response.json()
        print(f"✅ Success! Got {len(voices_data.get('voices', []))} voices")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error getting voices: {e}")
        return
    
    # Test 2: Test speech-to-speech with correct endpoint
    print("\n2. Testing speech-to-speech with correct endpoint...")
    
    # Create test audio (1 second of silence)
    import wave
    import struct
    import tempfile
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
        temp_filename = temp_file.name
        
        with wave.open(temp_filename, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(44100)
            
            # Generate 1 second of silence
            for i in range(44100):
                data = struct.pack('<h', 0)  # Silence
                wav_file.writeframes(data)
    
    # Read test audio file
    with open(temp_filename, 'rb') as f:
        test_audio_data = f.read()
    
    print(f"   Created test audio file: {len(test_audio_data)} bytes")
    
    # Test with correct endpoint format
    voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    endpoint = f"{base_url}/speech-to-speech/{voice_id}"
    
    # Prepare multipart/form-data request
    files = {
        'audio': ('audio.wav', test_audio_data, 'audio/wav'),
    }
    
    data = {
        'model_id': 'eleven_multilingual_sts_v2',
        'voice_settings[stability]': '0.5',
        'voice_settings[similarity_boost]': '0.75',
        'voice_settings[style]': '0.0',
        'voice_settings[use_speaker_boost]': 'true',
    }
    
    print(f"   Sending request to: {endpoint}")
    print(f"   Voice ID: {voice_id}")
    print(f"   Model: eleven_multilingual_sts_v2")
    
    try:
        response = requests.post(
            endpoint,
            headers={"xi-api-key": api_key},
            files=files,
            data=data,
            timeout=60
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Speech-to-Speech successful!")
            
            # Check if response is JSON or binary
            content_type = response.headers.get('content-type', '')
            if 'application/json' in content_type:
                result = response.json()
                if 'audio' in result:
                    audio_data = base64.b64decode(result['audio'])
                    print(f"   Received audio: {len(audio_data)} bytes")
                    
                    # Save result
                    with open('test_sts_result.mp3', 'wb') as f:
                        f.write(audio_data)
                    print("   Saved as: test_sts_result.mp3")
                else:
                    print(f"   JSON response: {result}")
            else:
                # Binary response
                print(f"   Received binary audio: {len(response.content)} bytes")
                with open('test_sts_result.mp3', 'wb') as f:
                    f.write(response.content)
                print("   Saved as: test_sts_result.mp3")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        # Clean up
        os.unlink(temp_filename)
    
    print("\n=== Test completed ===")

if __name__ == "__main__":
    test_elevenlabs_with_requests() 