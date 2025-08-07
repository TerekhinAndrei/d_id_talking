#!/usr/bin/env python3
"""
Test complete frontend flow with image upload and D-ID streaming
"""

import requests
import json
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_files/test_image.jpg"

def test_complete_frontend_flow():
    """Test the complete frontend flow"""
    print("🚀 Testing complete frontend flow...")
    
    # Step 1: Upload image to Cloudinary
    print("📸 Step 1: Uploading image to Cloudinary...")
    
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"❌ Test image not found: {TEST_IMAGE_PATH}")
        return False
    
    try:
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            response = requests.post(f"{BASE_URL}/api/v1/streaming/upload/image", files=files)
        
        if response.status_code != 200:
            print(f"❌ Upload failed with status {response.status_code}")
            return False
            
        upload_result = response.json()
        if not upload_result.get('success'):
            print(f"❌ Upload failed: {upload_result.get('error')}")
            return False
            
        image_url = upload_result['url']
        print(f"✅ Image uploaded: {image_url}")
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False
    
    # Step 2: Create stream with uploaded image
    print("🎬 Step 2: Creating stream with uploaded image...")
    
    try:
        payload = {
            "source_url": image_url
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/streaming/create-stream", json=payload)
        
        if response.status_code != 200:
            print(f"❌ Stream creation failed with status {response.status_code}")
            return False
            
        stream_result = response.json()
        if not stream_result.get('success'):
            print(f"❌ Stream creation failed: {stream_result.get('error')}")
            return False
            
        stream_id = stream_result['stream_id']
        session_id = stream_result['session_id']
        print(f"✅ Stream created: {stream_id}")
        print(f"✅ Session ID: {session_id}")
        
    except Exception as e:
        print(f"❌ Stream creation error: {e}")
        return False
    
    # Step 3: Submit SDP Answer
    print("🔗 Step 3: Submitting SDP Answer...")
    
    try:
        sdp_answer = stream_result['sdp_offer'].replace('a=sendonly', 'a=recvonly')
        payload = {
            "stream_id": stream_id,
            "session_id": session_id,
            "answer": {
                "type": "answer",
                "sdp": sdp_answer
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/streaming/submit-sdp-answer", json=payload)
        
        if response.status_code != 200:
            print(f"⚠️ SDP Answer failed with status {response.status_code}")
        else:
            print("✅ SDP Answer submitted")
            
    except Exception as e:
        print(f"⚠️ SDP Answer error: {e}")
    
    # Step 4: Submit ICE Candidate
    print("🌐 Step 4: Submitting ICE Candidate...")
    
    try:
        payload = {
            "stream_id": stream_id,
            "session_id": session_id,
            "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
            "sdpMid": "0",
            "sdpMLineIndex": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/streaming/submit-ice-candidate", json=payload)
        
        if response.status_code != 200:
            print(f"⚠️ ICE Candidate failed with status {response.status_code}")
        else:
            print("✅ ICE Candidate submitted")
            
    except Exception as e:
        print(f"⚠️ ICE Candidate error: {e}")
    
    # Step 5: Create Talk Stream
    print("🎤 Step 5: Creating Talk Stream...")
    
    try:
        payload = {
            "stream_id": stream_id,
            "session_id": session_id,
            "script": {
                "type": "text",
                "provider": {
                    "type": "elevenlabs",
                    "voice_id": "21m00Tcm4TlvDq8ikWAM"
                },
                "input": "Привет! Это тестовый стрим с D-ID API."
            },
            "config": {
                "fluent": "false",
                "pad_audio": "0.0"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/streaming/create-talk-stream", json=payload)
        
        if response.status_code != 200:
            print(f"⚠️ Talk Stream failed with status {response.status_code}")
        else:
            talk_result = response.json()
            if talk_result.get('success'):
                print(f"✅ Talk Stream created: {talk_result.get('talk_id')}")
            else:
                print(f"⚠️ Talk Stream failed: {talk_result.get('error')}")
            
    except Exception as e:
        print(f"⚠️ Talk Stream error: {e}")
    
    # Step 6: Close Stream
    print("🛑 Step 6: Closing Stream...")
    
    try:
        payload = {
            "session_id": session_id
        }
        
        response = requests.delete(f"{BASE_URL}/api/v1/streaming/{stream_id}", json=payload)
        
        if response.status_code != 200:
            print(f"⚠️ Close Stream failed with status {response.status_code}")
        else:
            print("✅ Stream closed")
            
    except Exception as e:
        print(f"⚠️ Close Stream error: {e}")
    
    print("✅ Complete frontend flow test finished!")
    return True

if __name__ == "__main__":
    test_complete_frontend_flow()


