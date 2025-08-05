#!/usr/bin/env python3
"""
Тест полного флоу с Cloudinary
"""

import os
import sys
import requests
import time
from dotenv import load_dotenv

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Устанавливаем CLOUDINARY_URL напрямую
os.environ['CLOUDINARY_URL'] = 'cloudinary://356337541638161:6Cv9NyGloRfzgtp7KOCU-e2GN5s@daeoqig4w'

def test_full_flow_with_cloudinary():
    """Тест полного флоу с Cloudinary"""
    print("🚀 Тест полного флоу с Cloudinary")
    print("=" * 50)
    
    # Базовый URL API
    base_url = "http://127.0.0.1:8000"
    
    try:
        # 1. Проверяем здоровье API
        print("\n1️⃣ Проверка здоровья API...")
        response = requests.get(f"{base_url}/api/v1/health")
        if response.status_code == 200:
            print("✅ API здоров")
        else:
            print(f"❌ API не отвечает: {response.status_code}")
            return False
        
        # 2. Получаем список голосов
        print("\n2️⃣ Получение списка голосов...")
        response = requests.get(f"{base_url}/api/v1/voices")
        if response.status_code == 200:
            voices = response.json()
            print(f"✅ Получено {len(voices)} голосов")
            if voices:
                voice_id = voices[0].get('voice_id', '21m00Tcm4TlvDq8ikWAM')
                print(f"   Используем голос: {voice_id}")
            else:
                voice_id = '21m00Tcm4TlvDq8ikWAM'
                print(f"   Используем голос по умолчанию: {voice_id}")
        else:
            print(f"❌ Ошибка получения голосов: {response.status_code}")
            voice_id = '21m00Tcm4TlvDq8ikWAM'
        
        # 3. Создаем задачу генерации видео
        print("\n3️⃣ Создание задачи генерации видео...")
        
        # Подготавливаем файлы
        image_file_path = "test_files/test_image.jpeg"
        audio_file_path = "test_files/test_audio.mp3"
        
        if not os.path.exists(image_file_path):
            print(f"❌ Файл изображения не найден: {image_file_path}")
            return False
        
        if not os.path.exists(audio_file_path):
            print(f"❌ Файл аудио не найден: {audio_file_path}")
            return False
        
        # Отправляем запрос на генерацию
        with open(image_file_path, 'rb') as img_file, open(audio_file_path, 'rb') as aud_file:
            files = {
                'image_file': ('test_image.jpeg', img_file, 'image/jpeg'),
                'audio_file': ('test_audio.mp3', aud_file, 'audio/mpeg')
            }
            data = {'voice_id': voice_id}
            
            response = requests.post(
                f"{base_url}/api/v1/generate",
                files=files,
                data=data
            )
        
        if response.status_code == 202:
            result = response.json()
            task_id = result['task_id']
            print(f"✅ Задача создана: {task_id}")
            print(f"   Статус: {result['status']}")
            print(f"   Прогресс: {result['progress']}%")
        else:
            print(f"❌ Ошибка создания задачи: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return False
        
        # 4. Отслеживаем прогресс задачи
        print("\n4️⃣ Отслеживание прогресса задачи...")
        max_attempts = 60  # Максимум 10 минут (60 * 10 секунд)
        attempt = 0
        
        while attempt < max_attempts:
            response = requests.get(f"{base_url}/api/v1/status/{task_id}")
            
            if response.status_code == 200:
                status_data = response.json()
                status = status_data['status']
                progress = status_data['progress']
                
                print(f"   Попытка {attempt + 1}: Статус = {status}, Прогресс = {progress}%")
                
                if status == "completed":
                    video_url = status_data.get('video_url')
                    talk_id = status_data.get('talk_id')
                    print(f"✅ Задача завершена успешно!")
                    print(f"   Видео URL: {video_url}")
                    print(f"   Talk ID: {talk_id}")
                    return True
                
                elif status == "failed":
                    error_message = status_data.get('error_message')
                    print(f"❌ Задача завершилась с ошибкой: {error_message}")
                    return False
                
                # Ждем 10 секунд перед следующей проверкой
                time.sleep(10)
                attempt += 1
            else:
                print(f"❌ Ошибка получения статуса: {response.status_code}")
                return False
        
        print(f"❌ Таймаут ожидания завершения задачи (максимум {max_attempts * 10} секунд)")
        return False
        
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

def test_error_scenarios():
    """Тест сценариев с ошибками"""
    print("\n🔍 Тест сценариев с ошибками")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000"
    
    # Тест 1: Некорректные файлы
    print("\n1️⃣ Тест с некорректными файлами...")
    try:
        with open("test_files/test.txt", 'w') as f:
            f.write("test content")
        
        with open("test_files/test.txt", 'rb') as file1, open("test_files/test.txt", 'rb') as file2:
            files = {
                'image_file': ('test.txt', file1, 'text/plain'),
                'audio_file': ('test.txt', file2, 'text/plain')
            }
            
            response = requests.post(f"{base_url}/api/v1/generate", files=files)
            print(f"   Статус: {response.status_code}")
            
            if response.status_code == 202:
                print("   ⚠️ Задача принята (ожидалось отклонение)")
            else:
                print("   ✅ Задача отклонена как ожидалось")
                
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 2: Несуществующая задача
    print("\n2️⃣ Тест несуществующей задачи...")
    response = requests.get(f"{base_url}/api/v1/status/non-existent-task")
    if response.status_code == 404:
        print("   ✅ Правильная обработка несуществующей задачи")
    else:
        print(f"   ❌ Неожиданный ответ: {response.status_code}")

if __name__ == "__main__":
    print("🚀 Запуск тестов полного флоу с Cloudinary")
    print("=" * 50)
    
    # Тест 1: Полный флоу
    success1 = test_full_flow_with_cloudinary()
    
    # Тест 2: Сценарии с ошибками
    test_error_scenarios()
    
    print("\n" + "=" * 50)
    if success1:
        print("🎉 Полный флоу с Cloudinary работает успешно!")
        print("✅ Система готова к использованию")
    else:
        print("❌ Полный флоу с Cloudinary не прошел")
        print("🔧 Проверьте логи сервера и повторите тест")
    
    print("=" * 50) 