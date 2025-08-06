"""
Unit тесты для StorageService
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from app.services.storage_service import (
    StorageService,
    StorageServiceError,
    StorageConfigurationError,
    StorageUploadError,
    UploadResult
)


class TestStorageService:
    """Тесты для StorageService"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        # Мокаем переменную окружения
        self.env_patcher = patch.dict(os.environ, {
            'CLOUDINARY_URL': 'cloudinary://test_key:test_secret@test_cloud'
        })
        self.env_patcher.start()
    
    def teardown_method(self):
        """Очистка после каждого теста"""
        self.env_patcher.stop()
    
    def test_init_success(self):
        """Тест успешной инициализации"""
        with patch('cloudinary.config') as mock_config:
            service = StorageService()
            mock_config.assert_called_once()
    
    def test_init_missing_cloudinary_url(self):
        """Тест инициализации без CLOUDINARY_URL"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(StorageConfigurationError, match="CLOUDINARY_URL не найден"):
                StorageService()
    
    def test_init_invalid_cloudinary_url(self):
        """Тест инициализации с неверным CLOUDINARY_URL"""
        with patch.dict(os.environ, {'CLOUDINARY_URL': 'invalid_url'}):
            with pytest.raises(StorageConfigurationError, match="должен начинаться с 'cloudinary://'"):
                StorageService()
    
    def test_upload_image_success(self):
        """Тест успешной загрузки изображения"""
        mock_result = {
            'secure_url': 'https://res.cloudinary.com/test/image/upload/test.jpg',
            'public_id': 'd_id_talking/images/test.jpg',
            'bytes': 1024,
            'format': 'jpg'
        }
        
        with patch('cloudinary.uploader.upload', return_value=mock_result) as mock_upload:
            service = StorageService()
            result = service.upload_image(b'test_image_data', 'test.jpg')
            
            mock_upload.assert_called_once()
            assert result.public_url == mock_result['secure_url']
            assert result.file_id == mock_result['public_id']
            assert result.size == mock_result['bytes']
            assert result.format == mock_result['format']
    
    def test_upload_image_cloudinary_error(self):
        """Тест ошибки Cloudinary при загрузке изображения"""
        with patch('cloudinary.uploader.upload', side_effect=Exception("Cloudinary error")):
            service = StorageService()
            with pytest.raises(StorageUploadError, match="Ошибка загрузки изображения"):
                service.upload_image(b'test_image_data', 'test.jpg')
    
    def test_upload_audio_success(self):
        """Тест успешной загрузки аудио"""
        mock_result = {
            'secure_url': 'https://res.cloudinary.com/test/video/upload/test.mp3',
            'public_id': 'd_id_talking/audio/test.mp3',
            'bytes': 2048,
            'format': 'mp3'
        }
        
        with patch('cloudinary.uploader.upload', return_value=mock_result) as mock_upload:
            service = StorageService()
            result = service.upload_audio(b'test_audio_data', 'test.mp3')
            
            mock_upload.assert_called_once()
            assert result.public_url == mock_result['secure_url']
            assert result.file_id == mock_result['public_id']
            assert result.size == mock_result['bytes']
            assert result.format == mock_result['format']
    
    def test_get_public_url_success(self):
        """Тест успешного получения публичного URL"""
        mock_result = {
            'secure_url': 'https://res.cloudinary.com/test/image/upload/test.jpg'
        }
        
        with patch('cloudinary.api.resource', return_value=mock_result):
            service = StorageService()
            url = service.get_public_url('test_file_id')
            assert url == mock_result['secure_url']
    
    def test_get_public_url_error(self):
        """Тест ошибки при получении публичного URL"""
        with patch('cloudinary.api.resource', side_effect=Exception("API error")):
            service = StorageService()
            with pytest.raises(StorageServiceError, match="Ошибка получения URL"):
                service.get_public_url('test_file_id')
    
    def test_delete_file_success(self):
        """Тест успешного удаления файла"""
        mock_result = {'result': 'ok'}
        
        with patch('cloudinary.uploader.destroy', return_value=mock_result):
            service = StorageService()
            result = service.delete_file('test_file_id')
            assert result is True
    
    def test_delete_file_not_found(self):
        """Тест удаления несуществующего файла"""
        mock_result = {'result': 'not found'}
        
        with patch('cloudinary.uploader.destroy', return_value=mock_result):
            service = StorageService()
            result = service.delete_file('test_file_id')
            assert result is False
    
    def test_list_files_success(self):
        """Тест успешного получения списка файлов"""
        mock_result = {
            'resources': [
                {
                    'public_id': 'd_id_talking/images/test1.jpg',
                    'secure_url': 'https://res.cloudinary.com/test/image/upload/test1.jpg',
                    'format': 'jpg',
                    'bytes': 1024,
                    'created_at': '2023-01-01T00:00:00Z'
                },
                {
                    'public_id': 'd_id_talking/audio/test1.mp3',
                    'secure_url': 'https://res.cloudinary.com/test/video/upload/test1.mp3',
                    'format': 'mp3',
                    'bytes': 2048,
                    'created_at': '2023-01-01T00:00:00Z'
                }
            ]
        }
        
        with patch('cloudinary.api.resources', return_value=mock_result):
            service = StorageService()
            files = service.list_files('d_id_talking')
            
            assert len(files) == 2
            assert files[0]['public_id'] == 'd_id_talking/images/test1.jpg'
            assert files[1]['public_id'] == 'd_id_talking/audio/test1.mp3'
    
    def test_is_configured_true(self):
        """Тест проверки конфигурации - настроено"""
        service = StorageService()
        assert service.is_configured() is True
    
    def test_is_configured_false(self):
        """Тест проверки конфигурации - не настроено"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(StorageConfigurationError):
                service = StorageService()
    
    def test_test_connection_success(self):
        """Тест успешного подключения к Cloudinary"""
        with patch('cloudinary.api.ping', return_value={'status': 'ok'}):
            service = StorageService()
            assert service.test_connection() is True
    
    def test_test_connection_failure(self):
        """Тест неудачного подключения к Cloudinary"""
        with patch('cloudinary.api.ping', side_effect=Exception("Connection error")):
            service = StorageService()
            assert service.test_connection() is False


class TestUploadResult:
    """Тесты для UploadResult"""
    
    def test_upload_result_creation(self):
        """Тест создания UploadResult"""
        result = UploadResult(
            public_url='https://example.com/test.jpg',
            file_id='test_file_id',
            size=1024,
            format='jpg'
        )
        
        assert result.public_url == 'https://example.com/test.jpg'
        assert result.file_id == 'test_file_id'
        assert result.size == 1024
        assert result.format == 'jpg'
    
    def test_upload_result_repr(self):
        """Тест строкового представления UploadResult"""
        result = UploadResult(
            public_url='https://example.com/test.jpg',
            file_id='test_file_id',
            size=1024,
            format='jpg'
        )
        
        repr_str = repr(result)
        assert 'UploadResult' in repr_str
        assert 'test_file_id' in repr_str


class TestStorageServiceExceptions:
    """Тесты для исключений StorageService"""
    
    def test_storage_service_error(self):
        """Тест базового исключения"""
        error = StorageServiceError("Test error")
        assert str(error) == "Test error"
    
    def test_storage_configuration_error(self):
        """Тест исключения конфигурации"""
        error = StorageConfigurationError("Config error")
        assert isinstance(error, StorageServiceError)
        assert str(error) == "Config error"
    
    def test_storage_upload_error(self):
        """Тест исключения загрузки"""
        error = StorageUploadError("Upload error")
        assert isinstance(error, StorageServiceError)
        assert str(error) == "Upload error" 