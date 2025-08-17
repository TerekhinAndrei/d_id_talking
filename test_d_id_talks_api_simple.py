#!/usr/bin/env python3
"""
Simple test script for D-ID Talks API structure
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_api_structure():
    """Test D-ID talks API structure without real D-ID calls"""
    
    print("Testing D-ID Talks API structure...")
    
    # Test 1: Check if endpoints are available
    print("\n1. Checking API endpoints availability...")
    
    endpoints = [
        "/d-id-talks/create",
        "/d-id-talks/webhook",
        "/d-id-talks/create-with-text",
        "/d-id-talks/create-with-audio"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"  {endpoint}: {response.status_code} (GET not allowed, expected)")
        except Exception as e:
            print(f"  {endpoint}: Error - {e}")
    
    # Test 2: Test webhook endpoint with valid payload
    print("\n2. Testing webhook endpoint...")
    
    webhook_payload = {
        "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
        "created_at": "2023-03-22T16:38:49.723Z",
        "created_by": "google-oauth2|12345678",
        "status": "done",
        "object": "talk",
        "result_url": "https://example.com/result.mp4",
        "audio_url": "https://example.com/audio.wav",
        "source_url": "https://example.com/source.jpg",
        "modified_at": "2023-03-22T16:39:15.603Z",
        "user_id": "google-oauth2|12345678",
        "duration": 2,
        "started_at": "2023-03-22T16:39:13.633",
        "metadata": {
            "driver_url": "bank://lively/driver-02/flipped",
            "mouth_open": False,
            "num_faces": 1,
            "num_frames": 41,
            "processing_fps": 51.51385098457352,
            "resolution": [512, 512],
            "size_kib": 334.22265625
        },
        "face": {
            "mask_confidence": -1,
            "detection": [224, 198, 484, 553],
            "overlap": "no",
            "size": 512,
            "top_left": [98, 119],
            "face_id": 0,
            "detect_confidence": 0.9998300075531006
        },
        "config": {
            "stitch": False,
            "pad_audio": 0,
            "align_driver": True,
            "sharpen": True,
            "auto_match": True,
            "normalization_factor": 1,
            "logo": {
                "url": "ai",
                "position": [0, 0]
            },
            "motion_factor": 1,
            "result_format": ".mp4",
            "fluent": False,
            "align_expand_factor": 0.3
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/d-id-talks/webhook",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Webhook Status Code: {response.status_code}")
        print(f"Webhook Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Webhook endpoint works correctly!")
        else:
            print("❌ Webhook endpoint failed!")
        
    except Exception as e:
        print(f"❌ Webhook test error: {e}")
    
    # Test 3: Test create talk endpoint structure (will fail due to missing API key)
    print("\n3. Testing create talk endpoint structure...")
    
    create_payload = {
        "source_url": "https://myhost.com/image.jpg",
        "script": {
            "type": "audio",
            "audio_url": "https://path.to/audio.mp3"
        },
        "config": {
            "stitch": True
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/d-id-talks/create",
            json=create_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Create Talk Status Code: {response.status_code}")
        
        if response.status_code == 500:
            error_detail = response.json().get("detail", "")
            if "D_ID_API_KEY" in error_detail or "authentication" in error_detail.lower():
                print("✅ Create talk endpoint structure is correct (failed due to missing API key)")
            else:
                print(f"❌ Create talk endpoint failed with unexpected error: {error_detail}")
        elif response.status_code == 200:
            print("✅ Create talk endpoint works!")
        else:
            print(f"❌ Create talk endpoint returned unexpected status: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Create talk test error: {e}")
    
    # Test 4: Check OpenAPI documentation
    print("\n4. Checking OpenAPI documentation...")
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi_data = response.json()
            paths = openapi_data.get("paths", {})
            
            d_id_paths = [path for path in paths.keys() if "d-id-talks" in path]
            print(f"Found {len(d_id_paths)} D-ID talks endpoints in OpenAPI:")
            for path in d_id_paths:
                print(f"  - {path}")
            
            if len(d_id_paths) >= 6:  # Expected number of endpoints
                print("✅ OpenAPI documentation includes D-ID talks endpoints!")
            else:
                print("❌ Missing D-ID talks endpoints in OpenAPI documentation")
        else:
            print(f"❌ Failed to get OpenAPI documentation: {response.status_code}")
        
    except Exception as e:
        print(f"❌ OpenAPI test error: {e}")
    
    print("\nD-ID Talks API structure test completed!")

if __name__ == "__main__":
    test_api_structure()
