#!/usr/bin/env python3
"""
Test frontend flow with image upload and D-ID streaming
"""

import requests
import json
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_files/test_image.jpg"

def test_image_upload():
    """Test image upload to Cloudinary"""
    print("🔄 Testing image upload...")
    
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"❌ Test image not found: {TEST_IMAGE_PATH}")
        return None
    
    try:
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            response = requests.post(f"{BASE_URL}/api/v1/streaming/upload/image", files=files)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Image uploaded successfully: {result['url']}")
                return result['url']
            else:
                print(f"❌ Upload failed: {result.get('error')}")
                return None
        else:
            print(f"❌ Upload request failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def test_create_stream_with_uploaded_image(image_url):
    """Test creating stream with uploaded image"""
    print("🔄 Testing stream creation with uploaded image...")
    
    try:
        payload = {
            "source_url": image_url
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/streaming/create-stream", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Stream created successfully: {result['stream_id']}")
                return result
            else:
                print(f"❌ Stream creation failed: {result.get('error')}")
                return None
        else:
            print(f"❌ Stream creation request failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Stream creation error: {e}")
        return None

def main():
    """Run the complete test flow"""
    print("🚀 Starting frontend flow test...")
    
    # Step 1: Upload image
    image_url = test_image_upload()
    if not image_url:
        print("❌ Image upload failed, stopping test")
        return
    
    # Step 2: Create stream with uploaded image
    stream_result = test_create_stream_with_uploaded_image(image_url)
    if not stream_result:
        print("❌ Stream creation failed")
        return
    
    print("✅ Complete flow test passed!")
    print(f"📸 Image URL: {image_url}")
    print(f"🎬 Stream ID: {stream_result['stream_id']}")

if __name__ == "__main__":
    main()


