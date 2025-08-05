#!/usr/bin/env python3

import wave
import struct
import os

def create_test_audio():
    """Create a realistic test audio file"""
    
    # Audio parameters
    sample_rate = 44100
    duration = 3  # 3 seconds
    frequency = 440  # 440 Hz (note A)
    
    # Create WAV file
    filename = "test_files/test_audio_real.wav"
    os.makedirs("test_files", exist_ok=True)
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        # Generate sine wave
        for i in range(sample_rate * duration):
            # Create a simple sine wave
            t = i / sample_rate
            value = int(32767 * 0.3 * (t * frequency * 2 * 3.14159))
            # Ensure value is within range
            value = max(-32768, min(32767, value))
            data = struct.pack('<h', value)
            wav_file.writeframes(data)
    
    print(f"Created test audio file: {filename}")
    print(f"Size: {os.path.getsize(filename)} bytes")
    print(f"Duration: {duration} seconds")
    print(f"Sample rate: {sample_rate} Hz")

if __name__ == "__main__":
    create_test_audio() 