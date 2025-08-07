#!/usr/bin/env python3
"""
Test script for ElevenLabs Speech-to-Speech API
"""

import asyncio
import logging
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.elevenlabs_service import ElevenLabsService, SpeechToSpeechRequest, ElevenLabsModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_speech_to_speech():
    """Test the speech-to-speech functionality"""
    
    try:
        # Initialize service
        service = ElevenLabsService()
        
        # Check if configured
        if not service.is_configured():
            logger.error("ElevenLabs service not configured!")
            return
        
        # Test authentication
        auth_result = service.test_authentication()
        logger.info(f"Authentication test: {auth_result}")
        
        # Create test audio data (simulate PCM audio)
        # This would normally come from the microphone
        test_audio = b'\x00' * 4096  # 4KB of silence for testing
        
        # Test speech-to-speech
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        logger.info(f"Testing Speech-to-Speech with voice: {voice_id}")
        logger.info(f"Input audio size: {len(test_audio)} bytes")
        
        # Create request
        request = SpeechToSpeechRequest(
            audio_data=test_audio,
            voice_id=voice_id,
            model_id=ElevenLabsModel.MULTILINGUAL_STS_V2
        )
        
        # Process audio
        result = service.speech_to_speech(request)
        
        logger.info(f"Speech-to-Speech successful!")
        logger.info(f"Output audio size: {len(result)} bytes")
        
        # Save result for inspection
        with open("test_sts_output.mp3", "wb") as f:
            f.write(result)
        
        logger.info("Output saved to test_sts_output.mp3")
        
    except Exception as e:
        logger.error(f"Speech-to-Speech test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_speech_to_speech())
