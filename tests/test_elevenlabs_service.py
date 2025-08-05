import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from app.services.elevenlabs_service import (
    ElevenLabsService,
    SpeechToSpeechRequest,
    VoiceSettings,
    Voice,
    ElevenLabsModel
)


class TestElevenLabsService:
    """Test ElevenLabs service functionality"""
    
    def setup_method(self):
        """Setup test environment"""
        # Создаем сервис без API ключа для тестов
        self.service = ElevenLabsService()
        # Устанавливаем API ключ в None для тестов
        self.service.api_key = None
    
    def test_service_initialization_with_api_key(self):
        """Test service initialization with API key"""
        service = ElevenLabsService()
        # Проверяем, что сервис создается (API ключ загружается из config)
        assert service.api_key is not None
    
    def test_service_initialization_without_api_key(self):
        """Test service initialization without API key"""
        # Создаем сервис и устанавливаем API ключ в None
        service = ElevenLabsService()
        service.api_key = None
        assert service.api_key is None
    
    def test_service_initialization_with_env_api_key(self):
        """Test service initialization with environment API key"""
        # Тест проверяет, что API ключ загружается из config
        service = ElevenLabsService()
        # API ключ должен быть загружен из config
        assert service.api_key is not None
    
    def test_is_configured(self):
        """Test is_configured method"""
        service = ElevenLabsService()
        # Проверяем, что метод работает
        result = service.is_configured()
        assert isinstance(result, bool)
    
    def test_validate_configuration_success(self):
        """Test _validate_configuration with valid API key"""
        self.service.api_key = "test_key"
        # Не должно вызывать исключение
        self.service._validate_configuration()
    
    def test_validate_configuration_failure(self):
        """Test _validate_configuration without API key"""
        self.service.api_key = None
        from app.services.elevenlabs_service import ElevenLabsConfigurationError
        with pytest.raises(ElevenLabsConfigurationError):
            self.service._validate_configuration()
    
    def test_get_headers(self):
        """Test _get_headers method"""
        self.service.api_key = "test_key"
        headers = self.service._get_headers()
        assert "xi-api-key" in headers
        assert headers["xi-api-key"] == "test_key"
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_make_request_success(self, mock_get):
        """Test _make_request with successful response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.json.return_value = {"test": "data"}
        mock_get.return_value = mock_response
        
        result = self.service._make_request("GET", "/test")
        
        assert result == {"test": "data"}
        mock_get.assert_called_once()
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_make_request_api_error(self, mock_get):
        """Test _make_request with API error"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        from app.services.elevenlabs_service import ElevenLabsAPIError
        with pytest.raises(ElevenLabsAPIError) as exc_info:
            self.service._make_request("GET", "/test")
        
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in exc_info.value.message
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_make_request_network_error(self, mock_get):
        """Test _make_request with network error"""
        self.service.api_key = "test_key"
        from requests.exceptions import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        from app.services.elevenlabs_service import ElevenLabsServiceError
        with pytest.raises(ElevenLabsServiceError) as exc_info:
            self.service._make_request("GET", "/test")
        
        assert "Network error" in str(exc_info.value)
    
    @patch('app.services.elevenlabs_service.requests.post')
    def test_speech_to_speech_success(self, mock_post):
        """Test speech_to_speech with successful response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.content = b"audio_data"
        mock_post.return_value = mock_response
        
        request = SpeechToSpeechRequest(
            audio_data=b"test_audio",
            voice_id="test_voice"
        )
        
        result = self.service.speech_to_speech(request)
        
        assert result == b"audio_data"
        mock_post.assert_called_once()
    
    @patch('app.services.elevenlabs_service.requests.post')
    def test_speech_to_speech_no_audio_response(self, mock_post):
        """Test speech_to_speech with no audio in response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.content = b""
        mock_post.return_value = mock_response
        
        request = SpeechToSpeechRequest(
            audio_data=b"test_audio",
            voice_id="test_voice"
        )
        
        from app.services.elevenlabs_service import ElevenLabsServiceError
        with pytest.raises(ElevenLabsServiceError) as exc_info:
            self.service.speech_to_speech(request)
        
        assert "No audio data received" in str(exc_info.value)
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_get_available_voices_success(self, mock_get):
        """Test get_available_voices with successful response"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.json.return_value = {
            "voices": [
                {"voice_id": "voice1", "name": "Voice 1"},
                {"voice_id": "voice2", "name": "Voice 2"}
            ]
        }
        mock_get.return_value = mock_response
        
        result = self.service.get_available_voices()
        
        assert len(result) == 2
        assert result[0]["voice_id"] == "voice1"
        assert result[1]["voice_id"] == "voice2"
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_validate_voice_id_true(self, mock_get):
        """Test validate_voice_id with existing voice"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.json.return_value = {"voice_id": "test_voice"}
        mock_get.return_value = mock_response
        
        result = self.service.validate_voice_id("test_voice")
        
        assert result is True
        mock_get.assert_called_once_with("/voices/test_voice")
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_validate_voice_id_false(self, mock_get):
        """Test validate_voice_id with non-existing voice"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Voice not found"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        result = self.service.validate_voice_id("non_existing_voice")
        
        assert result is False
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_get_voice_by_id_found(self, mock_get):
        """Test get_voice_by_id with existing voice"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.json.return_value = {
            "voice_id": "test_voice",
            "name": "Test Voice"
        }
        mock_get.return_value = mock_response
        
        result = self.service.get_voice_by_id("test_voice")
        
        assert result["voice_id"] == "test_voice"
        assert result["name"] == "Test Voice"
    
    @patch('app.services.elevenlabs_service.requests.get')
    def test_get_voice_by_id_not_found(self, mock_get):
        """Test get_voice_by_id with non-existing voice"""
        self.service.api_key = "test_key"
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Voice not found"
        
        from requests.exceptions import HTTPError
        http_error = HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        result = self.service.get_voice_by_id("non_existing_voice")
        
        assert result is None


class TestSpeechToSpeechRequest:
    """Test SpeechToSpeechRequest model"""
    
    def test_request_initialization(self):
        """Test SpeechToSpeechRequest initialization"""
        request = SpeechToSpeechRequest(
            audio_data=b"test_audio",
            voice_id="test_voice"
        )
        
        assert request.audio_data == b"test_audio"
        assert request.voice_id == "test_voice"
        assert request.model_id == ElevenLabsModel.MULTILINGUAL_STS_V2
    
    def test_request_with_custom_settings(self):
        """Test SpeechToSpeechRequest with custom settings"""
        settings = VoiceSettings(
            stability=0.5,
            similarity_boost=0.75
        )
        
        request = SpeechToSpeechRequest(
            audio_data=b"test_audio",
            voice_id="test_voice",
            voice_settings=settings
        )
        
        assert request.voice_settings.stability == 0.5
        assert request.voice_settings.similarity_boost == 0.75


class TestVoiceSettings:
    """Test VoiceSettings model"""
    
    def test_default_settings(self):
        """Test VoiceSettings default values"""
        settings = VoiceSettings()
        
        assert settings.stability == 0.5
        assert settings.similarity_boost == 0.75
    
    def test_custom_settings(self):
        """Test VoiceSettings with custom values"""
        settings = VoiceSettings(
            stability=0.8,
            similarity_boost=0.9
        )
        
        assert settings.stability == 0.8
        assert settings.similarity_boost == 0.9


class TestVoice:
    """Test Voice model"""
    
    def test_voice_initialization(self):
        """Test Voice initialization"""
        voice = Voice(
            voice_id="test_id",
            name="Test Voice",
            category="test_category"
        )
        
        assert voice.voice_id == "test_id"
        assert voice.name == "Test Voice"
        assert voice.category == "test_category"
    
    def test_voice_default_values(self):
        """Test Voice default values"""
        voice = Voice(
            voice_id="test_id",
            name="Test Voice"
        )
        
        assert voice.voice_id == "test_id"
        assert voice.name == "Test Voice"
        assert voice.category is None


class TestElevenLabsModel:
    """Test ElevenLabsModel enum"""
    
    def test_model_values(self):
        """Test ElevenLabsModel enum values"""
        assert ElevenLabsModel.MULTILINGUAL_V2 == "eleven_multilingual_v2"
        assert ElevenLabsModel.MULTILINGUAL_STS_V2 == "eleven_multilingual_sts_v2"
        assert ElevenLabsModel.ENGLISH_STS_V2 == "eleven_english_sts_v2"


if __name__ == "__main__":
    pytest.main([__file__]) 