#!/usr/bin/env python3
"""
Comprehensive тест для D-ID API
Проверяет все функции D-ID с реальными тестовыми данными
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import config
from app.services.d_id_service import d_id_service, DIdScriptType, DIdProviderType
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

def test_authentication():
    """Тест аутентификации D-ID"""
    print_header("D-ID Authentication Test")
    
    # Проверка конфигурации
    print_info("Проверка конфигурации D-ID...")
    if not d_id_service.is_configured():
        print_error("D-ID не настроен. Проверьте D_ID_API_KEY")
        return False
    
    print_success("D-ID настроен")
    
    # Тест аутентификации
    print_info("Тест аутентификации...")
    auth_result = d_id_service.test_authentication()
    if auth_result["success"]:
        print_success("Аутентификация D-ID успешна")
        return True
    else:
        print_error(f"Ошибка аутентификации: {auth_result['message']}")
        return False

def test_get_talks():
    """Тест получения списка talks"""
    print_header("D-ID Get Talks Test")
    
    try:
        talks = d_id_service.get_talks()
        print_success(f"Получено {len(talks)} talks")
        
        # Выводим информацию о последних talks
        for i, talk in enumerate(talks[:5]):
            talk_id = talk.get('id', 'N/A')
            status = talk.get('status', 'N/A')
            created_at = talk.get('created_at', 'N/A')
            
            print_info(f"  {i+1}. Talk ID: {talk_id}")
            print_info(f"      Статус: {status}")
            print_info(f"      Создан: {created_at}")
            
            # Если есть result_url, показываем его
            if talk.get('result_url'):
                print_info(f"      Результат: {talk.get('result_url')}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка получения talks: {e}")
        return False

def test_get_talk_by_id():
    """Тест получения talk по ID"""
    print_header("D-ID Get Talk by ID Test")
    
    try:
        # Сначала получаем список talks
        talks = d_id_service.get_talks()
        if not talks:
            print_warning("Нет доступных talks для тестирования")
            return True
        
        # Берем первый talk для тестирования
        test_talk = talks[0]
        talk_id = test_talk.get('id')
        
        if not talk_id:
            print_warning("Talk ID не найден")
            return True
        
        print_info(f"Тестируем talk с ID: {talk_id}")
        
        # Получаем детальную информацию о talk
        talk_details = d_id_service.get_talk_by_id(talk_id)
        
        if talk_details:
            print_success(f"Получена информация о talk: {talk_id}")
            print_info(f"  Статус: {talk_details.get('status', 'N/A')}")
            print_info(f"  Создан: {talk_details.get('created_at', 'N/A')}")
            print_info(f"  Обновлен: {talk_details.get('updated_at', 'N/A')}")
            
            if talk_details.get('result_url'):
                print_info(f"  Результат: {talk_details.get('result_url')}")
        else:
            print_warning("Не удалось получить информацию о talk")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка получения talk по ID: {e}")
        return False

def test_create_talk_with_audio():
    """Тест создания talk с аудио"""
    print_header("D-ID Create Talk with Audio Test")
    
    if not TEST_AUDIO_FILE.exists() or not TEST_IMAGE_FILE.exists():
        print_error("Тестовые файлы не найдены")
        return False
    
    try:
        # Загружаем файлы в Cloudinary
        print_info("Загрузка файлов в Cloudinary...")
        storage_service = StorageService()
        
        # Загружаем изображение
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        image_upload_result = storage_service.upload_image(
            file_data=image_data,
            filename="test_image_d_id.jpg",
            folder="test_d_id"
        )
        
        image_url = image_upload_result.public_url
        print_success(f"Изображение загружено: {image_url}")
        
        # Загружаем аудио
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        audio_upload_result = storage_service.upload_audio(
            file_data=audio_data,
            filename="test_audio_d_id.mp3",
            folder="test_d_id"
        )
        
        audio_url = audio_upload_result.public_url
        print_success(f"Аудио загружено: {audio_url}")
        
        # Создаем talk
        print_info("Создание talk в D-ID...")
        talk_id = d_id_service.create_talk_with_audio(
            image_url=image_url,
            audio_url=audio_url
        )
        
        print_success(f"Talk создан с ID: {talk_id}")
        
        # Проверяем статус
        print_info("Проверка статуса talk...")
        max_attempts = 12  # Увеличиваем количество попыток
        for attempt in range(max_attempts):
            status_result = d_id_service.get_talk_status(talk_id)
            status = status_result["status"]
            
            print_info(f"Попытка {attempt + 1}: статус = {status}")
            
            if status in ["done", "failed"]:
                if status == "done":
                    result_url = status_result.get("result_url")
                    print_success(f"Talk завершен! URL: {result_url}")
                else:
                    print_error("Talk завершился с ошибкой")
                break
            elif status in ["created", "started"]:
                print_info("Talk в процессе обработки...")
                time.sleep(10)  # Увеличиваем время ожидания
            else:
                print_warning(f"Неизвестный статус: {status}")
                break
        else:
            print_warning("Превышено время ожидания завершения talk")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка создания talk с аудио: {e}")
        return False

def test_create_talk_with_text():
    """Тест создания talk с текстом"""
    print_header("D-ID Create Talk with Text Test")
    
    if not TEST_IMAGE_FILE.exists():
        print_error("Тестовый файл изображения не найден")
        return False
    
    try:
        # Загружаем изображение в Cloudinary
        print_info("Загрузка изображения в Cloudinary...")
        storage_service = StorageService()
        
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        image_upload_result = storage_service.upload_image(
            file_data=image_data,
            filename="test_image_text.jpg",
            folder="test_d_id_text"
        )
        
        image_url = image_upload_result.public_url
        print_success(f"Изображение загружено: {image_url}")
        
        # Тестируем разные тексты
        test_texts = [
            "Hello, this is a test of the D-ID API integration.",
            "Привет, это тест интеграции с D-ID API.",
            "Bonjour, ceci est un test de l'intégration API D-ID."
        ]
        
        for i, text in enumerate(test_texts, 1):
            print_info(f"Тест {i}: создание talk с текстом...")
            
            try:
                talk_id = d_id_service.create_talk_with_text(
                    image_url=image_url,
                    text=text,
                    provider=DIdProviderType.ELEVENLABS,
                    voice_id=config.ELEVENLABS_DEFAULT_VOICE_ID
                )
                
                print_success(f"Talk {i} создан с ID: {talk_id}")
                
                # Проверяем статус
                print_info(f"Проверка статуса talk {i}...")
                max_attempts = 8
                for attempt in range(max_attempts):
                    status_result = d_id_service.get_talk_status(talk_id)
                    status = status_result["status"]
                    
                    print_info(f"  Попытка {attempt + 1}: статус = {status}")
                    
                    if status in ["done", "failed"]:
                        if status == "done":
                            result_url = status_result.get("result_url")
                            print_success(f"Talk {i} завершен! URL: {result_url}")
                        else:
                            print_error(f"Talk {i} завершился с ошибкой")
                        break
                    elif status in ["created", "started"]:
                        print_info(f"  Talk {i} в процессе обработки...")
                        time.sleep(8)
                    else:
                        print_warning(f"  Неизвестный статус: {status}")
                        break
                else:
                    print_warning(f"Превышено время ожидания завершения talk {i}")
                
            except Exception as e:
                print_error(f"Ошибка создания talk {i}: {e}")
                return False
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка создания talk с текстом: {e}")
        return False

def test_error_handling():
    """Тест обработки ошибок D-ID"""
    print_header("D-ID Error Handling Test")
    
    # Тест с неверным talk_id
    print_info("Тест с неверным talk_id...")
    try:
        talk_details = d_id_service.get_talk_by_id("invalid_talk_id")
        print_warning("Неожиданно успешный запрос с неверным talk_id")
    except Exception as e:
        print_success(f"Ожидаемая ошибка с неверным talk_id: {type(e).__name__}")
    
    # Тест создания talk с неверными URL
    print_info("Тест создания talk с неверными URL...")
    try:
        talk_id = d_id_service.create_talk_with_audio(
            image_url="https://invalid-url.com/image.jpg",
            audio_url="https://invalid-url.com/audio.mp3"
        )
        print_warning("Неожиданно успешный запрос с неверными URL")
    except Exception as e:
        print_success(f"Ожидаемая ошибка с неверными URL: {type(e).__name__}")
    
    print_success("Тесты обработки ошибок завершены")
    return True

def main():
    """Основная функция тестирования"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("🎬 D-ID API Comprehensive Testing")
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
    
    # Тестируем аутентификацию
    results['authentication'] = test_authentication()
    
    # Тестируем получение talks
    if results['authentication']:
        results['get_talks'] = test_get_talks()
    else:
        results['get_talks'] = False
    
    # Тестируем получение talk по ID
    if results['authentication']:
        results['get_talk_by_id'] = test_get_talk_by_id()
    else:
        results['get_talk_by_id'] = False
    
    # Тестируем создание talk с аудио
    if results['authentication']:
        results['create_talk_with_audio'] = test_create_talk_with_audio()
    else:
        results['create_talk_with_audio'] = False
    
    # Тестируем создание talk с текстом
    if results['authentication']:
        results['create_talk_with_text'] = test_create_talk_with_text()
    else:
        results['create_talk_with_text'] = False
    
    # Тестируем обработку ошибок
    results['error_handling'] = test_error_handling()
    
    # Итоговый отчет
    print_header("D-ID Test Results")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"Всего тестов: {total_tests}")
    print(f"Пройдено успешно: {passed_tests}")
    print(f"Провалено: {total_tests - passed_tests}")
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    if passed_tests == total_tests:
        print_success("Все тесты D-ID пройдены успешно!")
    else:
        print_warning(f"Пройдено {passed_tests}/{total_tests} тестов")
    
    print(f"\n{Colors.BOLD}Тестирование D-ID завершено!{Colors.END}")

if __name__ == "__main__":
    main() 