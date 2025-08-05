#!/usr/bin/env python3
"""
Полный тест с максимальным логированием
"""

import os
import logging
import requests
import json
from app.config import config
from app.services.storage_service import StorageService
from app.services.elevenlabs_service import ElevenLabsService
from app.services.d_id_service import DIdService

# Настраиваем логирование
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_full_debug():
    """Полный тест с максимальным логированием"""
    
    print("🔥 ПОЛНЫЙ ТЕСТ С МАКСИМАЛЬНЫМ ЛОГИРОВАНИЕМ")
    print("=" * 60)
    
    try:
        # 1. Проверяем конфигурацию
        print("1️⃣ ПРОВЕРКА КОНФИГУРАЦИИ")
        print(f"   ElevenLabs API Key: {config.ELEVENLABS_API_KEY[:10] if config.ELEVENLABS_API_KEY else 'None'}...")
        print(f"   D-ID API Key: {config.D_ID_API_KEY[:10] if config.D_ID_API_KEY else 'None'}...")
        print(f"   Cloudinary URL: {config.CLOUDINARY_URL[:20] if config.CLOUDINARY_URL else 'None'}...")
        
        # 2. Создаем сервисы
        print("\n2️⃣ СОЗДАНИЕ СЕРВИСОВ")
        print("   🔥 СОЗДАНИЕ STORAGE SERVICE...")
        storage_service = StorageService()
        print("   ✅ STORAGE SERVICE СОЗДАН")
        
        print("   🔥 СОЗДАНИЕ ELEVENLABS SERVICE...")
        elevenlabs_service = ElevenLabsService()
        print("   ✅ ELEVENLABS SERVICE СОЗДАН")
        
        print("   🔥 СОЗДАНИЕ D-ID SERVICE...")
        d_id_service = DIdService()
        print("   ✅ D-ID SERVICE СОЗДАН")
        
        # 3. Тестируем загрузку файлов
        print("\n3️⃣ ТЕСТ ЗАГРУЗКИ ФАЙЛОВ")
        test_image_path = "test_files/test_image.jpg"
        test_audio_path = "test_files/test_audio.mp3"
        
        print(f"   🔥 ОТКРЫВАЕМ ИЗОБРАЖЕНИЕ: {test_image_path}")
        with open(test_image_path, "rb") as f:
            image_data = f.read()
        print(f"   ✅ ИЗОБРАЖЕНИЕ ПРОЧИТАНО: {len(image_data)} байт")
        
        print("   🔥 ЗАГРУЖАЕМ ИЗОБРАЖЕНИЕ В CLOUDINARY...")
        image_result = storage_service.upload_image(image_data, "test_image.jpg")
        print(f"   ✅ ИЗОБРАЖЕНИЕ ЗАГРУЖЕНО: {image_result.public_url}")
        
        print(f"   🔥 ОТКРЫВАЕМ АУДИО: {test_audio_path}")
        with open(test_audio_path, "rb") as f:
            audio_data = f.read()
        print(f"   ✅ АУДИО ПРОЧИТАНО: {len(audio_data)} байт")
        
        print("   🔥 ЗАГРУЖАЕМ АУДИО В CLOUDINARY...")
        audio_result = storage_service.upload_audio(audio_data, "test_audio.mp3")
        print(f"   ✅ АУДИО ЗАГРУЖЕНО: {audio_result.public_url}")
        
        # 4. Тестируем ElevenLabs
        print("\n4️⃣ ТЕСТ ELEVENLABS")
        print("   🔥 ВЫЗЫВАЕМ ELEVENLABS SPEECH TO SPEECH...")
        print(f"   Audio URL: {audio_result.public_url}")
        print(f"   Voice ID: {config.ELEVENLABS_DEFAULT_VOICE_ID}")
        
        processed_audio_data = elevenlabs_service.speech_to_speech_with_url(
            audio_result.public_url, 
            config.ELEVENLABS_DEFAULT_VOICE_ID
        )
        print(f"   ✅ ELEVENLABS ОБРАБОТКА ЗАВЕРШЕНА: {len(processed_audio_data)} байт")
        
        # 5. Сохраняем обработанное аудио
        print("\n5️⃣ СОХРАНЕНИЕ ОБРАБОТАННОГО АУДИО")
        processed_audio_path = "test_files/processed_audio.mp3"
        print(f"   🔥 СОХРАНЯЕМ ОБРАБОТАННОЕ АУДИО: {processed_audio_path}")
        with open(processed_audio_path, "wb") as f:
            f.write(processed_audio_data)
        print("   ✅ ОБРАБОТАННОЕ АУДИО СОХРАНЕНО")
        
        # 6. Загружаем обработанное аудио в Cloudinary
        print("\n6️⃣ ЗАГРУЗКА ОБРАБОТАННОГО АУДИО В CLOUDINARY")
        print(f"   🔥 ОТКРЫВАЕМ ОБРАБОТАННОЕ АУДИО: {processed_audio_path}")
        with open(processed_audio_path, "rb") as f:
            processed_audio_data = f.read()
        print(f"   ✅ ОБРАБОТАННОЕ АУДИО ПРОЧИТАНО: {len(processed_audio_data)} байт")
        
        print("   🔥 ЗАГРУЖАЕМ ОБРАБОТАННОЕ АУДИО В CLOUDINARY...")
        processed_audio_result = storage_service.upload_audio(processed_audio_data, "processed_audio.mp3")
        print(f"   ✅ ОБРАБОТАННОЕ АУДИО ЗАГРУЖЕНО: {processed_audio_result.public_url}")
        
        # 7. Тестируем D-ID API
        print("\n7️⃣ ТЕСТ D-ID API")
        print("   🔥 ВЫЗОВ D-ID API:")
        print(f"   Image URL: {image_result.public_url}")
        print(f"   Audio URL: {processed_audio_result.public_url}")
        print("   🔥 ВЫЗЫВАЕМ D-ID CREATE_TALK...")
        
        talk_id = d_id_service.create_talk(image_result.public_url, processed_audio_result.public_url)
        print(f"   ✅ D-ID CREATE_TALK ВЫЗВАН")
        print(f"   ✅ TALK_ID УСТАНОВЛЕН: {talk_id}")
        print(f"   ✅ TALK СОЗДАН В D-ID: {talk_id}")
        
        print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
        
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_full_debug() 