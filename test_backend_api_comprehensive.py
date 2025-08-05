#!/usr/bin/env python3
"""
Comprehensive тест для Backend API
Проверяет все эндпоинты backend с реальными тестовыми данными
"""

import os
import sys
import time
import requests
from pathlib import Path
from typing import Dict, Any

# Константы для тестов
TEST_FILES_DIR = Path("test_files")
TEST_AUDIO_FILE = TEST_FILES_DIR / "test_audio.mp3"
TEST_IMAGE_FILE = TEST_FILES_DIR / "test_image.jpg"

# Настройки API
BASE_URL = "http://localhost:3001"
API_TIMEOUT = 30

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

def test_health_check():
    """Тест проверки здоровья сервиса"""
    print_header("Backend Health Check Test")
    
    try:
        print_info("Проверка здоровья сервиса...")
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_success("Backend API доступен")
            print_info(f"Статус: {data.get('status', 'N/A')}")
            print_info(f"Версия: {data.get('version', 'N/A')}")
            return True
        else:
            print_error(f"Backend API недоступен: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Не удалось подключиться к Backend API. Убедитесь, что сервер запущен.")
        return False
    except Exception as e:
        print_error(f"Ошибка проверки здоровья: {e}")
        return False

def test_voices_endpoints():
    """Тест эндпоинтов голосов"""
    print_header("Backend Voices Endpoints Test")
    
    try:
        # Получение списка голосов
        print_info("Получение списка голосов...")
        response = requests.get(f"{BASE_URL}/api/v1/voices", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            voices = data.get('voices', [])
            print_success(f"Получено {len(voices)} голосов")
            
            # Выводим информацию о первых голосах
            for i, voice in enumerate(voices[:3]):
                print_info(f"  {i+1}. {voice.get('name', 'N/A')} (ID: {voice.get('voice_id', 'N/A')})")
            
            # Тест валидации голоса
            if voices:
                test_voice_id = voices[0].get('voice_id')
                print_info(f"Тест валидации голоса: {test_voice_id}")
                
                validate_response = requests.get(
                    f"{BASE_URL}/api/v1/voices/{test_voice_id}/validate",
                    timeout=10
                )
                
                if validate_response.status_code == 200:
                    validate_data = validate_response.json()
                    is_valid = validate_data.get('valid', False)
                    if is_valid:
                        print_success(f"Голос {test_voice_id} валиден")
                    else:
                        print_warning(f"Голос {test_voice_id} не найден")
                else:
                    print_warning(f"Ошибка валидации: {validate_response.status_code}")
                
                # Тест получения голоса по ID
                print_info(f"Получение информации о голосе: {test_voice_id}")
                voice_response = requests.get(
                    f"{BASE_URL}/api/v1/voices/{test_voice_id}",
                    timeout=10
                )
                
                if voice_response.status_code == 200:
                    voice_data = voice_response.json()
                    print_success(f"Получена информация о голосе: {voice_data.get('name', 'N/A')}")
                else:
                    print_warning(f"Ошибка получения голоса: {voice_response.status_code}")
            
            return True
        else:
            print_error(f"Ошибка получения голосов: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Ошибка тестирования голосов: {e}")
        return False

def test_generation_endpoint():
    """Тест эндпоинта генерации"""
    print_header("Backend Generation Endpoint Test")
    
    if not TEST_AUDIO_FILE.exists() or not TEST_IMAGE_FILE.exists():
        print_error("Тестовые файлы не найдены")
        return False
    
    try:
        # Читаем тестовые файлы
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        print_info(f"Загружены тестовые файлы: изображение {len(image_data)} байт, аудио {len(audio_data)} байт")
        
        # Подготавливаем файлы для отправки
        files = {
            'image_file': ('test_image.jpg', image_data, 'image/jpeg'),
            'audio_file': ('test_audio.mp3', audio_data, 'audio/mpeg')
        }
        
        # Отправляем запрос на генерацию
        print_info("Отправка запроса на генерацию...")
        response = requests.post(
            f"{BASE_URL}/api/v1/generate",
            files=files,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            task_id = data.get('task_id')
            status = data.get('status')
            
            print_success(f"Задача создана: {task_id}")
            print_info(f"Статус: {status}")
            
            # Проверяем статус задачи
            print_info("Проверка статуса задачи...")
            max_attempts = 10
            for attempt in range(max_attempts):
                time.sleep(3)  # Ждем 3 секунды между проверками
                
                status_response = requests.get(
                    f"{BASE_URL}/api/v1/status/{task_id}",
                    timeout=10
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    current_status = status_data.get('status')
                    progress = status_data.get('progress', 0)
                    
                    print_info(f"Попытка {attempt + 1}: статус = {current_status}, прогресс = {progress}%")
                    
                    if current_status in ['completed', 'failed']:
                        if current_status == 'completed':
                            result_url = status_data.get('result_url')
                            print_success(f"Задача завершена! URL: {result_url}")
                        else:
                            error_message = status_data.get('error_message', 'Неизвестная ошибка')
                            print_error(f"Задача завершилась с ошибкой: {error_message}")
                        break
                    elif current_status in ['pending', 'processing']:
                        print_info("Задача в процессе обработки...")
                    else:
                        print_warning(f"Неизвестный статус: {current_status}")
                        break
                else:
                    print_warning(f"Ошибка получения статуса: {status_response.status_code}")
                    break
            else:
                print_warning("Превышено время ожидания завершения задачи")
            
            return True
        else:
            print_error(f"Ошибка создания задачи: {response.status_code}")
            print_error(f"Ответ: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Ошибка тестирования генерации: {e}")
        return False

def test_status_endpoint():
    """Тест эндпоинта статуса"""
    print_header("Backend Status Endpoint Test")
    
    try:
        # Тест с несуществующим task_id
        print_info("Тест с несуществующим task_id...")
        response = requests.get(
            f"{BASE_URL}/api/v1/status/non-existent-task-id",
            timeout=10
        )
        
        if response.status_code == 404:
            print_success("Ожидаемая ошибка 404 для несуществующего task_id")
        else:
            print_warning(f"Неожиданный статус для несуществующего task_id: {response.status_code}")
        
        # Тест с некорректным task_id
        print_info("Тест с некорректным task_id...")
        response = requests.get(
            f"{BASE_URL}/api/v1/status/invalid-task-id",
            timeout=10
        )
        
        if response.status_code in [400, 404]:
            print_success("Ожидаемая ошибка для некорректного task_id")
        else:
            print_warning(f"Неожиданный статус для некорректного task_id: {response.status_code}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования статуса: {e}")
        return False

def test_error_handling():
    """Тест обработки ошибок"""
    print_header("Backend Error Handling Test")
    
    try:
        # Тест с неверным методом
        print_info("Тест с неверным HTTP методом...")
        response = requests.put(f"{BASE_URL}/api/v1/health", timeout=10)
        
        if response.status_code == 405:
            print_success("Ожидаемая ошибка 405 для неверного метода")
        else:
            print_warning(f"Неожиданный статус для неверного метода: {response.status_code}")
        
        # Тест с неверным эндпоинтом
        print_info("Тест с неверным эндпоинтом...")
        response = requests.get(f"{BASE_URL}/api/v1/non-existent-endpoint", timeout=10)
        
        if response.status_code == 404:
            print_success("Ожидаемая ошибка 404 для неверного эндпоинта")
        else:
            print_warning(f"Неожиданный статус для неверного эндпоинта: {response.status_code}")
        
        # Тест с неверными данными
        print_info("Тест с неверными данными...")
        response = requests.post(
            f"{BASE_URL}/api/v1/generate",
            data={"invalid": "data"},
            timeout=10
        )
        
        if response.status_code in [400, 422]:
            print_success("Ожидаемая ошибка для неверных данных")
        else:
            print_warning(f"Неожиданный статус для неверных данных: {response.status_code}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования обработки ошибок: {e}")
        return False

def test_performance():
    """Тест производительности"""
    print_header("Backend Performance Test")
    
    try:
        # Тест времени ответа health check
        print_info("Тест времени ответа health check...")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=10)
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            print_success(f"Health check ответил за {response_time:.3f} секунд")
            
            if response_time < 1.0:
                print_success("Производительность health check в норме")
            else:
                print_warning("Медленный ответ health check")
        else:
            print_error(f"Health check не отвечает: {response.status_code}")
            return False
        
        # Тест времени ответа voices
        print_info("Тест времени ответа voices...")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/api/v1/voices", timeout=10)
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            print_success(f"Voices ответил за {response_time:.3f} секунд")
            
            if response_time < 2.0:
                print_success("Производительность voices в норме")
            else:
                print_warning("Медленный ответ voices")
        else:
            print_error(f"Voices не отвечает: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования производительности: {e}")
        return False

def test_cors():
    """Тест CORS"""
    print_header("Backend CORS Test")
    
    try:
        # Тест preflight запроса
        print_info("Тест CORS preflight...")
        response = requests.options(
            f"{BASE_URL}/api/v1/health",
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("CORS preflight успешен")
            
            # Проверяем CORS заголовки
            cors_headers = response.headers.get('Access-Control-Allow-Origin')
            if cors_headers:
                print_info(f"CORS заголовки: {cors_headers}")
            else:
                print_warning("CORS заголовки не найдены")
        else:
            print_warning(f"CORS preflight вернул статус: {response.status_code}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования CORS: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("🚀 Backend API Comprehensive Testing")
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
    print_info(f"Тестируем Backend API по адресу: {BASE_URL}")
    
    # Результаты тестов
    results = {}
    
    # Тестируем health check
    results['health_check'] = test_health_check()
    
    # Тестируем эндпоинты голосов
    if results['health_check']:
        results['voices_endpoints'] = test_voices_endpoints()
    else:
        results['voices_endpoints'] = False
    
    # Тестируем эндпоинт генерации
    if results['health_check']:
        results['generation_endpoint'] = test_generation_endpoint()
    else:
        results['generation_endpoint'] = False
    
    # Тестируем эндпоинт статуса
    if results['health_check']:
        results['status_endpoint'] = test_status_endpoint()
    else:
        results['status_endpoint'] = False
    
    # Тестируем обработку ошибок
    if results['health_check']:
        results['error_handling'] = test_error_handling()
    else:
        results['error_handling'] = False
    
    # Тестируем производительность
    if results['health_check']:
        results['performance'] = test_performance()
    else:
        results['performance'] = False
    
    # Тестируем CORS
    if results['health_check']:
        results['cors'] = test_cors()
    else:
        results['cors'] = False
    
    # Итоговый отчет
    print_header("Backend API Test Results")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"Всего тестов: {total_tests}")
    print(f"Пройдено успешно: {passed_tests}")
    print(f"Провалено: {total_tests - passed_tests}")
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    if passed_tests == total_tests:
        print_success("Все тесты Backend API пройдены успешно!")
    else:
        print_warning(f"Пройдено {passed_tests}/{total_tests} тестов")
    
    print(f"\n{Colors.BOLD}Тестирование Backend API завершено!{Colors.END}")

if __name__ == "__main__":
    main() 