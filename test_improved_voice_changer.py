#!/usr/bin/env python3
"""
Test script for improved voice changer with audio analysis
"""

import asyncio
import logging
import sys
import os
import numpy as np

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.elevenlabs_service import ElevenLabsService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_audio():
    """Create test audio data with different characteristics"""
    
    # Create different types of test audio
    sample_rate = 48000
    duration = 1.0  # 1 second
    
    # Generate time array
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # 1. Speech-like audio (sine wave with modulation)
    speech_freq = 440  # A4 note
    speech_audio = np.sin(2 * np.pi * speech_freq * t) * 0.5
    speech_audio += np.sin(2 * np.pi * speech_freq * 2 * t) * 0.3  # harmonics
    speech_audio = (speech_audio * 32767).astype(np.int16)  # Convert to 16-bit
    
    # 2. Silence
    silence_audio = np.zeros(int(sample_rate * duration), dtype=np.int16)
    
    # 3. Noise
    noise_audio = np.random.normal(0, 1000, int(sample_rate * duration)).astype(np.int16)
    
    return {
        'speech': speech_audio.tobytes(),
        'silence': silence_audio.tobytes(),
        'noise': noise_audio.tobytes()
    }

async def test_improved_voice_changer():
    """Test the improved voice changer functionality"""
    
    try:
        # Initialize service
        service = ElevenLabsService()
        
        # Check if configured
        if not service.is_configured():
            logger.error("ElevenLabs service not configured!")
            return
        
        # Create test audio
        test_audios = create_test_audio()
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        for audio_type, audio_data in test_audios.items():
            logger.info(f"\n=== Testing {audio_type.upper()} audio ===")
            logger.info(f"Audio size: {len(audio_data)} bytes")
            
            # Test the improved streaming method
            chunk_count = 0
            total_bytes = 0
            
            async for chunk in service.speech_to_speech_stream_sdk(
                audio_data=audio_data,
                voice_id=voice_id
            ):
                chunk_count += 1
                total_bytes += len(chunk)
                logger.info(f"Received chunk {chunk_count}: {len(chunk)} bytes")
                
                # Limit to first few chunks for testing
                if chunk_count >= 3:
                    break
            
            logger.info(f"Completed {audio_type} test: {chunk_count} chunks, {total_bytes} total bytes")
        
        logger.info("\n✅ All tests completed successfully!")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_improved_voice_changer())
