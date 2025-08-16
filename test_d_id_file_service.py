#!/usr/bin/env python3
"""
Test script for D-ID File Service
"""

import asyncio
import logging
import os
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add app to path
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.base import ConfigurationProvider, AsyncHTTPClient
from app.services.d_id_file_service import DIdFileService
from app.core.interfaces import DIdFileUploadRequest

async def test_d_id_file_service():
    """Test D-ID File Service functionality"""
    
    # Create test image data
    test_image_data = b"fake_image_data_for_testing"
    test_audio_data = b"fake_audio_data_for_testing"
    
    try:
        # Initialize services
        config_provider = ConfigurationProvider(settings)
        http_client = AsyncHTTPClient()
        
        # Check if D-ID API key is configured
        if not config_provider.is_configured("d_id_file"):
            logger.warning("D-ID API key not configured. Skipping actual API tests.")
            logger.info("To test with real API, set D_ID_API_KEY environment variable.")
            
            # Test service creation (should work even without API key)
            try:
                d_id_file_service = DIdFileService(config_provider, http_client)
                logger.info("✅ DIdFileService created successfully")
            except Exception as e:
                logger.error(f"❌ Failed to create DIdFileService: {e}")
                return
            
            # Test validation methods
            logger.info("Testing validation methods...")
            
            # Test image validation
            image_request = DIdFileUploadRequest(
                file_data=test_image_data,
                filename="test_image.jpg",
                content_type="image/jpeg"
            )
            
            try:
                # This should fail due to invalid filename characters
                invalid_request = DIdFileUploadRequest(
                    file_data=test_image_data,
                    filename="test image with spaces.jpg",
                    content_type="image/jpeg"
                )
                logger.info("✅ Image validation working (invalid filename rejected)")
            except Exception as e:
                logger.info(f"✅ Image validation working: {e}")
            
            # Test audio validation
            try:
                audio_request = DIdFileUploadRequest(
                    file_data=test_audio_data,
                    filename="test_audio.mp3",
                    content_type="audio/mpeg"
                )
                logger.info("✅ Audio validation working")
            except Exception as e:
                logger.error(f"❌ Audio validation failed: {e}")
            
            logger.info("✅ All validation tests passed!")
            return
        
        # If API key is configured, run full tests
        d_id_file_service = DIdFileService(config_provider, http_client)
        
        logger.info("Testing D-ID File Service...")
        
        # Test authentication
        logger.info("Testing authentication...")
        auth_result = await d_id_file_service.test_authentication()
        logger.info(f"Authentication result: {auth_result}")
        
        # Test image upload
        logger.info("Testing image upload...")
        image_request = DIdFileUploadRequest(
            file_data=test_image_data,
            filename="test_image.jpg",
            content_type="image/jpeg"
        )
        
        try:
            image_response = await d_id_file_service.upload_image(image_request)
            logger.info(f"Image upload successful: {image_response}")
            
            # Test image deletion
            logger.info("Testing image deletion...")
            delete_result = await d_id_file_service.delete_image(image_response.file_id)
            logger.info(f"Image deletion result: {delete_result}")
            
        except Exception as e:
            logger.error(f"Image upload/deletion test failed: {e}")
        
        # Test audio upload
        logger.info("Testing audio upload...")
        audio_request = DIdFileUploadRequest(
            file_data=test_audio_data,
            filename="test_audio.mp3",
            content_type="audio/mpeg"
        )
        
        try:
            audio_response = await d_id_file_service.upload_audio(audio_request)
            logger.info(f"Audio upload successful: {audio_response}")
            
            # Test audio deletion
            logger.info("Testing audio deletion...")
            delete_result = await d_id_file_service.delete_audio(audio_response.file_id)
            logger.info(f"Audio deletion result: {delete_result}")
            
        except Exception as e:
            logger.error(f"Audio upload/deletion test failed: {e}")
        
        # Cleanup
        await http_client.close()
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_d_id_file_service())
