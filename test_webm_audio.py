#!/usr/bin/env python3
"""
Тест с WebM аудио как фронтенд
"""

import os
import time
import requests
import json
from pathlib import Path

def test_webm_audio():
    """Тестирует WebM аудио как фронтенд"""
    
    print("🚀 ТЕСТ С WEBM АУДИО (КАК ФРОНТЕНД)")
    print("=" * 60)
    
    # Используем тот же голос, что и фронтенд
    voice_id = "GL7nHO5mDrxcHlJPJK5T"
    
    print(f"🎤 Тестируем голос: {voice_id}")
    
    # Создаем WebM аудио файл (симулируем фронтенд)
    test_files_dir = Path("test_files")
    image_path = test_files_dir / "test_image.jpg"
    
    # Создаем WebM аудио из MP3 (симулируем запись с микрофона)
    webm_audio_path = test_files_dir / "test_audio_webm.webm"
    
    # Конвертируем MP3 в WebM для теста
    import subprocess
    mp3_path = test_files_dir / "test_audio.mp3"
    
    if not webm_audio_path.exists():
        print("🔄 Конвертируем MP3 в WebM...")
        try:
            subprocess.run([
                "ffmpeg", "-i", str(mp3_path), 
                "-c:a", "libopus", 
                "-b:a", "128k", 
                str(webm_audio_path),
                "-y"
            ], check=True)
            print("✅ WebM аудио создано")
        except Exception as e:
            print(f"❌ Ошибка конвертации: {e}")
            return
    else:
        print("✅ WebM аудио уже существует")
    
    try:
        with open(image_path, "rb") as img_file, open(webm_audio_path, "rb") as aud_file:
            files = {
                "image_file": ("test_image.jpg", img_file, "image/jpeg"),
                "audio_file": ("audio_test.webm", aud_file, "audio/webm;codecs=opus")
            }
            data = {"voice_id": voice_id}
            
            print(f"📤 Отправляем запрос с WebM аудио...")
            print(f"   📸 Изображение: test_image.jpg")
            print(f"   🎵 Аудио: audio_test.webm (WebM)")
            print(f"   🎤 Голос: {voice_id}")
            
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
                
                # Опрашиваем статус
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
                    
                    time.sleep(2)
                    attempt += 1
                
                print("⏰ Таймаут ожидания")
                
            else:
                print(f"❌ Ошибка создания задачи: {response.status_code}")
                print(f"Ответ: {response.text}")
                
    except Exception as e:
        print(f"❌ Ошибка отправки запроса: {e}")

if __name__ == "__main__":
    test_webm_audio() 