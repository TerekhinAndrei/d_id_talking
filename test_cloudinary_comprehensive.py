#!/usr/bin/env python3
"""
Comprehensive тест для Cloudinary API
Проверяет все функции Cloudinary с реальными тестовыми данными
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any

# Добавляем корневую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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

def test_configuration():
    """Тест конфигурации Cloudinary"""
    print_header("Cloudinary Configuration Test")
    
    try:
        # Создаем экземпляр сервиса
        storage_service = StorageService()
        print_success("StorageService инициализирован")
        
        # Проверяем конфигурацию
        if storage_service.is_configured():
            print_success("Cloudinary настроен корректно")
            return True
        else:
            print_error("Cloudinary не настроен. Проверьте CLOUDINARY_URL")
            return False
            
    except Exception as e:
        print_error(f"Ошибка инициализации StorageService: {e}")
        return False

def test_connection():
    """Тест подключения к Cloudinary"""
    print_header("Cloudinary Connection Test")
    
    try:
        storage_service = StorageService()
        
        # Тест подключения
        print_info("Тест подключения к Cloudinary...")
        if storage_service.test_connection():
            print_success("Подключение к Cloudinary успешно")
            return True
        else:
            print_error("Ошибка подключения к Cloudinary")
            return False
            
    except Exception as e:
        print_error(f"Ошибка тестирования подключения: {e}")
        return False

def test_image_upload():
    """Тест загрузки изображений"""
    print_header("Cloudinary Image Upload Test")
    
    if not TEST_IMAGE_FILE.exists():
        print_error(f"Тестовый файл изображения не найден: {TEST_IMAGE_FILE}")
        return False
    
    try:
        storage_service = StorageService()
        
        # Читаем тестовое изображение
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        print_info(f"Загружен тестовый файл изображения: {len(image_data)} байт")
        
        # Тестируем загрузку в разные папки
        test_folders = [
            "test_cloudinary/images",
            "test_cloudinary/test_images",
            "test_cloudinary/upload_test"
        ]
        
        upload_results = []
        
        for i, folder in enumerate(test_folders, 1):
            print_info(f"Тест {i}: загрузка в папку {folder}...")
            
            try:
                upload_result = storage_service.upload_image(
                    file_data=image_data,
                    filename=f"test_image_{i}.jpg",
                    folder=folder
                )
                
                print_success(f"Изображение {i} загружено: {upload_result.public_url}")
                print_info(f"  Размер: {upload_result.size} байт")
                print_info(f"  Формат: {upload_result.format}")
                print_info(f"  ID: {upload_result.file_id}")
                
                upload_results.append(upload_result)
                
            except Exception as e:
                print_error(f"Ошибка загрузки изображения {i}: {e}")
                return False
        
        print_success(f"Все {len(upload_results)} изображений загружены успешно")
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования загрузки изображений: {e}")
        return False

def test_audio_upload():
    """Тест загрузки аудио файлов"""
    print_header("Cloudinary Audio Upload Test")
    
    if not TEST_AUDIO_FILE.exists():
        print_error(f"Тестовый аудио файл не найден: {TEST_AUDIO_FILE}")
        return False
    
    try:
        storage_service = StorageService()
        
        # Читаем тестовый аудио файл
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        print_info(f"Загружен тестовый аудио файл: {len(audio_data)} байт")
        
        # Тестируем загрузку в разные папки
        test_folders = [
            "test_cloudinary/audio",
            "test_cloudinary/test_audio",
            "test_cloudinary/upload_test"
        ]
        
        upload_results = []
        
        for i, folder in enumerate(test_folders, 1):
            print_info(f"Тест {i}: загрузка в папку {folder}...")
            
            try:
                upload_result = storage_service.upload_audio(
                    file_data=audio_data,
                    filename=f"test_audio_{i}.mp3",
                    folder=folder
                )
                
                print_success(f"Аудио {i} загружено: {upload_result.public_url}")
                print_info(f"  Размер: {upload_result.size} байт")
                print_info(f"  Формат: {upload_result.format}")
                print_info(f"  ID: {upload_result.file_id}")
                
                upload_results.append(upload_result)
                
            except Exception as e:
                print_error(f"Ошибка загрузки аудио {i}: {e}")
                return False
        
        print_success(f"Все {len(upload_results)} аудио файлов загружены успешно")
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования загрузки аудио: {e}")
        return False

def test_get_public_url():
    """Тест получения публичного URL"""
    print_header("Cloudinary Get Public URL Test")
    
    try:
        storage_service = StorageService()
        
        # Сначала загружаем файл для тестирования
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        upload_result = storage_service.upload_image(
            file_data=image_data,
            filename="test_url_image.jpg",
            folder="test_cloudinary_url"
        )
        
        print_success(f"Тестовый файл загружен: {upload_result.public_url}")
        
        # Тестируем получение URL
        print_info("Получение публичного URL...")
        public_url = storage_service.get_public_url(upload_result.file_id)
        
        if public_url:
            print_success(f"URL получен: {public_url}")
            
            # Проверяем, что URL совпадает с загруженным
            if public_url == upload_result.public_url:
                print_success("URL совпадает с загруженным файлом")
            else:
                print_warning("URL не совпадает с загруженным файлом")
            
            return True
        else:
            print_error("Не удалось получить публичный URL")
            return False
        
    except Exception as e:
        print_error(f"Ошибка получения публичного URL: {e}")
        return False

def test_list_files():
    """Тест получения списка файлов"""
    print_header("Cloudinary List Files Test")
    
    try:
        storage_service = StorageService()
        
        # Сначала загружаем несколько файлов для тестирования
        print_info("Загрузка тестовых файлов...")
        
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        with open(TEST_AUDIO_FILE, "rb") as f:
            audio_data = f.read()
        
        # Загружаем файлы
        image_upload = storage_service.upload_image(
            file_data=image_data,
            filename="test_list_image.jpg",
            folder="test_cloudinary_list"
        )
        
        audio_upload = storage_service.upload_audio(
            file_data=audio_data,
            filename="test_list_audio.mp3",
            folder="test_cloudinary_list"
        )
        
        print_success("Тестовые файлы загружены")
        
        # Тестируем получение списка файлов
        print_info("Получение списка файлов...")
        files = storage_service.list_files(folder="test_cloudinary_list", max_results=10)
        
        print_success(f"Найдено {len(files)} файлов в папке test_cloudinary_list")
        
        # Выводим информацию о файлах
        for i, file_info in enumerate(files[:5], 1):
            print_info(f"  {i}. {file_info['public_id']}")
            print_info(f"      Формат: {file_info['format']}")
            print_info(f"      Размер: {file_info['size']} байт")
            print_info(f"      URL: {file_info['url']}")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка получения списка файлов: {e}")
        return False

def test_delete_file():
    """Тест удаления файлов"""
    print_header("Cloudinary Delete File Test")
    
    try:
        storage_service = StorageService()
        
        # Сначала загружаем файл для удаления
        with open(TEST_IMAGE_FILE, "rb") as f:
            image_data = f.read()
        
        upload_result = storage_service.upload_image(
            file_data=image_data,
            filename="test_delete_image.jpg",
            folder="test_cloudinary_delete"
        )
        
        print_success(f"Тестовый файл загружен: {upload_result.public_url}")
        
        # Тестируем удаление файла
        print_info("Удаление файла...")
        delete_result = storage_service.delete_file(upload_result.file_id)
        
        if delete_result:
            print_success("Файл успешно удален")
        else:
            print_warning("Файл не найден или уже удален")
        
        # Проверяем, что файл действительно удален
        print_info("Проверка удаления...")
        try:
            public_url = storage_service.get_public_url(upload_result.file_id)
            print_warning("Файл все еще доступен после удаления")
        except Exception:
            print_success("Файл успешно удален (недоступен)")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка удаления файла: {e}")
        return False

def test_error_handling():
    """Тест обработки ошибок"""
    print_header("Cloudinary Error Handling Test")
    
    try:
        storage_service = StorageService()
        
        # Тест с неверным file_id
        print_info("Тест получения URL несуществующего файла...")
        try:
            public_url = storage_service.get_public_url("invalid_file_id")
            print_warning("Неожиданно успешный запрос с неверным file_id")
        except Exception as e:
            print_success(f"Ожидаемая ошибка с неверным file_id: {type(e).__name__}")
        
        # Тест удаления несуществующего файла
        print_info("Тест удаления несуществующего файла...")
        try:
            delete_result = storage_service.delete_file("invalid_file_id")
            if not delete_result:
                print_success("Ожидаемый результат: файл не найден")
            else:
                print_warning("Неожиданно успешное удаление несуществующего файла")
        except Exception as e:
            print_success(f"Ожидаемая ошибка при удалении: {type(e).__name__}")
        
        # Тест с пустыми данными
        print_info("Тест загрузки пустого файла...")
        try:
            upload_result = storage_service.upload_image(
                file_data=b"",
                filename="empty_file.jpg",
                folder="test_cloudinary_error"
            )
            print_warning("Неожиданно успешная загрузка пустого файла")
        except Exception as e:
            print_success(f"Ожидаемая ошибка при загрузке пустого файла: {type(e).__name__}")
        
        print_success("Тесты обработки ошибок завершены")
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования обработки ошибок: {e}")
        return False

def test_performance():
    """Тест производительности"""
    print_header("Cloudinary Performance Test")
    
    try:
        storage_service = StorageService()
        
        # Тестируем загрузку нескольких файлов подряд
        print_info("Тест загрузки нескольких файлов...")
        
        start_time = time.time()
        
        for i in range(3):
            with open(TEST_IMAGE_FILE, "rb") as f:
                image_data = f.read()
            
            upload_result = storage_service.upload_image(
                file_data=image_data,
                filename=f"perf_test_{i}.jpg",
                folder="test_cloudinary_perf"
            )
            
            print_info(f"Файл {i+1} загружен за {time.time() - start_time:.2f}с")
        
        total_time = time.time() - start_time
        avg_time = total_time / 3
        
        print_success(f"Среднее время загрузки: {avg_time:.2f} секунд")
        
        if avg_time < 5.0:
            print_success("Производительность в норме")
        else:
            print_warning("Медленная загрузка файлов")
        
        return True
        
    except Exception as e:
        print_error(f"Ошибка тестирования производительности: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("☁️ Cloudinary API Comprehensive Testing")
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
    
    # Тестируем конфигурацию
    results['configuration'] = test_configuration()
    
    # Тестируем подключение
    if results['configuration']:
        results['connection'] = test_connection()
    else:
        results['connection'] = False
    
    # Тестируем загрузку изображений
    if results['configuration']:
        results['image_upload'] = test_image_upload()
    else:
        results['image_upload'] = False
    
    # Тестируем загрузку аудио
    if results['configuration']:
        results['audio_upload'] = test_audio_upload()
    else:
        results['audio_upload'] = False
    
    # Тестируем получение URL
    if results['configuration']:
        results['get_public_url'] = test_get_public_url()
    else:
        results['get_public_url'] = False
    
    # Тестируем список файлов
    if results['configuration']:
        results['list_files'] = test_list_files()
    else:
        results['list_files'] = False
    
    # Тестируем удаление файлов
    if results['configuration']:
        results['delete_file'] = test_delete_file()
    else:
        results['delete_file'] = False
    
    # Тестируем обработку ошибок
    results['error_handling'] = test_error_handling()
    
    # Тестируем производительность
    if results['configuration']:
        results['performance'] = test_performance()
    else:
        results['performance'] = False
    
    # Итоговый отчет
    print_header("Cloudinary Test Results")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"Всего тестов: {total_tests}")
    print(f"Пройдено успешно: {passed_tests}")
    print(f"Провалено: {total_tests - passed_tests}")
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    if passed_tests == total_tests:
        print_success("Все тесты Cloudinary пройдены успешно!")
    else:
        print_warning(f"Пройдено {passed_tests}/{total_tests} тестов")
    
    print(f"\n{Colors.BOLD}Тестирование Cloudinary завершено!{Colors.END}")

if __name__ == "__main__":
    main() 