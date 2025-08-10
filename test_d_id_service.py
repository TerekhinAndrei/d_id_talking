#!/usr/bin/env python3
"""
Test script for D-ID service
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings
from app.services.webrtc_service import WebRTCService
from app.core.base import AsyncHTTPClient
from app.services.d_id_service import DIdService
from app.core.base import ConfigurationProvider

async def test_d_id_configuration():
    """Test D-ID configuration"""
    print("🔧 Testing D-ID Configuration...")
    
    # Check if API key is configured
    api_key = settings.D_ID_API_KEY
    base_url = settings.D_ID_BASE_URL
    
    print(f"✅ API Key configured: {'Yes' if api_key else 'No'}")
    print(f"✅ Base URL: {base_url}")
    
    if not api_key:
        print("❌ D-ID API key not configured!")
        return False
    
    return True

async def test_webrtc_service():
    """Test WebRTC service"""
    print("\n🌐 Testing WebRTC Service...")
    
    try:
        webrtc_service = WebRTCService()
        print("✅ WebRTC service initialized")
        
        # Test creating a stream
        test_image_url = "https://res.cloudinary.com/daeoqig4w/image/upload/v1703123456/test_image.jpg"
        print(f"🔄 Creating stream with image: {test_image_url}")
        
        stream_data = await webrtc_service.create_stream(test_image_url)
        
        print("✅ Stream created successfully!")
        print(f"   Stream ID: {stream_data.get('stream_id')}")
        print(f"   Session ID: {stream_data.get('session_id', 'N/A')}")
        print(f"   Has SDP Offer: {'Yes' if stream_data.get('offer') else 'No'}")
        print(f"   ICE Servers: {len(stream_data.get('ice_servers', []))}")
        
        return stream_data
        
    except Exception as e:
        print(f"❌ WebRTC service test failed: {e}")
        return None

async def test_d_id_service():
    """Test D-ID service"""
    print("\n🎬 Testing D-ID Service...")
    
    try:
        # Create HTTP client and config provider
        http_client = AsyncHTTPClient()
        config_provider = ConfigurationProvider(settings)
        
        d_id_service = DIdService(config_provider, http_client)
        print("✅ D-ID service initialized")
        
        # Test authentication
        print("🔄 Testing authentication...")
        auth_result = await d_id_service.test_authentication()
        
        if auth_result.get('success'):
            print("✅ D-ID authentication successful")
            print(f"   Message: {auth_result.get('message')}")
        else:
            print("❌ D-ID authentication failed")
            print(f"   Error: {auth_result.get('error')}")
        
        return auth_result
        
    except Exception as e:
        print(f"❌ D-ID service test failed: {e}")
        return None

async def main():
    """Main test function"""
    print("🚀 Starting D-ID Service Tests...\n")
    
    # Test 1: Configuration
    config_ok = await test_d_id_configuration()
    if not config_ok:
        print("\n❌ Configuration test failed. Exiting.")
        return
    
    # Test 2: WebRTC Service
    stream_data = await test_webrtc_service()
    if not stream_data:
        print("\n❌ WebRTC service test failed.")
        return
    
    # Test 3: D-ID Service
    auth_result = await test_d_id_service()
    if not auth_result:
        print("\n❌ D-ID service test failed.")
        return
    
    print("\n🎉 All tests completed!")
    
    if stream_data and auth_result.get('success'):
        print("✅ D-ID service is working correctly!")
        print("✅ WebRTC streaming is ready!")
    else:
        print("❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
