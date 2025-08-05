#!/usr/bin/env python3
"""
Comprehensive тест для ElevenLabs API
Проверяет все функции ElevenLabs с реальными тестовыми данными
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import config
from app.services.elevenlabs_service import elevenlabs_service, SpeechToSpeechRequest, VoiceSettings

# Константы для тестов
TEST_FILES_DIR = Path("test_files")
TEST_AUDIO_FILE = TEST_FILES_DIR / "test_audio.mp3"

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

def test_authentication():
    """Тест аутентификации"""
    print_header("ElevenLabs Authentication Test")
    
    # Проверка конфигурации
    print_info("Проверка конфигурации ElevenLabs...")
    if not elevenlabs_service.is_configured():
        print_error("ElevenLabs не настроен. Проверьте ELEVENLABS_API_KEY")
        return False
    
    print_success("ElevenLabs настроен")
    
    # Тест аутентификации
    print_info("Тест аутентификации...")
    auth_result = elevenlabs_service.test_authentication()
    if auth_result["success"]:
        print_success("Аутентификация ElevenLabs успешна")
        return True
    else:
        print_error(f"Ошибка аутентификации: {auth_result['message']}")
        return False

def test_voices():
    """Тест работы с голосами"""
    print_header("ElevenLabs Voices Test")
    
    # Получение списка голосов
    print_info("Получение списка голосов...")
    try:
        voices = elevenlabs_service.get_available_voices()
        print_success(f"Получено {len(voices)} голосов")
        
        # Выводим информацию о голосах
        for i, voice in enumerate(voices[:5]):
            print_info(f"  {i+1}. {voice.name} (ID: {voice.voice_id})")
            print_info(f"      Категория: {voice.category}")
            if voice.description:
                print_info(f"      Описание: {voice.description[:50]}...")
        
        # Тест валидации голоса
        if voices:
            test_voice_id = voices[0].voice_id
            print_info(f"Тест валидации голоса: {test_voice_id}")
            
            is_valid = elevenlabs_service.validate_voice_id(test_voice_id)
            if is_valid:
                print_success(f"Голос {test_voice_id} валиден")
            else:
                print_error(f"Голос {test_voice_id} не найден")
            
            # Получение информации о голосе
            voice_info = elevenlabs_service.get_voice_by_id(test_voice_id)
            if voice_info:
                print_success(f"Получена информация о голосе: {voice_info.get('name', 'N/A')}")
            else:
                print_warning("Не удалось получить информацию о голосе")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка работы с голосами: {e}")
        return False

def test_text_to_speech():
    """Тест Text-to-Speech"""
    print_header("ElevenLabs Text-to-Speech Test")
    
    test_texts = [
        "Hello, this is a test of the ElevenLabs API integration.",
        "Привет, это тест интеграции с ElevenLabs API.",
        "Bonjour, ceci est un test de l'intégration API ElevenLabs."
    ]
    
    for i, text in enumerate(test_texts, 1):
        print_info(f"Тест {i}: {text[:50]}...")
        
        try:
            audio_data = elevenlabs_service.text_to_speech(
                text=text,
                voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID
            )
            
            print_success(f"Text-to-Speech успешен, размер: {len(audio_data)} байт")
            
            # Сохраняем результат
            filename = f"test_tts_result_{i}.mp3"
            with open(filename, "wb") as f:
                f.write(audio_data)
            print_info(f"Результат сохранен в {filename}")
            
        except Exception as e:
            print_error(f"Ошибка Text-to-Speech для теста {i}: {e}")
            return False
    
    print_success("Все тесты Text-to-Speech пройдены!")
    return True

def test_speech_to_speech():
    """Тест Speech-to-Speech"""
    print_header("ElevenLabs Speech-to-Speech Test")
    
    if not TEST_AUDIO_FILE.exists():
        print_error(f"Тестовый аудио файл не найден: {TEST_AUDIO_FILE}")
        return False
    
    # Читаем тестовый аудио файл
    print_info("Загрузка тестового аудио файла...")
    with open(TEST_AUDIO_FILE, "rb") as f:
        audio_data = f.read()
    
    print_info(f"Загружен аудио файл: {len(audio_data)} байт")
    
    # Тестируем разные настройки голоса
    voice_settings_list = [
        VoiceSettings(stability=0.5, similarity_boost=0.75, style=0.0, use_speaker_boost=True),
        VoiceSettings(stability=0.8, similarity_boost=0.5, style=0.2, use_speaker_boost=False),
        VoiceSettings(stability=0.3, similarity_boost=0.9, style=0.1, use_speaker_boost=True)
    ]
    
    for i, voice_settings in enumerate(voice_settings_list, 1):
        print_info(f"Тест {i} с настройками: stability={voice_settings.stability}, "
                  f"similarity_boost={voice_settings.similarity_boost}")
        
        try:
            request = SpeechToSpeechRequest(
                audio_data=audio_data,
                voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID,
                voice_settings=voice_settings
            )
            
            processed_audio = elevenlabs_service.speech_to_speech(request)
            print_success(f"Speech-to-Speech успешен, размер: {len(processed_audio)} байт")
            
            # Сохраняем результат
            filename = f"test_sts_result_{i}.mp3"
            with open(filename, "wb") as f:
                f.write(processed_audio)
            print_info(f"Результат сохранен в {filename}")
            
        except Exception as e:
            print_error(f"Ошибка Speech-to-Speech для теста {i}: {e}")
            return False
    
    print_success("Все тесты Speech-to-Speech пройдены!")
    return True

def test_speech_to_speech_with_url():
    """Тест Speech-to-Speech с URL"""
    print_header("ElevenLabs Speech-to-Speech with URL Test")
    
    # Сначала загружаем файл в Cloudinary для получения URL
    print_info("Загрузка аудио файла в Cloudinary...")
    try:
        from app.services.storage_service import StorageService
        storage_service = StorageService()
        
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        upload_result = storage_service.upload_audio(
            file_data=audio_data,
            filename="test_audio_for_sts.mp3",
            folder="test_elevenlabs"
        )
        
        audio_url = upload_result.public_url
        print_success(f"Аудио загружено: {audio_url}")
        
        # Тестируем Speech-to-Speech с URL
        print_info("Тест Speech-to-Speech с URL...")
        processed_audio = elevenlabs_service.speech_to_speech_with_url(
            audio_url=audio_url,
            voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID
        )
        
        print_success(f"Speech-to-Speech с URL успешен, размер: {len(processed_audio)} байт")
        
        # Сохраняем результат
        filename = "test_sts_url_result.mp3"
        with open(filename, "wb") as f:
            f.write(processed_audio)
        print_info(f"Результат сохранен в {filename}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка Speech-to-Speech с URL: {e}")
        return False

def test_error_handling():
    """Тест обработки ошибок"""
    print_header("ElevenLabs Error Handling Test")
    
    # Тест с неверным voice_id
    print_info("Тест с неверным voice_id...")
    try:
        audio_data = elevenlabs_service.text_to_speech(
            text="Test",
            voice_id="invalid_voice_id"
        )
        print_warning("Неожиданно успешный запрос с неверным voice_id")
    except Exception as e:
        print_success(f"Ожидаемая ошибка с неверным voice_id: {type(e).__name__}")
    
    # Тест с пустым текстом
    print_info("Тест с пустым текстом...")
    try:
        audio_data = elevenlabs_service.text_to_speech(
            text="",
            voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID
        )
        print_warning("Неожиданно успешный запрос с пустым текстом")
    except Exception as e:
        print_success(f"Ожидаемая ошибка с пустым текстом: {type(e).__name__}")
    
    print_success("Тесты обработки ошибок завершены")
    return True

def main():
    """Основная функция тестирования"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("🎤 ElevenLabs API Comprehensive Testing")
    print("=" * 60)
    print(f"{Colors.END}")
    
    # Проверяем наличие тестовых файлов
    if not TEST_AUDIO_FILE.exists():
        print_error(f"Тестовый аудио файл не найден: {TEST_AUDIO_FILE}")
        return
    
    print_success("Тестовые файлы найдены")
    
    # Результаты тестов
    results = {}
    
    # Тестируем аутентификацию
    results['authentication'] = test_authentication()
    
    # Тестируем голоса
    if results['authentication']:
        results['voices'] = test_voices()
    else:
        results['voices'] = False
    
    # Тестируем Text-to-Speech
    if results['authentication']:
        results['text_to_speech'] = test_text_to_speech()
    else:
        results['text_to_speech'] = False
    
    # Тестируем Speech-to-Speech
    if results['authentication']:
        results['speech_to_speech'] = test_speech_to_speech()
    else:
        results['speech_to_speech'] = False
    
    # Тестируем Speech-to-Speech с URL
    if results['authentication']:
        results['speech_to_speech_url'] = test_speech_to_speech_with_url()
    else:
        results['speech_to_speech_url'] = False
    
    # Тестируем обработку ошибок
    results['error_handling'] = test_error_handling()
    
    # Итоговый отчет
    print_header("ElevenLabs Test Results")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"Всего тестов: {total_tests}")
    print(f"Пройдено успешно: {passed_tests}")
    print(f"Провалено: {total_tests - passed_tests}")
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    if passed_tests == total_tests:
        print_success("Все тесты ElevenLabs пройдены успешно!")
    else:
        print_warning(f"Пройдено {passed_tests}/{total_tests} тестов")
    
    print(f"\n{Colors.BOLD}Тестирование ElevenLabs завершено!{Colors.END}")

if __name__ == "__main__":
    main() 