#!/usr/bin/env python3

import asyncio
import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()

async def test_elevenlabs_connection():
    """Тестируем реальное подключение к ElevenLabs API"""
    
    from app.services.elevenlabs_service import elevenlabs_service
    
    print("=== Тестирование подключения к ElevenLabs API ===")
    print(f"API Key: {elevenlabs_service.api_key[:20]}...")
    print(f"Configured: {elevenlabs_service.is_configured()}")
    
    try:
        # Тест 1: Получение списка голосов
        print("\n1. Тестируем получение списка голосов...")
        voices = await elevenlabs_service.get_available_voices()
        print(f"✅ Получено голосов: {len(voices)}")
        
        if voices:
            print("Первые 3 голоса:")
            for i, voice in enumerate(voices[:3]):
                print(f"  {i+1}. {voice.name} (ID: {voice.voice_id}) - {voice.category}")
        
        # Тест 2: Валидация первого доступного голоса
        print("\n2. Тестируем валидацию первого доступного голоса...")
        first_voice_id = voices[0].voice_id if voices else None
        if first_voice_id:
            is_valid = await elevenlabs_service.validate_voice_id(first_voice_id)
            print(f"✅ Голос {first_voice_id} валиден: {is_valid}")
        else:
            print("❌ Нет доступных голосов")
        
        # Тест 3: Получение деталей первого голоса
        print("\n3. Тестируем получение деталей голоса...")
        if first_voice_id:
            voice_details = await elevenlabs_service.get_voice_by_id(first_voice_id)
            if voice_details:
                print(f"✅ Голос найден: {voice_details.name}")
                print(f"   Категория: {voice_details.category}")
                print(f"   Описание: {voice_details.description}")
            else:
                print("❌ Голос не найден")
        else:
            print("❌ Нет доступных голосов")
        
        # Тест 4: Тестируем с реальным аудиофайлом
        print("\n4. Тестируем Speech-to-Speech с реальным аудиофайлом...")
        
        # Используем существующий тестовый аудиофайл
        test_audio_path = "test_files/test_audio.mp3"
        
        if os.path.exists(test_audio_path):
            with open(test_audio_path, 'rb') as f:
                test_audio_data = f.read()
            print(f"   Используем существующий аудиофайл: {len(test_audio_data)} байт")
        else:
            print(f"   Файл {test_audio_path} не найден, пропускаем тест")
            return
        
        # Тестируем Speech-to-Speech
        from app.services.elevenlabs_service import SpeechToSpeechRequest
        
        request = SpeechToSpeechRequest(
            audio_data=test_audio_data,
            voice_id=first_voice_id
        )
        
        try:
            processed_audio = await elevenlabs_service.speech_to_speech(request)
            print(f"✅ Speech-to-Speech успешен! Получено {len(processed_audio)} байт")
            
            # Сохраняем результат
            output_filename = "test_processed_audio.mp3"
            with open(output_filename, 'wb') as f:
                f.write(processed_audio)
            print(f"   Результат сохранен в: {output_filename}")
            
        except Exception as e:
            print(f"❌ Ошибка Speech-to-Speech: {str(e)}")
        
        print("\n=== Все тесты завершены ===")
        
        print("\n=== Все тесты завершены ===")
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_elevenlabs_connection()) 