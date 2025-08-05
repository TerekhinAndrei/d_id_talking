#!/usr/bin/env python3
"""
Автоматический тест полного пользовательского сценария фронтенда
Тестирует: загрузка изображения + запись аудио + отправка на сервер
"""

import requests
import time
import json
import os
from pathlib import Path

# Конфигурация
SERVER_URL = "http://localhost:3001"
FRONTEND_URL = "http://localhost:5173"
TEST_IMAGE_PATH = "test_files/test_image.jpg"
TEST_AUDIO_PATH = "test_files/test_audio.mp3"

def test_frontend_user_scenario():
    """Тест полного пользовательского сценария"""
    print("🧪 Запуск теста полного пользовательского сценария...")
    
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
    
    # Шаг 3: Проверка голосов
    print("\n3️⃣ Проверка доступности голосов...")
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
    
    # Шаг 4: Проверка тестовых файлов
    print("\n4️⃣ Проверка тестовых файлов...")
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"❌ Тестовое изображение не найдено: {TEST_IMAGE_PATH}")
        return False
    if not os.path.exists(TEST_AUDIO_PATH):
        print(f"❌ Тестовое аудио не найдено: {TEST_AUDIO_PATH}")
        return False
    
    image_size = os.path.getsize(TEST_IMAGE_PATH)
    audio_size = os.path.getsize(TEST_AUDIO_PATH)
    print(f"✅ Изображение: {image_size} байт")
    print(f"✅ Аудио: {audio_size} байт")
    
    # Шаг 5: Симуляция отправки данных пользователем
    print("\n5️⃣ Симуляция отправки данных пользователем...")
    try:
        # Подготавливаем данные как фронтенд
        with open(TEST_IMAGE_PATH, 'rb') as img_file:
            with open(TEST_AUDIO_PATH, 'rb') as audio_file:
                files = {
                    'image_file': ('test_image.jpg', img_file, 'image/jpeg'),
                    'audio_file': ('test_audio.mp3', audio_file, 'audio/mpeg')
                }
                data = {
                    'voice_id': default_voice
                }
                
                print(f"   Отправляем изображение: {image_size} байт")
                print(f"   Отправляем аудио: {audio_size} байт")
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
                    
                    max_attempts = 30  # 30 попыток по 2 секунды = 60 секунд
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
    print("🚀 Автоматический тест пользовательского сценария")
    print("=" * 50)
    
    success = test_frontend_user_scenario()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ТЕСТ ПРОЙДЕН! Пользовательский сценарий работает корректно")
    else:
        print("💥 ТЕСТ ПРОВАЛЕН! Есть проблемы в пользовательском сценарии")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main()) 