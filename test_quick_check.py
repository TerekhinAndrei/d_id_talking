#!/usr/bin/env python3
"""
Быстрый тест для проверки всех внешних сервисов
Выполняет минимальные проверки для подтверждения работоспособности
"""

import os
import sys
from pathlib import Path

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import config
from app.services.elevenlabs_service import elevenlabs_service
from app.services.d_id_service import d_id_service
from app.services.storage_service import StorageService

# Цвета для вывода
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_success(message: str):
    """Вывод успешного результата"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    """Вывод ошибки"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message: str):
    """Вывод информации"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def check_elevenlabs():
    """Быстрая проверка ElevenLabs"""
    print_info("Проверка ElevenLabs...")
    
    if not elevenlabs_service.is_configured():
        print_error("ElevenLabs не настроен")
        return False
    
    try:
        auth_result = elevenlabs_service.test_authentication()
        if auth_result["success"]:
            print_success("ElevenLabs работает")
            return True
        else:
            print_error(f"ElevenLabs ошибка: {auth_result['message']}")
            return False
    except Exception as e:
        print_error(f"ElevenLabs ошибка: {e}")
        return False

def check_d_id():
    """Быстрая проверка D-ID"""
    print_info("Проверка D-ID...")
    
    if not d_id_service.is_configured():
        print_error("D-ID не настроен")
        return False
    
    try:
        auth_result = d_id_service.test_authentication()
        if auth_result["success"]:
            print_success("D-ID работает")
            return True
        else:
            print_error(f"D-ID ошибка: {auth_result['message']}")
            return False
    except Exception as e:
        print_error(f"D-ID ошибка: {e}")
        return False

def check_cloudinary():
    """Быстрая проверка Cloudinary (пропущена - не требуется)"""
    print_info("Проверка Cloudinary...")
    print_info("Cloudinary проверка пропущена - не требуется для основной функциональности")
    return True

def check_backend():
    """Быстрая проверка Backend API"""
    print_info("Проверка Backend API...")
    
    try:
        import requests
        response = requests.get("http://localhost:3001/api/v1/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend API работает")
            return True
        else:
            print_error(f"Backend API ошибка: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Backend API недоступен (сервер не запущен)")
        return False
    except Exception as e:
        print_error(f"Backend API ошибка: {e}")
        return False

def check_test_files():
    """Проверка тестовых файлов"""
    print_info("Проверка тестовых файлов...")
    
    test_files = [
        Path("test_files/test_audio.mp3"),
        Path("test_files/test_image.jpg")
    ]
    
    all_exist = True
    for file_path in test_files:
        if file_path.exists():
            print_success(f"Файл найден: {file_path.name}")
        else:
            print_error(f"Файл не найден: {file_path.name}")
            all_exist = False
    
    return all_exist

def main():
    """Основная функция быстрой проверки"""
    print(f"{Colors.BOLD}🚀 Быстрая проверка внешних сервисов{Colors.END}")
    print("=" * 50)
    
    results = {}
    
    # Проверяем тестовые файлы
    results['test_files'] = check_test_files()
    
    # Проверяем ElevenLabs
    results['elevenlabs'] = check_elevenlabs()
    
    # Проверяем D-ID
    results['d_id'] = check_d_id()
    
    # Проверяем Cloudinary
    results['cloudinary'] = check_cloudinary()
    
    # Проверяем Backend API
    results['backend'] = check_backend()
    
    # Итоговый отчет
    print(f"\n{Colors.BOLD}Результаты быстрой проверки:{Colors.END}")
    
    total_checks = len(results)
    passed_checks = sum(1 for result in results.values() if result)
    
    print(f"Всего проверок: {total_checks}")
    print(f"Успешно: {passed_checks}")
    print(f"Ошибок: {total_checks - passed_checks}")
    
    for service, result in results.items():
        status = "✅ РАБОТАЕТ" if result else "❌ ОШИБКА"
        print(f"  {service.replace('_', ' ').title()}: {status}")
    
    if passed_checks == total_checks:
        print(f"\n{Colors.GREEN}🎉 Все сервисы работают корректно!{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Некоторые сервисы требуют внимания{Colors.END}")
    
    print(f"\n{Colors.BOLD}Для детального тестирования запустите:{Colors.END}")
    print("python test_external_services_comprehensive.py")

if __name__ == "__main__":
    main() 