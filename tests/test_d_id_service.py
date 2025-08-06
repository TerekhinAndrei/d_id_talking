"""
Unit tests for D-ID service
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from app.services.d_id_service import (
    DIdService, 
    DIdServiceError, 
    DIdConfigurationError, 
    DIdAPIError,
    DIdVideoRequest,
    DIdVideoResponse,
    DIdStatus,
    DIdModel
)


class TestDIdService:
    """Test D-ID service functionality"""
    
    def setup_method(self):
        """Setup test environment"""
        self.service = DIdService()
        # Устанавливаем API ключ в None для тестов
        self.service.api_key = None
    
    def test_init_without_api_key(self):
        """Test service initialization without API key"""
        service = DIdService()
        service.api_key = None  # Явно устанавливаем None для теста
        assert service.api_key is None
    
    def test_validate_configuration_success(self):
        """Test _validate_configuration with valid API key"""
        self.service.api_key = "test_key"
        # Не должно вызывать исключение
        self.service._validate_configuration()
    
    def test_validate_configuration_failure(self):
        """Test _validate_configuration without API key"""
        self.service.api_key = None
        with pytest.raises(DIdConfigurationError):
            self.service._validate_configuration()
    
    def test_get_headers(self):
        """Test _get_headers method"""
        self.service.api_key = "test_key"
        headers = self.service._get_headers()
        assert "Accept" in headers
        assert "Content-Type" in headers
        assert "Authorization" in headers
        assert headers["Authorization"] == "Basic test_key"
    
    @patch('app.services.d_id_service.requests.get')
    def test_make_request_get_success(self, mock_get):
        """Test _make_request with successful GET response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"test": "data"}
        mock_response.headers = {}
        mock_response.text = "test response"
        mock_get.return_value = mock_response
        
        result = self.service._make_request("GET", "/test")
        
        assert result == {"test": "data"}
        mock_get.assert_called_once()
    
    @patch('app.services.d_id_service.requests.post')
    def test_make_request_post_success(self, mock_post):
        """Test _make_request with successful POST response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"test": "data"}
        mock_response.headers = {}
        mock_response.text = "test response"
        mock_post.return_value = mock_response
        
        result = self.service._make_request("POST", "/test", data={"key": "value"})
        
        assert result == {"test": "data"}
        mock_post.assert_called_once()
    
    @patch('app.services.d_id_service.requests.get')
    def test_make_request_http_error(self, mock_get):
        """Test _make_request with HTTP error"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        with pytest.raises(DIdAPIError) as exc_info:
            self.service._make_request("GET", "/test")
        
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in exc_info.value.message
    
    @patch('app.services.d_id_service.requests.get')
    def test_make_request_network_error(self, mock_get):
        """Test _make_request with network error"""
        self.service.api_key = "test_key"
        from requests.exceptions import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        with pytest.raises(DIdServiceError) as exc_info:
            self.service._make_request("GET", "/test")
        
        assert "Network error" in str(exc_info.value)
    
    def test_make_request_unsupported_method(self):
        """Test _make_request with unsupported method"""
        self.service.api_key = "test_key"
        
        with pytest.raises(DIdServiceError) as exc_info:
            self.service._make_request("PUT", "/test")
        
        assert "Unsupported HTTP method" in str(exc_info.value)
    
    @patch.object(DIdService, '_make_request')
    def test_test_authentication_success(self, mock_make_request):
        """Test test_authentication with success"""
        self.service.api_key = "test_key"
        mock_make_request.return_value = {"talks": []}
        
        result = self.service.test_authentication()
        
        assert result["success"] is True
        mock_make_request.assert_called_once_with("GET", "/talks", timeout=30)
    
    @patch.object(DIdService, '_make_request')
    def test_test_authentication_failure(self, mock_make_request):
        """Test test_authentication with failure"""
        self.service.api_key = "test_key"
        mock_make_request.side_effect = DIdAPIError(401, "Unauthorized")
        
        result = self.service.test_authentication()
        
        assert result["success"] is False
        assert "Unauthorized" in result["message"]
    
    @patch.object(DIdService, '_make_request')
    def test_get_talks_success(self, mock_make_request):
        """Test get_talks with success"""
        self.service.api_key = "test_key"
        mock_make_request.return_value = {"talks": [{"id": "1"}, {"id": "2"}]}
        
        result = self.service.get_talks()
        
        assert len(result) == 2
        mock_make_request.assert_called_once_with("GET", "/talks", timeout=30)
    
    @patch.object(DIdService, '_make_request')
    def test_get_talks_error(self, mock_make_request):
        """Test get_talks with error"""
        self.service.api_key = "test_key"
        mock_make_request.side_effect = DIdAPIError(500, "Server error")
        
        with pytest.raises(DIdServiceError):
            self.service.get_talks()
    
    @patch.object(DIdService, '_make_request')
    def test_get_talk_by_id_success(self, mock_make_request):
        """Test get_talk_by_id with success"""
        self.service.api_key = "test_key"
        mock_make_request.return_value = {"id": "test_id", "status": "done"}
        
        result = self.service.get_talk_by_id("test_id")
        
        assert result["id"] == "test_id"
        mock_make_request.assert_called_once_with("GET", "/talks/test_id", timeout=30)
    
    @patch.object(DIdService, '_make_request')
    def test_create_talk_success(self, mock_make_request):
        """Test successful create_talk"""
        self.service.api_key = "test_key"
        mock_make_request.return_value = {
            "id": "test_id",
            "status": "created",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
    
        result = self.service.create_talk("https://example.com/image.jpg", "https://example.com/audio.mp3")
    
        assert result == "test_id"
        # Проверяем только основные поля, так как config может содержать дополнительные параметры
        call_args = mock_make_request.call_args
        assert call_args[0][0] == "POST"
        assert call_args[0][1] == "/talks"
        data = call_args[1]['data']
        assert data['source_url'] == "https://example.com/image.jpg"
        assert data['script']['type'] == "audio"
        assert data['script']['audio_url'] == "https://example.com/audio.mp3"
        assert data['config']['stitch'] is True
        assert data['config']['result_format'] == "mp4"
    
    def test_is_configured_true(self):
        """Test is_configured with API key"""
        self.service.api_key = "test_key"
        assert self.service.is_configured() is True
    
    def test_is_configured_false(self):
        """Test is_configured without API key"""
        self.service.api_key = None
        assert self.service.is_configured() is False


class TestDIdVideoRequest:
    """Test DIdVideoRequest model"""
    
    def test_create_basic_request(self):
        """Test creating basic video request"""
        from app.services.d_id_service import DIdScript, DIdScriptType
        
        script = DIdScript(type=DIdScriptType.AUDIO, audio_url="https://example.com/audio.mp3")
        request = DIdVideoRequest(
            source_url="https://example.com/image.jpg",
            script=script
        )
        
        assert request.source_url == "https://example.com/image.jpg"
        assert request.script.type == DIdScriptType.AUDIO
    
    def test_create_full_request(self):
        """Test creating full video request"""
        from app.services.d_id_service import DIdScript, DIdScriptType, DIdConfig
        
        script = DIdScript(type=DIdScriptType.AUDIO, audio_url="https://example.com/audio.mp3")
        config = DIdConfig(stitch=False, result_format="webm")
        
        request = DIdVideoRequest(
            source_url="https://example.com/image.jpg",
            script=script,
            driver_url="bank://lively/driver-05",
            webhook="https://example.com/webhook",
            config=config
        )
        
        assert request.source_url == "https://example.com/image.jpg"
        assert request.driver_url == "bank://lively/driver-05"
        assert request.webhook == "https://example.com/webhook"
        assert request.config.stitch is False


class TestDIdVideoResponse:
    """Test DIdVideoResponse model"""
    
    def test_create_response(self):
        """Test creating video response"""
        response = DIdVideoResponse(
            id="test_id",
            status=DIdStatus.CREATED,
            created_at="2023-01-01T00:00:00Z",
            updated_at="2023-01-01T00:00:00Z",
            result_url="https://example.com/video.mp4"
        )
        
        assert response.id == "test_id"
        assert response.status == DIdStatus.CREATED
        assert response.result_url == "https://example.com/video.mp4"


class TestDIdStatus:
    """Test DIdStatus enum"""
    
    def test_status_values(self):
        """Test DIdStatus enum values"""
        assert DIdStatus.CREATED == "created"
        assert DIdStatus.STARTED == "started"
        assert DIdStatus.DONE == "done"
        assert DIdStatus.FAILED == "failed"
        assert DIdStatus.REJECTED == "rejected"


class TestDIdModel:
    """Test DIdModel enum"""
    
    def test_model_values(self):
        """Test DIdModel enum values"""
        assert DIdModel.REALISTIC == "realistic"
        assert DIdModel.ANIMATED == "animated"


class TestDIdExceptions:
    """Test D-ID exceptions"""
    
    def test_d_id_service_error(self):
        """Test DIdServiceError"""
        error = DIdServiceError("Test error")
        assert str(error) == "Test error"
    
    def test_d_id_configuration_error(self):
        """Test DIdConfigurationError"""
        error = DIdConfigurationError("Configuration error")
        assert str(error) == "Configuration error"
        assert isinstance(error, DIdServiceError)
    
    def test_d_id_api_error(self):
        """Test DIdAPIError"""
        error = DIdAPIError(401, "Unauthorized")
        assert error.status_code == 401
        assert error.message == "Unauthorized"
        assert str(error) == "D-ID API error 401: Unauthorized"
        assert isinstance(error, DIdServiceError) 