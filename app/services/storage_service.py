"""
Storage Service для работы с облачным хранилищем Cloudinary
"""

import os
import logging
from typing import Optional, Tuple
from dataclasses import dataclass
import cloudinary
import cloudinary.uploader
import cloudinary.api
import re

logger = logging.getLogger(__name__)


@dataclass
class UploadResult:
    """Результат загрузки файла"""
    public_url: str
    file_id: str
    size: int
    format: str


class StorageServiceError(Exception):
    """Базовое исключение для StorageService"""
    pass


class StorageConfigurationError(StorageServiceError):
    """Ошибка конфигурации хранилища"""
    pass


class StorageUploadError(StorageServiceError):
    """Ошибка загрузки файла"""
    pass


class StorageService:
    """
    Сервис для работы с облачным хранилищем Cloudinary
    """
    
    def __init__(self):
        """Инициализация сервиса"""
        self._validate_configuration()
        self._configure_cloudinary()
    
    def _validate_configuration(self) -> None:
        """Проверка конфигурации Cloudinary"""
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        if not cloudinary_url:
            raise StorageConfigurationError(
                "CLOUDINARY_URL не найден в переменных окружения"
            )
        
        # Проверяем наличие обязательных компонентов
        if not cloudinary_url.startswith('cloudinary://'):
            raise StorageConfigurationError(
                "CLOUDINARY_URL должен начинаться с 'cloudinary://'"
            )
        
        logger.info("Конфигурация Cloudinary валидна")
    
    def _configure_cloudinary(self) -> None:
        """Настройка Cloudinary"""
        logger.info(f"🔥 НАСТРОЙКА CLOUDINARY...")
        try:
            cloudinary.config(
                cloudinary_url=os.getenv('CLOUDINARY_URL')
            )
            logger.info("✅ CLOUDINARY НАСТРОЕН УСПЕШНО")
        except Exception as e:
            logger.error(f"❌ ОШИБКА НАСТРОЙКИ CLOUDINARY: {e}")
            raise StorageConfigurationError(f"Ошибка настройки Cloudinary: {e}")
    
    def normalize_filename(self, filename: str, file_type: str = "image") -> str:
        """
        Normalizes filename for Cloudinary:
        - removes spaces and special characters (including URL encoding)
        - keeps only one extension
        - prevents double extensions
        """
        # Remove path if present
        base = os.path.basename(filename)
        
        # Decode URL encoding (%20 -> space, %3A -> :, etc.)
        import urllib.parse
        base = urllib.parse.unquote(base)
        
        # Find the last file extension BEFORE cleaning
        last_dot_index = base.rfind('.')
        if last_dot_index != -1:
            original_name = base[:last_dot_index]
            ext = base[last_dot_index:].lower()
        else:
            original_name = base
            ext = ''
        
        # Clean only the filename (not extension)
        # Remove all except letters, numbers, _ and .
        name = re.sub(r'[^A-Za-z0-9_.]', '_', original_name)
        
        # Remove double dots and underscores in name
        name = re.sub(r'[._]+', '_', name)
        
        # Process extensions based on file type
        if file_type == "image":
            if ext not in ['.jpg', '.jpeg', '.png']:
                ext = '.jpg'
        else:  # audio
            # Keep original extension for audio
            if not ext:
                ext = '.mp3'
        
        # Remove all dots from name
        name = name.replace('.', '_')
        
        # Remove extra underscores
        name = re.sub(r'_+', '_', name)
        name = name.strip('_')
        
        normalized = f"{name}{ext}"
        logger.info(f"  Normalized filename: {normalized}")
        return normalized
    
    def upload_image(self, file_data: bytes, filename: str, folder: str = "d_id_talking/images") -> UploadResult:
        """
        Загрузка изображения в Cloudinary
        
        Args:
            file_data: Байты изображения
            filename: Имя файла
            folder: Папка для сохранения
            
        Returns:
            UploadResult с информацией о загруженном файле
        """
        try:
            filename = self.normalize_filename(filename, "image")
            logger.info(f"🔥 ЗАГРУЗКА ИЗОБРАЖЕНИЯ В CLOUDINARY:")
            logger.info(f"  Original filename: {filename}")
            logger.info(f"  Normalized filename: {filename}")
            logger.info(f"  Folder: {folder}")
            logger.info(f"  Data size: {len(file_data)} bytes")
            logger.info(f"  Data type: {type(file_data)}")
            
            # Загружаем файл в Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=f"{folder}/{filename}",
                resource_type="image",
                overwrite=True,
                invalidate=True
            )
            
            # Создаем результат
            upload_result = UploadResult(
                public_url=result['secure_url'],
                file_id=result['public_id'],
                size=result.get('bytes', 0),
                format=result.get('format', 'unknown')
            )
            
            logger.info(f"Изображение загружено: {upload_result.public_url}")
            return upload_result
            
        except Exception as e:
            logger.error(f"Ошибка загрузки изображения в Cloudinary: {e}")
            raise StorageUploadError(f"Ошибка загрузки изображения: {e}")
    
    def upload_base64_image(self, base64_data: str, filename: str = "uploaded_image.jpg", folder: str = "d_id_talking/images") -> UploadResult:
        """
        Загрузка base64 изображения в Cloudinary
        
        Args:
            base64_data: Base64 строка изображения (с или без data URL префикса)
            filename: Имя файла
            folder: Папка для сохранения
            
        Returns:
            UploadResult с информацией о загруженном файле
        """
        try:
            import base64
            
            # Убираем data URL префикс если есть
            if base64_data.startswith('data:'):
                # Извлекаем base64 данные из data URL
                header, data = base64_data.split(',', 1)
                # Определяем формат из header
                if 'image/jpeg' in header:
                    filename = filename.replace('.jpg', '.jpg').replace('.jpeg', '.jpg')
                elif 'image/png' in header:
                    filename = filename.replace('.jpg', '.png').replace('.jpeg', '.png')
                elif 'image/gif' in header:
                    filename = filename.replace('.jpg', '.gif').replace('.jpeg', '.gif')
                elif 'image/webp' in header:
                    filename = filename.replace('.jpg', '.webp').replace('.jpeg', '.webp')
            else:
                data = base64_data
            
            # Декодируем base64 в байты
            try:
                file_data = base64.b64decode(data)
            except Exception as e:
                # Попробуем добавить padding если нужно
                padding = 4 - len(data) % 4
                if padding != 4:
                    data += '=' * padding
                    file_data = base64.b64decode(data)
                else:
                    raise e
            
            filename = self.normalize_filename(filename, "image")
            logger.info(f"🔥 ЗАГРУЗКА BASE64 ИЗОБРАЖЕНИЯ В CLOUDINARY:")
            logger.info(f"  Filename: {filename}")
            logger.info(f"  Folder: {folder}")
            logger.info(f"  Data size: {len(file_data)} bytes")
            
            # Загружаем файл в Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=f"{folder}/{filename}",
                resource_type="image",
                overwrite=True,
                invalidate=True
            )
            
            # Создаем результат
            upload_result = UploadResult(
                public_url=result['secure_url'],
                file_id=result['public_id'],
                size=result.get('bytes', 0),
                format=result.get('format', 'unknown')
            )
            
            logger.info(f"Base64 изображение загружено: {upload_result.public_url}")
            return upload_result
            
        except Exception as e:
            logger.error(f"Ошибка загрузки base64 изображения в Cloudinary: {e}")
            raise StorageUploadError(f"Ошибка загрузки base64 изображения: {e}")

    def upload_audio(self, file_data: bytes, filename: str, folder: str = "d_id_talking/audio") -> UploadResult:
        """
        Загрузка аудио файла в Cloudinary
        
        Args:
            file_data: Байты аудио файла
            filename: Имя файла
            folder: Папка для сохранения
            
        Returns:
            UploadResult с информацией о загруженном файле
        """
        try:
            filename = self.normalize_filename(filename, "audio")
            logger.info(f"🔥 ЗАГРУЗКА АУДИО В CLOUDINARY:")
            logger.info(f"  Original filename: {filename}")
            logger.info(f"  Normalized filename: {filename}")
            logger.info(f"  Folder: {folder}")
            logger.info(f"  Data size: {len(file_data)} bytes")
            logger.info(f"  Data type: {type(file_data)}")
            
            # Загружаем файл в Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=f"{folder}/{filename}",
                resource_type="video",  # Cloudinary использует video для аудио
                overwrite=True,
                invalidate=True
            )
            
            # Создаем результат
            upload_result = UploadResult(
                public_url=result['secure_url'],
                file_id=result['public_id'],
                size=result.get('bytes', 0),
                format=result.get('format', 'unknown')
            )
            
            logger.info(f"Аудио файл загружен: {upload_result.public_url}")
            return upload_result
            
        except Exception as e:
            logger.error(f"Ошибка загрузки аудио в Cloudinary: {e}")
            raise StorageUploadError(f"Ошибка загрузки аудио: {e}")
    
    def get_public_url(self, file_id: str) -> str:
        """
        Получение публичного URL файла
        
        Args:
            file_id: ID файла в Cloudinary
            
        Returns:
            Публичный URL файла
        """
        try:
            # Получаем информацию о файле
            result = cloudinary.api.resource(file_id)
            return result['secure_url']
        except Exception as e:
            logger.error(f"Ошибка получения URL для файла {file_id}: {e}")
            raise StorageServiceError(f"Ошибка получения URL: {e}")
    
    def delete_file(self, file_id: str) -> bool:
        """
        Удаление файла из Cloudinary
        
        Args:
            file_id: ID файла в Cloudinary
            
        Returns:
            True если файл удален успешно
        """
        try:
            logger.info(f"Удаление файла: {file_id}")
            
            # Удаляем файл
            result = cloudinary.uploader.destroy(file_id)
            
            if result.get('result') == 'ok':
                logger.info(f"Файл {file_id} удален успешно")
                return True
            else:
                logger.warning(f"Файл {file_id} не найден или уже удален")
                return False
                
        except Exception as e:
            logger.error(f"Ошибка удаления файла {file_id}: {e}")
            raise StorageServiceError(f"Ошибка удаления файла: {e}")
    
    def list_files(self, folder: str = "d_id_talking", max_results: int = 100) -> list:
        """
        Получение списка файлов в папке
        
        Args:
            folder: Папка для поиска
            max_results: Максимальное количество результатов
            
        Returns:
            Список файлов
        """
        try:
            logger.info(f"Получение списка файлов в папке: {folder}")
            
            # Получаем список файлов
            result = cloudinary.api.resources(
                type="upload",
                prefix=folder,
                max_results=max_results
            )
            
            files = []
            for resource in result.get('resources', []):
                files.append({
                    'public_id': resource['public_id'],
                    'url': resource['secure_url'],
                    'format': resource.get('format'),
                    'size': resource.get('bytes', 0),
                    'created_at': resource.get('created_at')
                })
            
            logger.info(f"Найдено {len(files)} файлов в папке {folder}")
            return files
            
        except Exception as e:
            logger.error(f"Ошибка получения списка файлов: {e}")
            raise StorageServiceError(f"Ошибка получения списка файлов: {e}")
    
    def is_configured(self) -> bool:
        """
        Проверка конфигурации сервиса
        
        Returns:
            True если сервис настроен корректно
        """
        try:
            cloudinary_url = os.getenv('CLOUDINARY_URL')
            return cloudinary_url is not None and cloudinary_url.startswith('cloudinary://')
        except Exception:
            return False
    
    def test_connection(self) -> bool:
        """
        Тест подключения к Cloudinary
        
        Returns:
            True если подключение работает
        """
        try:
            # Пытаемся получить информацию об аккаунте
            result = cloudinary.api.ping()
            logger.info("Подключение к Cloudinary успешно")
            return True
        except Exception as e:
            logger.error(f"Ошибка подключения к Cloudinary: {e}")
            return False
    
    def get_file_data(self, file_path: str) -> bytes:
        """
        Получить данные файла для прямой загрузки в D-ID API
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            bytes: Данные файла
        """
        try:
            logger.info(f"🔥 ЧТЕНИЕ ФАЙЛА ДЛЯ D-ID API:")
            logger.info(f"  File path: {file_path}")
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            logger.info(f"✅ ФАЙЛ ПРОЧИТАН: {len(file_data)} байт")
            return file_data
            
        except Exception as e:
            logger.error(f"❌ ОШИБКА ЧТЕНИЯ ФАЙЛА: {e}")
            raise StorageUploadError(f"Ошибка чтения файла: {e}") 