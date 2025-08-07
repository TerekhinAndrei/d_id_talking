#!/usr/bin/env python3
"""
Test script for ElevenLabs authentication
"""

import os
import requests
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_elevenlabs_auth():
    """Test ElevenLabs API authentication"""
    
    # Load environment variables
    load_dotenv()
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.error("❌ ELEVENLABS_API_KEY not found!")
        return
    
    logger.info(f"🔑 Testing ElevenLabs API key: {api_key[:10]}...")
    
    # Test 1: Get voices (basic auth test)
    try:
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers=headers,
            timeout=10
        )
        
        logger.info(f"📡 Voices API Response: {response.status_code}")
        
        if response.status_code == 200:
            voices = response.json()
            logger.info(f"✅ Authentication successful! Found {len(voices.get('voices', []))} voices")
            
            # Show first few voices
            for voice in voices.get('voices', [])[:3]:
                logger.info(f"   - {voice.get('name', 'Unknown')} (ID: {voice.get('voice_id', 'Unknown')})")
        else:
            logger.error(f"❌ Authentication failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"❌ Voices API test failed: {e}")
    
    # Test 2: Check user info
    try:
        response = requests.get(
            "https://api.elevenlabs.io/v1/user",
            headers=headers,
            timeout=10
        )
        
        logger.info(f"📡 User API Response: {response.status_code}")
        
        if response.status_code == 200:
            user_info = response.json()
            logger.info(f"✅ User info retrieved:")
            logger.info(f"   - Subscription: {user_info.get('subscription', {}).get('tier', 'Unknown')}")
            logger.info(f"   - Character count: {user_info.get('subscription', {}).get('character_count', 0)}")
            logger.info(f"   - Character limit: {user_info.get('subscription', {}).get('character_limit', 0)}")
        else:
            logger.error(f"❌ User API failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"❌ User API test failed: {e}")

def test_elevenlabs_streaming_access():
    """Test if we have access to streaming endpoints"""
    
    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not api_key:
        logger.error("❌ ELEVENLABS_API_KEY not found!")
        return
    
    logger.info("🔍 Testing streaming access...")
    
    # Test 1: Check if we can access speech-to-speech endpoint
    try:
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        # Try to get available models
        response = requests.get(
            "https://api.elevenlabs.io/v1/models",
            headers=headers,
            timeout=10
        )
        
        logger.info(f"📡 Models API Response: {response.status_code}")
        
        if response.status_code == 200:
            models = response.json()
            logger.info(f"✅ Models retrieved: {len(models.get('models', []))} models")
            
            # Check for STS models
            sts_models = [m for m in models.get('models', []) if 'sts' in m.get('model_id', '').lower()]
            logger.info(f"   - STS models found: {len(sts_models)}")
            
            for model in sts_models:
                logger.info(f"     * {model.get('name', 'Unknown')} (ID: {model.get('model_id', 'Unknown')})")
        else:
            logger.error(f"❌ Models API failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"❌ Models API test failed: {e}")

def main():
    """Run all tests"""
    
    logger.info("🧪 Testing ElevenLabs authentication...")
    
    test_elevenlabs_auth()
    test_elevenlabs_streaming_access()
    
    logger.info("🎉 Authentication tests completed!")

if __name__ == "__main__":
    main()
