#!/usr/bin/env python3
"""
Тестирование полного флоу создания видео
POST /generate -> GET /status/{task_id}
"""

import requests
import time
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_full_flow():
    """Тестирование полного флоу создания видео"""
    print("🎬 Тестирование полного флоу создания видео")
    print("=" * 50)
    
    # 1. Проверяем health endpoint
    print("1️⃣ Проверка health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        if response.status_code == 200:
            print("✅ Health check пройден")
        else:
            print(f"❌ Health check провален: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к серверу: {e}")
        return False
    
    # 2. Получаем список голосов
    print("\n2️⃣ Получение списка голосов...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/voices")
        if response.status_code == 200:
            voices = response.json()
            print(f"✅ Получено {len(voices)} голосов")
            if voices:
                selected_voice = voices[0]["voice_id"]
                print(f"🎤 Выбран голос: {selected_voice}")
            else:
                print("⚠️ Список голосов пуст")
                selected_voice = "21m00Tcm4TlvDq8ikWAM"  # Rachel по умолчанию
        else:
            print(f"❌ Ошибка получения голосов: {response.status_code}")
            selected_voice = "21m00Tcm4TlvDq8ikWAM"  # Rachel по умолчанию
    except Exception as e:
        print(f"❌ Ошибка получения голосов: {e}")
        selected_voice = "21m00Tcm4TlvDq8ikWAM"  # Rachel по умолчанию
    
    # 3. Подготавливаем тестовые файлы
    print("\n3️⃣ Подготовка тестовых файлов...")
    
    # Проверяем наличие тестовых файлов
    test_files_dir = Path("test_files")
    if not test_files_dir.exists():
        print("❌ Папка test_files не найдена")
        return False
    
    image_file = test_files_dir / "test_image.jpeg"
    audio_file = test_files_dir / "test_audio.mp3"
    
    if not image_file.exists():
        print(f"❌ Файл изображения не найден: {image_file}")
        return False
    
    if not audio_file.exists():
        print(f"❌ Файл аудио не найден: {audio_file}")
        return False
    
    print(f"✅ Изображение: {image_file} ({image_file.stat().st_size} байт)")
    print(f"✅ Аудио: {audio_file} ({audio_file.stat().st_size} байт)")
    
    # 4. Отправляем запрос на создание видео
    print("\n4️⃣ Отправка запроса на создание видео...")
    try:
        with open(image_file, "rb") as img, open(audio_file, "rb") as aud:
            files = {
                "image_file": ("test_image.jpeg", img, "image/jpeg"),
                "audio_file": ("test_audio.mp3", aud, "audio/mpeg")
            }
            data = {
                "voice_id": selected_voice
            }
            
            response = requests.post(
                f"{BASE_URL}/api/v1/generate",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 202:
                result = response.json()
                task_id = result.get("task_id")
                print(f"✅ Задача создана! Task ID: {task_id}")
            else:
                print(f"❌ Ошибка создания задачи: {response.status_code}")
                print(f"Ответ: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Ошибка отправки запроса: {e}")
        return False
    
    # 5. Опрашиваем статус задачи
    print("\n5️⃣ Опрос статуса задачи...")
    max_attempts = 30  # Максимум 30 попыток (5 минут)
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(f"{BASE_URL}/api/v1/status/{task_id}")
            
            if response.status_code == 200:
                status_data = response.json()
                status = status_data.get("status")
                progress = status_data.get("progress", 0)
                error_message = status_data.get("error_message")
                video_url = status_data.get("video_url")
                talk_id = status_data.get("talk_id")
                
                print(f"📊 Попытка {attempt + 1}/{max_attempts}")
                print(f"   Статус: {status}")
                print(f"   Прогресс: {progress}%")
                
                if talk_id:
                    print(f"   Talk ID: {talk_id}")
                
                if error_message:
                    print(f"   ❌ Ошибка: {error_message}")
                
                if video_url:
                    print(f"   🎥 Видео готово: {video_url}")
                    print("\n🎉 ПОЛНЫЙ ФЛОУ УСПЕШНО ЗАВЕРШЕН!")
                    return True
                
                if status == "failed":
                    print(f"   ❌ Задача завершилась с ошибкой: {error_message}")
                    return False
                
                if status == "done":
                    print("   ✅ Задача завершена успешно!")
                    return True
                
                # Ждем перед следующей попыткой
                time.sleep(10)  # 10 секунд между попытками
                attempt += 1
                
            else:
                print(f"❌ Ошибка получения статуса: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Ошибка опроса статуса: {e}")
            return False
    
    print(f"⏰ Превышено время ожидания ({max_attempts * 10} секунд)")
    return False

def test_error_scenarios():
    """Тестирование сценариев с ошибками"""
    print("\n🔍 Тестирование сценариев с ошибками")
    print("=" * 50)
    
    # Тест с несуществующим task_id
    print("1️⃣ Тест с несуществующим task_id...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/status/non-existent-task")
        if response.status_code == 404:
            print("✅ Корректная обработка несуществующего task_id")
        else:
            print(f"❌ Неожиданный ответ: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    # Тест с некорректными файлами
    print("\n2️⃣ Тест с некорректными файлами...")
    try:
        # Создаем некорректные файлы
        files = {
            "image_file": ("test.txt", b"not an image", "text/plain"),
            "audio_file": ("test.txt", b"not audio", "text/plain")
        }
        data = {"voice_id": "21m00Tcm4TlvDq8ikWAM"}
        
        response = requests.post(
            f"{BASE_URL}/api/v1/generate",
            files=files,
            data=data,
            timeout=30
        )
        
        if response.status_code == 422:  # Validation Error
            print("✅ Корректная обработка некорректных файлов")
        else:
            print(f"❌ Неожиданный ответ: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

def main():
    """Основная функция тестирования"""
    print("🚀 Запуск тестирования полного флоу создания видео")
    print("=" * 60)
    
    # Тестируем основной флоу
    success = test_full_flow()
    
    if success:
        print("\n✅ ОСНОВНОЙ ФЛОУ ПРОЙДЕН УСПЕШНО!")
    else:
        print("\n❌ ОСНОВНОЙ ФЛОУ ПРОВАЛЕН!")
    
    # Тестируем сценарии с ошибками
    test_error_scenarios()
    
    print("\n" + "=" * 60)
    print("🏁 Тестирование завершено")

if __name__ == "__main__":
    main() 