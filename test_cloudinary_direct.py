#!/usr/bin/env python3
"""
Тест Cloudinary с прямым указанием URL
"""

import os
import sys
from dotenv import load_dotenv

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Устанавливаем CLOUDINARY_URL напрямую
os.environ['CLOUDINARY_URL'] = 'cloudinary://356337541638161:6Cv9NyGloRfzgtp7KOCU-e2GN5s@daeoqig4w'

from app.services.storage_service import StorageService, StorageConfigurationError

def test_cloudinary_connection():
    """Тест реального подключения к Cloudinary"""
    print("🔍 Тест реального подключения к Cloudinary")
    print("=" * 50)
    
    # Проверяем наличие CLOUDINARY_URL
    cloudinary_url = os.getenv('CLOUDINARY_URL')
    print(f"✅ CLOUDINARY_URL найден: {cloudinary_url[:20]}...")
    
    try:
        # Создаем экземпляр сервиса
        print("\n1️⃣ Создание StorageService...")
        storage_service = StorageService()
        print("✅ StorageService создан успешно")
        
        # Тестируем подключение
        print("\n2️⃣ Тест подключения к Cloudinary...")
        if storage_service.test_connection():
            print("✅ Подключение к Cloudinary успешно")
        else:
            print("❌ Ошибка подключения к Cloudinary")
            return False
        
        # Тестируем загрузку тестового изображения
        print("\n3️⃣ Тест загрузки изображения...")
        test_image_data = b"fake_image_data_for_testing"
        result = storage_service.upload_image(test_image_data, "test_image.jpg")
        print(f"✅ Изображение загружено: {result.public_url}")
        print(f"   File ID: {result.file_id}")
        print(f"   Размер: {result.size} байт")
        print(f"   Формат: {result.format}")
        
        # Тестируем загрузку тестового аудио
        print("\n4️⃣ Тест загрузки аудио...")
        test_audio_data = b"fake_audio_data_for_testing"
        result = storage_service.upload_audio(test_audio_data, "test_audio.mp3")
        print(f"✅ Аудио загружено: {result.public_url}")
        print(f"   File ID: {result.file_id}")
        print(f"   Размер: {result.size} байт")
        print(f"   Формат: {result.format}")
        
        # Тестируем получение списка файлов
        print("\n5️⃣ Тест получения списка файлов...")
        files = storage_service.list_files("d_id_talking", max_results=10)
        print(f"✅ Найдено {len(files)} файлов в папке d_id_talking")
        
        # Тестируем получение публичного URL
        print("\n6️⃣ Тест получения публичного URL...")
        if files:
            file_id = files[0]['public_id']
            url = storage_service.get_public_url(file_id)
            print(f"✅ Публичный URL получен: {url}")
        
        print("\n🎉 Все тесты Cloudinary пройдены успешно!")
        return True
        
    except StorageConfigurationError as e:
        print(f"❌ Ошибка конфигурации: {e}")
        return False
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

def test_cloudinary_with_real_files():
    """Тест с реальными файлами"""
    print("\n🔍 Тест Cloudinary с реальными файлами")
    print("=" * 50)
    
    try:
        storage_service = StorageService()
        
        # Читаем реальный тестовый файл
        test_file_path = "test_files/test_image.jpeg"
        if os.path.exists(test_file_path):
            print(f"\n1️⃣ Загрузка реального файла: {test_file_path}")
            with open(test_file_path, 'rb') as f:
                file_data = f.read()
            
            result = storage_service.upload_image(file_data, "real_test_image.jpeg")
            print(f"✅ Реальный файл загружен: {result.public_url}")
            print(f"   Размер: {result.size} байт")
            print(f"   Формат: {result.format}")
            
            # Тестируем с полученным URL
            print(f"\n2️⃣ Тест URL в браузере: {result.public_url}")
            print("   Откройте эту ссылку в браузере для проверки")
            
            return True
        else:
            print(f"❌ Тестовый файл не найден: {test_file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при работе с реальными файлами: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск тестов Cloudinary")
    print("=" * 50)
    
    # Тест 1: Базовое подключение
    success1 = test_cloudinary_connection()
    
    # Тест 2: Работа с реальными файлами
    success2 = test_cloudinary_with_real_files()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 Все тесты Cloudinary пройдены успешно!")
        print("✅ Cloudinary готов к использованию в проекте")
    else:
        print("❌ Некоторые тесты Cloudinary не прошли")
        print("🔧 Проверьте конфигурацию и повторите тесты")
    
    print("=" * 50) 