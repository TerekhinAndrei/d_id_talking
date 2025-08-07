#!/usr/bin/env python3
"""
Test script for API key loading
"""

import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_env_loading():
    """Test environment variable loading"""
    
    # Load .env file
    load_dotenv()
    
    # Check environment variables
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    d_id_key = os.getenv("D_ID_API_KEY")
    
    logger.info("🔍 Environment Variables Check:")
    logger.info(f"   ELEVENLABS_API_KEY: {'✅ Set' if elevenlabs_key else '❌ Not set'}")
    if elevenlabs_key:
        logger.info(f"   ElevenLabs Key (first 10 chars): {elevenlabs_key[:10]}...")
    logger.info(f"   D_ID_API_KEY: {'✅ Set' if d_id_key else '❌ Not set'}")
    if d_id_key:
        logger.info(f"   D-ID Key (first 10 chars): {d_id_key[:10]}...")

def test_config_loading():
    """Test configuration loading"""
    
    try:
        from app.core.config import settings as config
        
        logger.info("🔧 Configuration Check:")
        logger.info(f"   ElevenLabs configured: {config.is_elevenlabs_configured()}")
        logger.info(f"   D-ID configured: {config.is_d_id_configured()}")
        
        if config.is_elevenlabs_configured():
            headers = config.get_elevenlabs_headers()
            logger.info(f"   ElevenLabs headers: {headers}")
        
    except Exception as e:
        logger.error(f"❌ Configuration loading failed: {e}")

def test_service_initialization():
    """Test service initialization"""
    
    try:
        from app.services.elevenlabs_service import ElevenLabsService
        
        service = ElevenLabsService()
        
        logger.info("🔧 Service Check:")
        logger.info(f"   Service configured: {service.is_configured()}")
        logger.info(f"   API Key available: {'✅ Yes' if service.api_key else '❌ No'}")
        
        if service.api_key:
            logger.info(f"   API Key (first 10 chars): {service.api_key[:10]}...")
        
    except Exception as e:
        logger.error(f"❌ Service initialization failed: {e}")

def main():
    """Run all tests"""
    
    logger.info("🧪 Testing API key loading...")
    
    test_env_loading()
    test_config_loading()
    test_service_initialization()
    
    logger.info("🎉 Tests completed!")

if __name__ == "__main__":
    main()
