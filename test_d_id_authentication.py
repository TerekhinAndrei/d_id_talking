#!/usr/bin/env python3
"""
Test script for D-ID API authentication
Tests the connection with real API key from .env file
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.d_id_service import d_id_service


def test_d_id_authentication():
    """Test D-ID API authentication"""
    print("🧪 Testing D-ID API Authentication")
    print("=" * 50)
    
    # Check if API key is configured
    api_key = os.getenv("D_ID_API_KEY")
    if not api_key:
        print("❌ D_ID_API_KEY not found in environment variables")
        print("   Please add D_ID_API_KEY to your .env file")
        return False
    
    print(f"✅ D_ID_API_KEY found: {api_key[:10]}...")
    print(f"✅ D_ID_BASE_URL: {d_id_service.base_url}")
    
    # Test authentication
    try:
        result = d_id_service.test_authentication()
        
        if result["success"]:
            print("🎉 D-ID API authentication successful!")
            print(f"   Message: {result['message']}")
            
            # Show some data if available
            if "data" in result and "talks" in result["data"]:
                talks_count = len(result["data"]["talks"])
                print(f"   Found {talks_count} existing talks")
            
            return True
        else:
            print("❌ D-ID API authentication failed!")
            print(f"   Error: {result['message']}")
            if "status_code" in result:
                print(f"   Status Code: {result['status_code']}")
            return False
            
    except Exception as e:
        print(f"❌ Unexpected error during authentication test: {e}")
        return False


def test_d_id_service_methods():
    """Test additional D-ID service methods"""
    print("\n🔧 Testing D-ID Service Methods")
    print("=" * 50)
    
    # Test is_configured
    try:
        is_configured = d_id_service.is_configured()
        print(f"✅ is_configured(): {is_configured}")
    except Exception as e:
        print(f"❌ is_configured() error: {e}")
    
    # Test get_talks (if authentication works)
    try:
        talks = d_id_service.get_talks()
        print(f"✅ get_talks(): Found {len(talks)} talks")
        
        # Show first few talks
        for i, talk in enumerate(talks[:3]):
            print(f"   Talk {i+1}: ID={talk.get('id', 'N/A')}, Status={talk.get('status', 'N/A')}")
            
    except Exception as e:
        print(f"❌ get_talks() error: {e}")


if __name__ == "__main__":
    print("🚀 Starting D-ID API Authentication Test")
    print("=" * 60)
    
    # Test authentication
    auth_success = test_d_id_authentication()
    
    if auth_success:
        # Test additional methods
        test_d_id_service_methods()
    
    print("\n" + "=" * 60)
    if auth_success:
        print("🎉 All D-ID API tests completed successfully!")
    else:
        print("❌ D-ID API authentication failed. Please check your configuration.")
    
    print("=" * 60) 