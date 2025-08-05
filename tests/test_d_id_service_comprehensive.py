#!/usr/bin/env python3
"""
Комплексные unit-тесты для D-ID Service
Проверяют корректность отправки запросов и обработку ответов от D-ID API
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from app.services.d_id_service import (
    DIdService,
    DIdServiceError,
    DIdConfigurationError,
    DIdAPIError,
    DIdProviderType,
    DIdExpression,
    DIdExpressionConfig,
    DIdScriptType
)


class TestDIdServiceComprehensive:
    """Комплексные тесты для D-ID Service"""
    
    def setup_method(self):
        """Настройка тестового окружения"""
        self.service = DIdService()
        # Устанавливаем тестовый API ключ
        self.service.api_key = "test_api_key"
        self.service.base_url = "https://api.d-id.com"
    
    def teardown_method(self):
        """Очистка после тестов"""
        pass

    # ==================== ТЕСТЫ АУТЕНТИФИКАЦИИ ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_authentication_success(self, mock_get):
        """Тест успешной аутентификации"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "talks": [
                {"id": "talk_1", "status": "done"},
                {"id": "talk_2", "status": "created"}
            ]
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.test_authentication()
        
        # Проверяем результат
        assert result["success"] is True
        assert "Authentication successful" in result["message"]
        assert "data" in result
        
        # Проверяем, что запрос был отправлен правильно
        mock_get.assert_called_once_with(
            "https://api.d-id.com/talks",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic test_api_key"
            },
            timeout=30
        )
    
    @patch('app.services.d_id_service.requests.get')
    def test_authentication_failure_401(self, mock_get):
        """Тест неудачной аутентификации (401)"""
        # Подготавливаем мок ошибки
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        # Выполняем тест
        result = self.service.test_authentication()
        
        # Проверяем результат
        assert result["success"] is False
        assert "Unauthorized" in result["message"]
        assert result["status_code"] == 401
    
    @patch('app.services.d_id_service.requests.get')
    def test_authentication_failure_network(self, mock_get):
        """Тест сетевой ошибки при аутентификации"""
        from requests.exceptions import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        # Выполняем тест
        result = self.service.test_authentication()
        
        # Проверяем результат
        assert result["success"] is False
        assert "Network error" in result["message"]

    # ==================== ТЕСТЫ СОЗДАНИЯ TALKS ====================
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_audio_success(self, mock_post):
        """Тест успешного создания talk с аудио"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_123",
            "status": "created",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service.create_talk_with_audio(
            image_url="https://example.com/image.jpg",
            audio_url="https://example.com/audio.mp3"
        )
        
        # Проверяем результат
        assert result == "talk_123"
        
        # Проверяем, что запрос был отправлен правильно
        expected_payload = {
            "source_url": "https://example.com/image.jpg",
            "script": {
                "type": "audio",
                "audio_url": "https://example.com/audio.mp3"
            },
            "config": {
                "stitch": True,
                "result_format": "mp4"
            }
        }
        
        mock_post.assert_called_once_with(
            "https://api.d-id.com/talks",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic test_api_key"
            },
            json=expected_payload,
            timeout=60
        )
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_text_success(self, mock_post):
        """Тест успешного создания talk с текстом"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_456",
            "status": "created"
        }
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!"
        )
        
        # Проверяем результат
        assert result == "talk_456"
        
        # Проверяем payload
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["source_url"] == "https://example.com/image.jpg"
        assert payload["script"]["type"] == "text"
        assert payload["script"]["input"] == "Hello world!"
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_text_and_provider(self, mock_post):
        """Тест создания talk с текстом и TTS провайдером"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"id": "talk_789", "status": "created"}
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!",
            provider=DIdProviderType.MICROSOFT,
            voice_id="en-US-JennyNeural"
        )
        
        # Проверяем результат
        assert result == "talk_789"
        
        # Проверяем payload с провайдером
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["script"]["provider"]["type"] == "microsoft"
        assert payload["script"]["provider"]["voice_id"] == "en-US-JennyNeural"
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_expressions(self, mock_post):
        """Тест создания talk с выражениями лица"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"id": "talk_expressions", "status": "created"}
        mock_post.return_value = mock_response
        
        # Создаем выражения
        expressions = [
            DIdExpressionConfig(0, DIdExpression.SURPRISE, 1.0),
            DIdExpressionConfig(50, DIdExpression.HAPPY, 0.8)
        ]
        
        # Выполняем тест
        result = self.service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!",
            expressions=expressions
        )
        
        # Проверяем результат
        assert result == "talk_expressions"
        
        # Проверяем payload с выражениями
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        driver_expressions = payload["config"]["driver_expressions"]
        
        assert len(driver_expressions["expressions"]) == 2
        assert driver_expressions["expressions"][0]["start_frame"] == 0
        assert driver_expressions["expressions"][0]["expression"] == "surprise"
        assert driver_expressions["expressions"][0]["intensity"] == 1.0
        assert driver_expressions["expressions"][1]["start_frame"] == 50
        assert driver_expressions["expressions"][1]["expression"] == "happy"
        assert driver_expressions["expressions"][1]["intensity"] == 0.8
        assert driver_expressions["transition_frames"] == 20
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_driver_url(self, mock_post):
        """Тест создания talk с кастомным драйвером"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"id": "talk_driver", "status": "created"}
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!",
            driver_url="bank://lively/driver-05"
        )
        
        # Проверяем результат
        assert result == "talk_driver"
        
        # Проверяем payload с драйвером
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["driver_url"] == "bank://lively/driver-05"
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_with_webhook(self, mock_post):
        """Тест создания talk с webhook"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"id": "talk_webhook", "status": "created"}
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!",
            webhook="https://myhost.com/webhook"
        )
        
        # Проверяем результат
        assert result == "talk_webhook"
        
        # Проверяем payload с webhook
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["webhook"] == "https://myhost.com/webhook"

    # ==================== ТЕСТЫ ОШИБОК СОЗДАНИЯ TALKS ====================
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_400_error(self, mock_post):
        """Тест обработки 400 ошибки при создании talk"""
        # Подготавливаем мок ошибки
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_post.side_effect = http_error
        
        # Выполняем тест - должен вызвать fallback
        with patch.object(self.service, '_create_talk_alternative') as mock_alternative:
            mock_alternative.return_value = "demo_talk_123"
            
            result = self.service.create_talk_with_audio(
                image_url="https://example.com/image.jpg",
                audio_url="https://example.com/audio.mp3"
            )
            
            # Проверяем, что был вызван fallback
            mock_alternative.assert_called_once()
            assert result == "demo_talk_123"
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_500_error(self, mock_post):
        """Тест обработки 500 ошибки при создании talk"""
        # Подготавливаем мок ошибки
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_post.side_effect = http_error
        
        # Выполняем тест - должен вызвать fallback
        with patch.object(self.service, '_create_talk_alternative') as mock_alternative:
            mock_alternative.return_value = "demo_talk_456"
            
            result = self.service.create_talk_with_audio(
                image_url="https://example.com/image.jpg",
                audio_url="https://example.com/audio.mp3"
            )
            
            # Проверяем, что был вызван fallback
            mock_alternative.assert_called_once()
            assert result == "demo_talk_456"
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_network_error(self, mock_post):
        """Тест сетевой ошибки при создании talk"""
        from requests.exceptions import RequestException
        mock_post.side_effect = RequestException("Network error")
        
        # Выполняем тест - должен вызвать demo mode
        with patch.object(self.service, '_create_demo_talk') as mock_demo:
            mock_demo.return_value = "demo_talk_789"
            
            result = self.service.create_talk_with_audio(
                image_url="https://example.com/image.jpg",
                audio_url="https://example.com/audio.mp3"
            )
            
            # Проверяем, что был вызван demo mode
            mock_demo.assert_called_once()
            assert result == "demo_talk_789"

    # ==================== ТЕСТЫ ПОЛУЧЕНИЯ СТАТУСА ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_status_created(self, mock_get):
        """Тест получения статуса talk (created)"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_123",
            "status": "created",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talk_status("talk_123")
        
        # Проверяем результат
        assert result["status"] == "created"
        assert result["result_url"] is None
        
        # Проверяем, что запрос был отправлен правильно
        mock_get.assert_called_once_with(
            "https://api.d-id.com/talks/talk_123",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic test_api_key"
            },
            timeout=60
        )
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_status_done(self, mock_get):
        """Тест получения статуса talk (done)"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_123",
            "status": "done",
            "result_url": "https://example.com/video.mp4",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talk_status("talk_123")
        
        # Проверяем результат
        assert result["status"] == "done"
        assert result["result_url"] == "https://example.com/video.mp4"
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_status_failed(self, mock_get):
        """Тест получения статуса talk (failed)"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_123",
            "status": "failed",
            "error_message": "Processing failed",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talk_status("talk_123")
        
        # Проверяем результат
        assert result["status"] == "failed"
        assert result["result_url"] is None
    
    def test_get_demo_talk_status(self):
        """Тест получения статуса demo talk"""
        # Создаем demo talk
        demo_id = self.service._create_demo_talk(
            image_url="https://example.com/image.jpg",
            script={"type": "audio", "audio_url": "https://example.com/audio.mp3"}
        )
        
        # Проверяем, что demo talk создан
        assert demo_id.startswith("demo_")
        
        # Получаем статус demo talk
        result = self.service.get_talk_status(demo_id)
        
        # Проверяем результат
        assert "status" in result
        assert result["status"] in ["created", "started", "done"]

    # ==================== ТЕСТЫ ПОЛУЧЕНИЯ СПИСКА TALKS ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talks_success(self, mock_get):
        """Тест успешного получения списка talks"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "talks": [
                {"id": "talk_1", "status": "done"},
                {"id": "talk_2", "status": "created"},
                {"id": "talk_3", "status": "failed"}
            ]
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talks()
        
        # Проверяем результат
        assert len(result) == 3
        assert result[0]["id"] == "talk_1"
        assert result[0]["status"] == "done"
        assert result[1]["id"] == "talk_2"
        assert result[1]["status"] == "created"
        assert result[2]["id"] == "talk_3"
        assert result[2]["status"] == "failed"
        
        # Проверяем, что запрос был отправлен правильно
        mock_get.assert_called_once_with(
            "https://api.d-id.com/talks",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic test_api_key"
            },
            timeout=30
        )
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talks_empty(self, mock_get):
        """Тест получения пустого списка talks"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"talks": []}
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talks()
        
        # Проверяем результат
        assert len(result) == 0

    # ==================== ТЕСТЫ ПОЛУЧЕНИЯ TALK ПО ID ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_by_id_success(self, mock_get):
        """Тест успешного получения talk по ID"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "talk_123",
            "status": "done",
            "result_url": "https://example.com/video.mp4",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        mock_get.return_value = mock_response
        
        # Выполняем тест
        result = self.service.get_talk_by_id("talk_123")
        
        # Проверяем результат
        assert result["id"] == "talk_123"
        assert result["status"] == "done"
        assert result["result_url"] == "https://example.com/video.mp4"
        
        # Проверяем, что запрос был отправлен правильно
        mock_get.assert_called_once_with(
            "https://api.d-id.com/talks/talk_123",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic test_api_key"
            },
            timeout=30
        )
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_by_id_not_found(self, mock_get):
        """Тест получения несуществующего talk"""
        # Подготавливаем мок ошибки
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Talk not found"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        # Выполняем тест
        with pytest.raises(DIdAPIError) as exc_info:
            self.service.get_talk_by_id("non_existing_talk")
        
        # Проверяем ошибку
        assert exc_info.value.status_code == 404
        assert "Talk not found" in exc_info.value.message

    # ==================== ТЕСТЫ КОНФИГУРАЦИИ ====================
    
    def test_validate_configuration_success(self):
        """Тест успешной валидации конфигурации"""
        # API ключ установлен
        self.service.api_key = "test_key"
        
        # Не должно вызывать исключение
        self.service._validate_configuration()
    
    def test_validate_configuration_failure(self):
        """Тест неудачной валидации конфигурации"""
        # API ключ не установлен
        self.service.api_key = None
        
        # Должно вызывать исключение
        with pytest.raises(DIdConfigurationError) as exc_info:
            self.service._validate_configuration()
        
        assert "D-ID API key not configured" in str(exc_info.value)
    
    def test_get_headers(self):
        """Тест получения заголовков"""
        # Выполняем тест
        headers = self.service._get_headers()
        
        # Проверяем результат
        assert "Accept" in headers
        assert "Content-Type" in headers
        assert "Authorization" in headers
        assert headers["Accept"] == "application/json"
        assert headers["Content-Type"] == "application/json"
        assert headers["Authorization"] == "Basic test_api_key"
    
    def test_is_configured_true(self):
        """Тест проверки конфигурации (настроено)"""
        self.service.api_key = "test_key"
        assert self.service.is_configured() is True
    
    def test_is_configured_false(self):
        """Тест проверки конфигурации (не настроено)"""
        self.service.api_key = None
        assert self.service.is_configured() is False

    # ==================== ТЕСТЫ ОБРАБОТКИ ОШИБОК ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_make_request_http_error(self, mock_get):
        """Тест обработки HTTP ошибки"""
        # Подготавливаем мок ошибки
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        # Выполняем тест
        with pytest.raises(DIdAPIError) as exc_info:
            self.service._make_request("GET", "/test")
        
        # Проверяем ошибку
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in exc_info.value.message
    
    @patch('app.services.d_id_service.requests.get')
    def test_make_request_network_error(self, mock_get):
        """Тест обработки сетевой ошибки"""
        from requests.exceptions import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        # Выполняем тест
        with pytest.raises(DIdServiceError) as exc_info:
            self.service._make_request("GET", "/test")
        
        # Проверяем ошибку
        assert "Network error" in str(exc_info.value)
    
    def test_make_request_unsupported_method(self):
        """Тест обработки неподдерживаемого HTTP метода"""
        # Выполняем тест
        with pytest.raises(DIdServiceError) as exc_info:
            self.service._make_request("PUT", "/test")
        
        # Проверяем ошибку
        assert "Unsupported HTTP method" in str(exc_info.value)

    # ==================== ТЕСТЫ FALLBACK МЕХАНИЗМОВ ====================
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_alternative_format(self, mock_post):
        """Тест альтернативного формата создания talk"""
        # Подготавливаем мок ответ
        mock_response = Mock()
        mock_response.json.return_value = {"id": "talk_alt", "status": "created"}
        mock_post.return_value = mock_response
        
        # Выполняем тест
        result = self.service._create_talk_alternative(
            image_url="https://example.com/image.jpg",
            script={"type": "audio", "audio_url": "https://example.com/audio.mp3"}
        )
        
        # Проверяем результат
        assert result == "talk_alt"
        
        # Проверяем payload
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["source_url"] == "https://example.com/image.jpg"
        assert payload["script"]["type"] == "audio"
        assert payload["script"]["audio_url"] == "https://example.com/audio.mp3"
        assert payload["config"]["stitch"] is True
        assert payload["config"]["result_format"] == "mp4"
    
    def test_create_demo_talk(self):
        """Тест создания demo talk"""
        # Выполняем тест
        result = self.service._create_demo_talk(
            image_url="https://example.com/image.jpg",
            script={"type": "audio", "audio_url": "https://example.com/audio.mp3"}
        )
        
        # Проверяем результат
        assert result.startswith("demo_")
        assert len(result) == 13  # "demo_" + 8 символов
        
        # Проверяем, что demo talk сохранен
        assert hasattr(self.service, '_demo_talks')
        assert result in self.service._demo_talks
        assert self.service._demo_talks[result]["image_url"] == "https://example.com/image.jpg"
        assert self.service._demo_talks[result]["script"]["type"] == "audio"

    # ==================== ТЕСТЫ ГРАНИЧНЫХ СЛУЧАЕВ ====================
    
    @patch('app.services.d_id_service.requests.post')
    def test_create_talk_missing_id_in_response(self, mock_post):
        """Тест отсутствия ID в ответе API"""
        # Подготавливаем мок ответ без ID
        mock_response = Mock()
        mock_response.json.return_value = {
            "status": "created",
            "created_at": "2023-01-01T00:00:00Z"
        }
        mock_post.return_value = mock_response
        
        # Выполняем тест - должен использовать demo mode
        result = self.service.create_talk_with_audio(
            image_url="https://example.com/image.jpg",
            audio_url="https://example.com/audio.mp3"
        )
        
        # Проверяем, что был создан demo talk
        assert result.startswith("demo_")
        assert len(result) == 13  # "demo_" + 8 символов
    
    @patch('app.services.d_id_service.requests.get')
    def test_get_talk_status_with_none_response(self, mock_get):
        """Тест обработки None response"""
        # Подготавливаем мок ошибки без response
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = None  # Нет response
        mock_get.side_effect = http_error
        
        # Выполняем тест
        with pytest.raises(DIdAPIError) as exc_info:
            self.service.get_talk_status("talk_123")
        
        # Проверяем ошибку
        assert exc_info.value.status_code == 0  # По умолчанию 0
        assert "D-ID API error 0" in str(exc_info.value)

    # ==================== ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ ====================
    
    @patch('app.services.d_id_service.requests.get')
    def test_request_timeout(self, mock_get):
        """Тест таймаута запроса"""
        from requests.exceptions import Timeout
        mock_get.side_effect = Timeout("Request timeout")
        
        # Выполняем тест
        with pytest.raises(DIdServiceError) as exc_info:
            self.service.get_talk_status("talk_123")
        
        # Проверяем ошибку
        assert "Request timeout" in str(exc_info.value)
    
    @patch('app.services.d_id_service.requests.get')
    def test_request_timeout_custom(self, mock_get):
        """Тест кастомного таймаута"""
        from requests.exceptions import Timeout
        mock_get.side_effect = Timeout("Request timeout")
        
        # Выполняем тест с кастомным таймаутом
        with pytest.raises(DIdServiceError) as exc_info:
            self.service._make_request("GET", "/test", timeout=10)
        
        # Проверяем ошибку
        assert "Request timeout" in str(exc_info.value)


class TestDIdServiceIntegration:
    """Интеграционные тесты для D-ID Service"""
    
    def setup_method(self):
        """Настройка тестового окружения"""
        self.service = DIdService()
        self.service.api_key = "test_api_key"
    
    @patch('app.services.d_id_service.requests.post')
    @patch('app.services.d_id_service.requests.get')
    def test_full_workflow_success(self, mock_get, mock_post):
        """Тест полного рабочего процесса"""
        # 1. Создание talk
        mock_post.return_value.json.return_value = {
            "id": "talk_workflow",
            "status": "created"
        }
        
        talk_id = self.service.create_talk_with_audio(
            image_url="https://example.com/image.jpg",
            audio_url="https://example.com/audio.mp3"
        )
        assert talk_id == "talk_workflow"
        
        # 2. Проверка статуса (created)
        mock_get.return_value.json.return_value = {
            "id": "talk_workflow",
            "status": "created"
        }
        
        status = self.service.get_talk_status(talk_id)
        assert status["status"] == "created"
        
        # 3. Проверка статуса (done)
        mock_get.return_value.json.return_value = {
            "id": "talk_workflow",
            "status": "done",
            "result_url": "https://example.com/video.mp4"
        }
        
        status = self.service.get_talk_status(talk_id)
        assert status["status"] == "done"
        assert status["result_url"] == "https://example.com/video.mp4"
    
    @patch('app.services.d_id_service.requests.post')
    def test_workflow_with_fallback(self, mock_post):
        """Тест рабочего процесса с fallback"""
        # Симулируем 400 ошибку
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_post.side_effect = http_error
        
        # Должен использовать fallback
        with patch.object(self.service, '_create_talk_alternative') as mock_alternative:
            mock_alternative.return_value = "demo_talk_workflow"
            
            talk_id = self.service.create_talk_with_audio(
                image_url="https://example.com/image.jpg",
                audio_url="https://example.com/audio.mp3"
            )
            
            assert talk_id == "demo_talk_workflow"
            mock_alternative.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 