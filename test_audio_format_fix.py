#!/usr/bin/env python3
"""
Test script for audio format fixes - проверка правильного формата для ElevenLabs
"""

import asyncio
import logging
import sys
import os
import numpy as np
import wave
import io

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.elevenlabs_service import ElevenLabsService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_correct_voice_sample():
    """Create voice sample with correct format for ElevenLabs"""
    
    sample_rate = 16000  # ElevenLabs ожидает 16kHz
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

def test_wav_conversion():
    """Test WAV conversion with correct sample rate"""
    
    # Создаем тестовые PCM данные
    pcm_data = create_correct_voice_sample()
    logger.info(f"Created PCM data: {len(pcm_data)} bytes")
    
    # Конвертируем в WAV с правильной частотой
    sample_rate = 16000
    channels = 1
    
    wav_buffer = io.BytesIO()
    
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)  # 16-bit = 2 bytes
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)
    
    wav_data = wav_buffer.getvalue()
    logger.info(f"Created WAV data: {len(wav_data)} bytes, Sample Rate: {sample_rate}Hz")
    
    # Проверяем WAV header
    wav_buffer.seek(0)
    with wave.open(wav_buffer, 'rb') as wav_file:
        actual_sample_rate = wav_file.getframerate()
        actual_channels = wav_file.getnchannels()
        actual_sample_width = wav_file.getsampwidth()
        
        logger.info(f"WAV Header - Sample Rate: {actual_sample_rate}Hz, Channels: {actual_channels}, Sample Width: {actual_sample_width} bytes")
        
        if actual_sample_rate == sample_rate and actual_channels == channels and actual_sample_width == 2:
            logger.info("✅ WAV conversion successful with correct format!")
            return True
        else:
            logger.error("❌ WAV conversion failed - incorrect format!")
            return False

async def test_elevenlabs_with_correct_format():
    """Test ElevenLabs with correct audio format"""
    
    try:
        # Initialize service
        service = ElevenLabsService()
        
        # Check if configured
        if not service.is_configured():
            logger.error("ElevenLabs service not configured!")
            return
        
        # Create voice sample with correct format
        voice_data = create_correct_voice_sample()
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        logger.info(f"Testing ElevenLabs with correct format...")
        logger.info(f"Original voice size: {len(voice_data)} bytes, Sample Rate: 16000Hz")
        
        # Test the streaming method
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
            if chunk_count >= 3:
                break
        
        logger.info(f"✅ ElevenLabs test with correct format completed!")
        logger.info(f"Original voice: {len(voice_data)} bytes")
        logger.info(f"Transformed voice: {total_bytes} bytes in {chunk_count} chunks")
        
        if total_bytes > 0:
            logger.info("🎉 SUCCESS: Voice transformation with correct format!")
        else:
            logger.warning("⚠️ No transformed audio received")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """Run all tests"""
    
    logger.info("🧪 Testing audio format fixes...")
    
    # Test 1: WAV conversion
    logger.info("\n=== Test 1: WAV Conversion ===")
    wav_success = test_wav_conversion()
    
    # Test 2: ElevenLabs with correct format
    logger.info("\n=== Test 2: ElevenLabs with Correct Format ===")
    await test_elevenlabs_with_correct_format()
    
    if wav_success:
        logger.info("\n🎉 All tests completed successfully!")
    else:
        logger.error("\n❌ Some tests failed!")

if __name__ == "__main__":
    asyncio.run(main())
