#!/usr/bin/env python3

import asyncio
import aiohttp
import base64
import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()

async def test_elevenlabs_api_direct():
    """Прямое тестирование ElevenLabs API"""
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    base_url = "https://api.elevenlabs.io/v1"
    
    print("=== Прямое тестирование ElevenLabs API ===")
    print(f"API Key: {api_key[:20]}...")
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    async with aiohttp.ClientSession() as session:
        # Тест 1: Проверяем доступные голоса
        print("\n1. Проверяем доступные голоса...")
        async with session.get(f"{base_url}/voices", headers=headers) as response:
            print(f"Status: {response.status}")
            if response.status == 200:
                voices_data = await response.json()
                print(f"✅ Получено голосов: {len(voices_data.get('voices', []))}")
            else:
                error_text = await response.text()
                print(f"❌ Ошибка: {error_text}")
        
        # Тест 2: Проверяем Speech-to-Speech endpoint
        print("\n2. Проверяем Speech-to-Speech endpoint...")
        
        # Создаем простой тестовый аудио (1 секунда тишины в формате WAV)
        import wave
        import struct
        import tempfile
        
        # Создаем временный WAV файл с тишиной
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_filename = temp_file.name
            
            with wave.open(temp_filename, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(44100)
                
                # Генерируем 1 секунду тишины
                for i in range(44100):
                    data = struct.pack('<h', 0)  # Тишина
                    wav_file.writeframes(data)
        
        # Читаем тестовый аудиофайл
        with open(temp_filename, 'rb') as f:
            test_audio_data = f.read()
        
        print(f"   Создан тестовый аудиофайл: {len(test_audio_data)} байт")
        
        # Тестируем Speech-to-Speech API
        payload = {
            "audio": base64.b64encode(test_audio_data).decode('utf-8'),
            "voice_id": "9BWtsMINqrJLrRacOk9x",  # Aria
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        print(f"   Отправляем запрос к /speech-to-speech...")
        async with session.post(
            f"{base_url}/speech-to-speech",
            json=payload,
            headers=headers
        ) as response:
            print(f"Status: {response.status}")
            response_text = await response.text()
            print(f"Response: {response_text}")
            
            if response.status == 200:
                result = await response.json()
                print(f"✅ Speech-to-Speech успешен!")
                if "audio" in result:
                    print(f"   Получено аудио: {len(result['audio'])} символов base64")
            else:
                print(f"❌ Ошибка Speech-to-Speech: {response_text}")
        
        # Удаляем временный файл
        os.unlink(temp_filename)
        
        # Тест 3: Проверяем другие endpoints
        print("\n3. Проверяем другие endpoints...")
        
        # Проверяем /models
        async with session.get(f"{base_url}/models", headers=headers) as response:
            print(f"Models endpoint status: {response.status}")
            if response.status == 200:
                models_data = await response.json()
                print(f"✅ Доступно моделей: {len(models_data.get('models', []))}")
            else:
                error_text = await response.text()
                print(f"❌ Ошибка models: {error_text}")

if __name__ == "__main__":
    asyncio.run(test_elevenlabs_api_direct()) 