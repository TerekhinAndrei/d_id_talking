#!/usr/bin/env python3

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()

async def test_text_to_speech():
    """Тестируем Text-to-Speech API"""
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    base_url = "https://api.elevenlabs.io/v1"
    
    print("=== Тестирование Text-to-Speech API ===")
    print(f"API Key: {api_key[:20]}...")
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    async with aiohttp.ClientSession() as session:
        # Тестируем Text-to-Speech API
        payload = {
            "text": "Hello, this is a test of the ElevenLabs Text-to-Speech API.",
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        print(f"   Отправляем запрос к /text-to-speech/9BWtsMINqrJLrRacOk9x...")
        async with session.post(
            f"{base_url}/text-to-speech/9BWtsMINqrJLrRacOk9x",
            json=payload,
            headers=headers
        ) as response:
            print(f"Status: {response.status}")
            
            if response.status == 200:
                audio_data = await response.read()
                print(f"✅ Text-to-Speech успешен!")
                print(f"   Получено аудио: {len(audio_data)} байт")
                
                # Сохраняем результат
                output_filename = "test_tts_result.mp3"
                with open(output_filename, 'wb') as f:
                    f.write(audio_data)
                print(f"   Результат сохранен в: {output_filename}")
            else:
                response_text = await response.text()
                print(f"❌ Ошибка Text-to-Speech: {response_text}")

if __name__ == "__main__":
    asyncio.run(test_text_to_speech()) 