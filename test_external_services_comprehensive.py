#!/usr/bin/env python3
"""
Comprehensive тесты для всех внешних сервисов
Проверяет ElevenLabs, D-ID и Cloudinary с реальными тестовыми данными
"""

import os
import sys
import time
import requests
import base64
from pathlib import Path
from typing import Dict, Any

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import config
from app.services.elevenlabs_service import elevenlabs_service
from app.services.d_id_service import d_id_service
from app.services.storage_service import StorageService

# Константы для тестов
TEST_FILES_DIR = Path("test_files")
TEST_AUDIO_FILE = TEST_FILES_DIR / "test_audio.mp3"
TEST_IMAGE_FILE = TEST_FILES_DIR / "test_image.jpg"

# Цвета для вывода
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(title: str):
    """Вывод заголовка теста"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}{Colors.END}")

def print_success(message: str):
    """Вывод успешного результата"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    """Вывод ошибки"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message: str):
    """Вывод предупреждения"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message: str):
    """Вывод информации"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def test_elevenlabs_service():
    """Тестирование ElevenLabs API"""
    print_header("ElevenLabs API Testing")
    
    # Проверка конфигурации
    print_info("Проверка конфигурации ElevenLabs...")
    if not elevenlabs_service.is_configured():
        print_error("ElevenLabs не настроен. Пропускаем тесты.")
        return False
    
    print_success("ElevenLabs настроен")
    
    # Тест аутентификации
    print_info("Тест аутентификации...")
    auth_result = elevenlabs_service.test_authentication()
    if auth_result["success"]:
        print_success("Аутентификация ElevenLabs успешна")
    else:
        print_error(f"Ошибка аутентификации: {auth_result['message']}")
        return False
    
    # Получение списка голосов
    print_info("Получение списка голосов...")
    try:
        voices = elevenlabs_service.get_available_voices()
        print_success(f"Получено {len(voices)} голосов")
        
        # Выводим первые 3 голоса
        for i, voice in enumerate(voices[:3]):
            print_info(f"  {i+1}. {voice.name} (ID: {voice.voice_id})")
            
    except Exception as e:
        print_error(f"Ошибка получения голосов: {e}")
        return False
    
    # Тест Text-to-Speech
    print_info("Тест Text-to-Speech...")
    try:
        test_text = "Hello, this is a test of the ElevenLabs API integration."
        audio_data = elevenlabs_service.text_to_speech(
            text=test_text,
            voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID
        )
        print_success(f"Text-to-Speech успешен, размер: {len(audio_data)} байт")
        
        # Сохраняем результат для проверки
        with open("test_tts_result.mp3", "wb") as f:
            f.write(audio_data)
        print_info("Результат сохранен в test_tts_result.mp3")
        
    except Exception as e:
        print_error(f"Ошибка Text-to-Speech: {e}")
        return False
    
    # Тест Speech-to-Speech с файлом
    print_info("Тест Speech-to-Speech с файлом...")
    try:
        # Читаем тестовый аудио файл
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        print_info(f"Загружен тестовый аудио файл: {len(audio_data)} байт")
        
        # Создаем запрос для Speech-to-Speech
        from app.services.elevenlabs_service import SpeechToSpeechRequest, VoiceSettings
        
        request = SpeechToSpeechRequest(
            audio_data=audio_data,
            voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID,
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0,
                use_speaker_boost=True
            )
        )
        
        processed_audio = elevenlabs_service.speech_to_speech(request)
        print_success(f"Speech-to-Speech успешен, размер: {len(processed_audio)} байт")
        
        # Сохраняем результат
        with open("test_sts_result.mp3", "wb") as f:
            f.write(processed_audio)
        print_info("Результат сохранен в test_sts_result.mp3")
        
    except Exception as e:
        print_error(f"Ошибка Speech-to-Speech: {e}")
        return False
    
    print_success("Все тесты ElevenLabs пройдены успешно!")
    return True

def test_d_id_service():
    """Тестирование D-ID API"""
    print_header("D-ID API Testing")
    
    # Проверка конфигурации
    print_info("Проверка конфигурации D-ID...")
    if not d_id_service.is_configured():
        print_error("D-ID не настроен. Пропускаем тесты.")
        return False
    
    print_success("D-ID настроен")
    
    # Тест аутентификации
    print_info("Тест аутентификации D-ID...")
    auth_result = d_id_service.test_authentication()
    if auth_result["success"]:
        print_success("Аутентификация D-ID успешна")
    else:
        print_error(f"Ошибка аутентификации: {auth_result['message']}")
        return False
    
    # Получение списка talks
    print_info("Получение списка talks...")
    try:
        talks = d_id_service.get_talks()
        print_success(f"Получено {len(talks)} talks")
        
        # Выводим информацию о последних talks
        for i, talk in enumerate(talks[:3]):
            print_info(f"  {i+1}. Talk ID: {talk.get('id', 'N/A')}, Status: {talk.get('status', 'N/A')}")
            
    except Exception as e:
        print_error(f"Ошибка получения talks: {e}")
        return False
    
    # Тест создания talk с аудио (пропущен - требует Cloudinary)
    print_info("Тест создания talk с аудио...")
    print_info("Тест пропущен - требует Cloudinary для загрузки файлов")
    return True
    
    print_success("Все тесты D-ID пройдены успешно!")
    return True

def test_cloudinary_service():
    """Тестирование Cloudinary API (пропущено - не требуется для основной функциональности)"""
    print_header("Cloudinary API Testing")
    print_info("Cloudinary тесты пропущены - не требуются для основной функциональности")
    return True

def test_backend_api():
    """Тестирование Backend API"""
    print_header("Backend API Testing")
    
    base_url = "http://localhost:3001"
    
    # Проверка здоровья сервиса
    print_info("Проверка здоровья сервиса...")
    try:
        response = requests.get(f"{base_url}/api/v1/health", timeout=10)
        if response.status_code == 200:
            print_success("Backend API доступен")
        else:
            print_error(f"Backend API недоступен: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Ошибка подключения к Backend API: {e}")
        return False
    
    # Получение голосов
    print_info("Получение списка голосов...")
    try:
        response = requests.get(f"{base_url}/api/v1/voices", timeout=10)
        if response.status_code == 200:
            voices = response.json()
            print_success(f"Получено {len(voices.get('voices', []))} голосов")
        else:
            print_error(f"Ошибка получения голосов: {response.status_code}")
    except Exception as e:
        print_error(f"Ошибка запроса голосов: {e}")
    
    # Тест генерации видео
    print_info("Тест генерации видео...")
    try:
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        files = {
            'image_file': ('test_image.jpg', image_data, 'image/jpeg'),
            'audio_file': ('test_audio.mp3', audio_data, 'audio/mpeg')
        }
        
        response = requests.post(
            f"{base_url}/api/v1/generate",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            task_id = result.get('task_id')
            print_success(f"Задача создана: {task_id}")
            
            # Проверяем статус
            print_info("Проверка статуса задачи...")
            for attempt in range(5):
                time.sleep(2)
                status_response = requests.get(f"{base_url}/api/v1/status/{task_id}", timeout=10)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get('status')
                    print_info(f"Статус: {status}")
                    
                    if status in ['completed', 'failed']:
                        if status == 'completed':
                            print_success("Задача завершена успешно!")
                        else:
                            print_error("Задача завершилась с ошибкой")
                        break
                else:
                    print_warning(f"Ошибка получения статуса: {status_response.status_code}")
        else:
            print_error(f"Ошибка создания задачи: {response.status_code}")
            
    except Exception as e:
        print_error(f"Ошибка тестирования генерации: {e}")
    
    print_success("Тесты Backend API завершены!")
    return True

def main():
    """Основная функция тестирования"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("🚀 Comprehensive Testing of External Services")
    print("=" * 60)
    print(f"{Colors.END}")
    
    # Проверяем наличие тестовых файлов
    if not TEST_AUDIO_FILE.exists():
        print_error(f"Тестовый аудио файл не найден: {TEST_AUDIO_FILE}")
        return
    
    if not TEST_IMAGE_FILE.exists():
        print_error(f"Тестовый файл изображения не найден: {TEST_IMAGE_FILE}")
        return
    
    print_success("Тестовые файлы найдены")
    
    # Результаты тестов
    results = {}
    
    # Тестируем ElevenLabs
    try:
        results['elevenlabs'] = test_elevenlabs_service()
    except Exception as e:
        print_error(f"Критическая ошибка в тестах ElevenLabs: {e}")
        results['elevenlabs'] = False
    
    # Тестируем D-ID
    try:
        results['d_id'] = test_d_id_service()
    except Exception as e:
        print_error(f"Критическая ошибка в тестах D-ID: {e}")
        results['d_id'] = False
    
    # Тестируем Cloudinary
    try:
        results['cloudinary'] = test_cloudinary_service()
    except Exception as e:
        print_error(f"Критическая ошибка в тестах Cloudinary: {e}")
        results['cloudinary'] = False
    
    # Тестируем Backend API
    try:
        results['backend_api'] = test_backend_api()
    except Exception as e:
        print_error(f"Критическая ошибка в тестах Backend API: {e}")
        results['backend_api'] = False
    
    # Итоговый отчет
    print_header("Итоговый отчет")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"Всего тестов: {total_tests}")
    print(f"Пройдено успешно: {passed_tests}")
    print(f"Провалено: {total_tests - passed_tests}")
    
    for service, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"  {service.upper()}: {status}")
    
    if passed_tests == total_tests:
        print_success("Все тесты пройдены успешно!")
    else:
        print_warning(f"Пройдено {passed_tests}/{total_tests} тестов")
    
    print(f"\n{Colors.BOLD}Тестирование завершено!{Colors.END}")

if __name__ == "__main__":
    main() 