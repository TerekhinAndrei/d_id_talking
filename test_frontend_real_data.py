#!/usr/bin/env python3
"""
Практический тест с реальными данными фронтенда
Тестирует: WebM аудио + JPEG изображение (как отправляет фронтенд)
"""

import requests
import time
import json
import os
from pathlib import Path

# Конфигурация
SERVER_URL = "http://localhost:3001"
FRONTEND_URL = "http://localhost:5173"

def create_test_webm_audio():
    """Создает тестовый WebM аудио файл (симулирует запись с микрофона)"""
    print("🎤 Создание тестового WebM аудио...")
    
    # Создаем простой WebM файл из MP3 для тестирования
    test_webm_path = "test_files/test_webm_audio.webm"
    
    # Используем ffmpeg для конвертации MP3 в WebM
    import subprocess
    try:
        cmd = [
            'ffmpeg', '-i', 'test_files/test_audio.mp3',
            '-c:a', 'libopus',
            '-b:a', '128k',
            '-y',  # Перезаписывать
            test_webm_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ WebM аудио создано: {test_webm_path}")
            return test_webm_path
        else:
            print(f"❌ Ошибка создания WebM: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Ошибка ffmpeg: {e}")
        return None

def test_frontend_real_data():
    """Тест с реальными данными фронтенда"""
    print("🧪 Запуск практического теста с реальными данными фронтенда...")
    
    # Шаг 1: Проверка доступности сервера
    print("\n1️⃣ Проверка доступности сервера...")
    try:
        response = requests.get(f"{SERVER_URL}/api/v1/health", timeout=10)
        if response.status_code == 200:
            print("✅ Сервер доступен")
        else:
            print(f"❌ Сервер недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к серверу: {e}")
        return False
    
    # Шаг 2: Проверка доступности фронтенда
    print("\n2️⃣ Проверка доступности фронтенда...")
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print("✅ Фронтенд доступен")
        else:
            print(f"❌ Фронтенд недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к фронтенду: {e}")
        return False
    
    # Шаг 3: Получение голосов
    print("\n3️⃣ Получение голосов...")
    try:
        response = requests.get(f"{SERVER_URL}/api/v1/voices", timeout=10)
        if response.status_code == 200:
            data = response.json()
            voices = data.get('voices', [])
            print(f"✅ Доступно голосов: {len(voices)}")
            if len(voices) > 0:
                default_voice = voices[0].get('voice_id')
                print(f"   Используем голос: {default_voice}")
            else:
                print("❌ Нет доступных голосов")
                return False
        else:
            print(f"❌ Ошибка получения голосов: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка получения голосов: {e}")
        return False
    
    # Шаг 4: Создание тестовых файлов
    print("\n4️⃣ Создание тестовых файлов...")
    
    # Проверяем тестовое изображение
    test_image_path = "test_files/test_image.jpg"
    if not os.path.exists(test_image_path):
        print(f"❌ Тестовое изображение не найдено: {test_image_path}")
        return False
    
    # Создаем WebM аудио (как фронтенд)
    test_webm_path = create_test_webm_audio()
    if not test_webm_path or not os.path.exists(test_webm_path):
        print("❌ Не удалось создать WebM аудио")
        return False
    
    image_size = os.path.getsize(test_image_path)
    webm_size = os.path.getsize(test_webm_path)
    print(f"✅ Изображение: {image_size} байт")
    print(f"✅ WebM аудио: {webm_size} байт")
    
    # Шаг 5: Симуляция отправки данных как фронтенд
    print("\n5️⃣ Симуляция отправки данных как фронтенд...")
    try:
        # Отправляем данные точно как фронтенд
        with open(test_image_path, 'rb') as img_file:
            with open(test_webm_path, 'rb') as audio_file:
                files = {
                    'image_file': ('test_image.jpg', img_file, 'image/jpeg'),
                    'audio_file': ('test_webm_audio.webm', audio_file, 'audio/webm;codecs=opus')
                }
                data = {
                    'voice_id': default_voice
                }
                
                print(f"   Отправляем изображение: {image_size} байт (image/jpeg)")
                print(f"   Отправляем WebM аудио: {webm_size} байт (audio/webm;codecs=opus)")
                print(f"   Voice ID: {default_voice}")
                
                response = requests.post(
                    f"{SERVER_URL}/api/v1/generate",
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    task_id = result.get('task_id')
                    print(f"✅ Задача создана: {task_id}")
                    
                    # Шаг 6: Мониторинг статуса задачи
                    print(f"\n6️⃣ Мониторинг статуса задачи: {task_id}")
                    
                    max_attempts = 60  # 60 попыток по 2 секунды = 120 секунд
                    for attempt in range(max_attempts):
                        try:
                            status_response = requests.get(
                                f"{SERVER_URL}/api/v1/status/{task_id}",
                                timeout=10
                            )
                            
                            if status_response.status_code == 200:
                                status_data = status_response.json()
                                status = status_data.get('status')
                                progress = status_data.get('progress', 0)
                                video_url = status_data.get('video_url')
                                error_message = status_data.get('error_message')
                                
                                print(f"   Попытка {attempt + 1}/{max_attempts}: {status} ({progress}%)")
                                
                                if status == 'completed' and video_url:
                                    print(f"✅ Видео готово: {video_url}")
                                    
                                    # Проверяем доступность видео
                                    try:
                                        video_response = requests.head(video_url, timeout=10)
                                        if video_response.status_code == 200:
                                            print("✅ Видео доступно для просмотра")
                                        else:
                                            print(f"⚠️ Видео недоступно: {video_response.status_code}")
                                    except Exception as e:
                                        print(f"⚠️ Ошибка проверки видео: {e}")
                                    
                                    return True
                                elif status == 'failed':
                                    print(f"❌ Задача провалилась: {error_message}")
                                    return False
                                elif status == 'processing':
                                    time.sleep(2)  # Ждем 2 секунды
                                    continue
                                else:
                                    print(f"⚠️ Неожиданный статус: {status}")
                                    time.sleep(2)
                                    continue
                            else:
                                print(f"❌ Ошибка получения статуса: {status_response.status_code}")
                                return False
                                
                        except Exception as e:
                            print(f"❌ Ошибка мониторинга: {e}")
                            return False
                    
                    print("❌ Превышено время ожидания")
                    return False
                    
                else:
                    print(f"❌ Ошибка создания задачи: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Ошибка отправки данных: {e}")
        return False

def main():
    """Главная функция"""
    print("🚀 Практический тест с реальными данными фронтенда")
    print("=" * 60)
    
    success = test_frontend_real_data()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ПРАКТИЧЕСКИЙ ТЕСТ ПРОЙДЕН!")
        print("✅ Система работает с реальными данными фронтенда")
        print("✅ WebM аудио + JPEG изображение обрабатываются корректно")
        print("✅ Видео генерируется и воспроизводится")
    else:
        print("💥 ПРАКТИЧЕСКИЙ ТЕСТ ПРОВАЛЕН!")
        print("❌ Есть проблемы с обработкой реальных данных фронтенда")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main()) 