#!/usr/bin/env python3
"""
Автоматический тест фронтенда - симулирует точно то же самое, что делает пользователь
"""

import os
import time
import requests
import json
from pathlib import Path

def test_frontend_flow():
    """Тестирует полный флоу фронтенда"""
    
    print("🚀 ЗАПУСК АВТОМАТИЧЕСКОГО ТЕСТА ФРОНТЕНДА")
    print("=" * 60)
    
    # 1. Проверяем здоровье сервера
    print("1️⃣ Проверяем здоровье сервера...")
    try:
        response = requests.get("http://localhost:3001/api/v1/health", timeout=10)
        if response.status_code == 200:
            print("✅ Сервер работает")
        else:
            print(f"❌ Сервер вернул статус {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Не удалось подключиться к серверу: {e}")
        return
    
    # 2. Получаем список голосов
    print("2️⃣ Получаем список голосов...")
    try:
        response = requests.get("http://localhost:3001/api/v1/voices", timeout=10)
        if response.status_code == 200:
            data = response.json()
            voices = data.get("voices", [])
            print(f"✅ Получено {len(voices)} голосов")
            if voices:
                voice_id = voices[0]["voice_id"]  # Берем первый голос
                print(f"🎤 Выбран голос: {voice_id}")
            else:
                print("❌ Нет доступных голосов")
                return
        else:
            print(f"❌ Ошибка получения голосов: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Ошибка получения голосов: {e}")
        return
    
    # 3. Подготавливаем тестовые файлы (как фронтенд)
    print("3️⃣ Подготавливаем тестовые файлы...")
    
    # Используем существующие тестовые файлы
    test_files_dir = Path("test_files")
    image_path = test_files_dir / "test_image.jpg"
    audio_path = test_files_dir / "test_audio.mp3"
    
    if not image_path.exists():
        print(f"❌ Файл изображения не найден: {image_path}")
        return
    
    if not audio_path.exists():
        print(f"❌ Файл аудио не найден: {audio_path}")
        return
    
    print(f"📸 Изображение: {image_path}")
    print(f"🎵 Аудио: {audio_path}")
    
    # 4. Отправляем запрос на генерацию (как фронтенд)
    print("4️⃣ Отправляем запрос на генерацию видео...")
    
    try:
        with open(image_path, "rb") as img_file, open(audio_path, "rb") as aud_file:
            files = {
                "image_file": ("test_image.jpg", img_file, "image/jpeg"),
                "audio_file": ("test_audio.mp3", aud_file, "audio/mpeg")
            }
            data = {"voice_id": voice_id}
            
            print(f"📤 Отправляем запрос:")
            print(f"   - Изображение: {image_path.name}")
            print(f"   - Аудио: {audio_path.name}")
            print(f"   - Голос: {voice_id}")
            
            response = requests.post(
                "http://localhost:3001/api/v1/generate",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                task_id = result.get("task_id")
                print(f"✅ Задача создана: {task_id}")
                
                # 5. Опрашиваем статус
                print("5️⃣ Опрашиваем статус задачи...")
                max_attempts = 30
                attempt = 0
                
                while attempt < max_attempts:
                    try:
                        status_response = requests.get(
                            f"http://localhost:3001/api/v1/status/{task_id}",
                            timeout=10
                        )
                        
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            status = status_data.get("status")
                            progress = status_data.get("progress", 0)
                            
                            print(f"📊 Статус: {status} (Прогресс: {progress}%)")
                            
                            if status == "completed":
                                video_url = status_data.get("video_url")
                                print(f"🎉 ВИДЕО ГОТОВО: {video_url}")
                                return
                            elif status == "failed":
                                error = status_data.get("error_message", "Неизвестная ошибка")
                                print(f"❌ ОШИБКА: {error}")
                                return
                            elif status == "processing":
                                print("⏳ Обработка...")
                            else:
                                print(f"❓ Неизвестный статус: {status}")
                        else:
                            print(f"❌ Ошибка получения статуса: {status_response.status_code}")
                            return
                            
                    except Exception as e:
                        print(f"❌ Ошибка опроса статуса: {e}")
                        return
                    
                    time.sleep(2)  # Ждем 2 секунды
                    attempt += 1
                
                print("⏰ Таймаут ожидания")
                
            else:
                print(f"❌ Ошибка создания задачи: {response.status_code}")
                print(f"Ответ: {response.text}")
                
    except Exception as e:
        print(f"❌ Ошибка отправки запроса: {e}")

if __name__ == "__main__":
    test_frontend_flow() 