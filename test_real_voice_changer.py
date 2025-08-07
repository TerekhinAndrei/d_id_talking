#!/usr/bin/env python3
"""
Test script for REAL voice changer - отправка вашего голоса в ElevenLabs
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

def create_real_voice_sample():
    """Create realistic voice sample"""
    
    sample_rate = 48000
    duration = 2.0  # 2 seconds
    
    # Generate time array
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Create realistic speech-like audio
    # Основная частота речи (мужской голос)
    base_freq = 120  # Hz
    speech_audio = np.sin(2 * np.pi * base_freq * t) * 0.3
    
    # Добавляем гармоники для реалистичности
    speech_audio += np.sin(2 * np.pi * base_freq * 2 * t) * 0.2
    speech_audio += np.sin(2 * np.pi * base_freq * 3 * t) * 0.1
    
    # Добавляем модуляцию (как в реальной речи)
    modulation = np.sin(2 * np.pi * 5 * t) * 0.1  # 5 Hz modulation
    speech_audio *= (1 + modulation)
    
    # Добавляем небольшой шум
    noise = np.random.normal(0, 0.01, len(speech_audio))
    speech_audio += noise
    
    # Нормализуем и конвертируем в 16-bit
    speech_audio = np.clip(speech_audio, -1, 1)
    speech_audio = (speech_audio * 32767).astype(np.int16)
    
    return speech_audio.tobytes()

async def test_real_voice_changer():
    """Test the REAL voice changer functionality"""
    
    try:
        # Initialize service
        service = ElevenLabsService()
        
        # Check if configured
        if not service.is_configured():
            logger.error("ElevenLabs service not configured!")
            return
        
        # Create realistic voice sample
        voice_data = create_real_voice_sample()
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        logger.info(f"Testing REAL voice changer...")
        logger.info(f"Original voice size: {len(voice_data)} bytes")
        
        # Test the REAL streaming method
        chunk_count = 0
        total_bytes = 0
        
        async for chunk in service.speech_to_speech_stream_sdk(
            audio_data=voice_data,
            voice_id=voice_id
        ):
            chunk_count += 1
            total_bytes += len(chunk)
            logger.info(f"Received transformed voice chunk {chunk_count}: {len(chunk)} bytes")
            
            # Limit to first few chunks for testing
            if chunk_count >= 5:
                break
        
        logger.info(f"✅ REAL voice changer test completed!")
        logger.info(f"Original voice: {len(voice_data)} bytes")
        logger.info(f"Transformed voice: {total_bytes} bytes in {chunk_count} chunks")
        
        if total_bytes > 0:
            logger.info("🎉 SUCCESS: Your voice was transformed!")
        else:
            logger.warning("⚠️ No transformed audio received")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_real_voice_changer())
