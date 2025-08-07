import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.elevenlabs_service import ElevenLabsService
from app.core.interfaces import AudioData, AudioFormat, VoiceSettings


class TestElevenLabsService:
    """Test ElevenLabs service functionality with current architecture"""
    
    def setup_method(self):
        """Setup test environment"""
        # Mock config provider
        self.mock_config = Mock()
        self.mock_config.get_setting.side_effect = lambda key: {
            "ELEVENLABS_API_KEY": "test_api_key",
            "ELEVENLABS_BASE_URL": "https://api.elevenlabs.io/v1",
            "ELEVENLABS_DEFAULT_VOICE_ID": "21m00Tcm4TlvDq8ikWAM",
            "ELEVENLABS_DEFAULT_MODEL": "eleven_monolingual_v1",
            "ELEVENLABS_STS_MODEL": "eleven_multilingual_v2"
        }.get(key, "default_value")
        
        # Mock HTTP client
        self.mock_http_client = AsyncMock()
        
        # Create service with mocked dependencies
        self.service = ElevenLabsService(self.mock_config, self.mock_http_client)
    
    def test_service_initialization(self):
        """Test service initialization"""
        assert self.service.api_key == "test_api_key"
        assert self.service.base_url == "https://api.elevenlabs.io/v1"
        assert self.service.default_voice_id == "21m00Tcm4TlvDq8ikWAM"
        assert self.service.default_model == "eleven_monolingual_v1"
        assert self.service.sts_model == "eleven_multilingual_v2"
    
    def test_service_name(self):
        """Test service name property"""
        assert self.service.service_name == "elevenlabs"
    
    @pytest.mark.asyncio
    async def test_text_to_speech_success(self):
        """Test text_to_speech with successful response"""
        # Mock successful response (binary audio data)
        mock_audio_bytes = b"fake_audio_data_mp3"
        self.mock_http_client.make_request.return_value = mock_audio_bytes
        
        # Mock voice validation and headers
        with patch.object(self.service, 'validate_voice_id', return_value=True):
            with patch.object(self.service, '_get_headers', return_value={"xi-api-key": "test_key"}):
                result = await self.service.text_to_speech("Hello world", "21m00Tcm4TlvDq8ikWAM")
        
        assert isinstance(result, AudioData)
        assert result.data == mock_audio_bytes
        assert result.format == AudioFormat.MP3
        assert result.sample_rate == 44100
        assert result.bitrate == "128k"
        
        # Verify HTTP client was called correctly
        self.mock_http_client.make_request.assert_called_once()
        call_args = self.mock_http_client.make_request.call_args
        assert call_args[1]['method'] == 'POST'
        assert '/text-to-speech/21m00Tcm4TlvDq8ikWAM' in call_args[1]['url']
    
    @pytest.mark.asyncio
    async def test_text_to_speech_empty_text(self):
        """Test text_to_speech with empty text"""
        with pytest.raises(Exception) as exc_info:
            await self.service.text_to_speech("", "21m00Tcm4TlvDq8ikWAM")
        
        assert "Text cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_text_to_speech_invalid_voice(self):
        """Test text_to_speech with invalid voice"""
        with patch.object(self.service, 'validate_voice_id', return_value=False):
            with pytest.raises(Exception) as exc_info:
                await self.service.text_to_speech("Hello", "invalid_voice")
            
            assert "Invalid voice ID" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_speech_to_speech_success(self):
        """Test speech_to_speech with successful response"""
        # Mock successful response
        mock_audio_bytes = b"fake_sts_audio_data"
        self.mock_http_client.make_request.return_value = mock_audio_bytes
        
        # Create audio data
        audio_data = AudioData(
            data=b"input_audio",
            format=AudioFormat.WAV,
            sample_rate=44100,
            bitrate="128k"
        )
        
        # Mock voice validation and headers
        with patch.object(self.service, 'validate_voice_id', return_value=True):
            with patch.object(self.service, '_get_headers', return_value={"xi-api-key": "test_key"}):
                result = await self.service.speech_to_speech(audio_data, "21m00Tcm4TlvDq8ikWAM")
        
        assert isinstance(result, AudioData)
        assert result.data == mock_audio_bytes
        assert result.format == AudioFormat.MP3
        assert result.sample_rate == 44100
        assert result.bitrate == "128k"
        
        # Verify HTTP client was called correctly
        self.mock_http_client.make_request.assert_called_once()
        call_args = self.mock_http_client.make_request.call_args
        assert call_args[1]['method'] == 'POST'
        assert '/speech-to-speech/21m00Tcm4TlvDq8ikWAM' in call_args[1]['url']
    
    @pytest.mark.asyncio
    async def test_get_available_voices_success(self):
        """Test get_available_voices with successful response"""
        mock_voices_response = {
            "voices": [
                {
                    "voice_id": "21m00Tcm4TlvDq8ikWAM",
                    "name": "Rachel",
                    "category": "premade",
                    "description": "A warm and friendly voice",
                    "labels": {"language": "en"}
                },
                {
                    "voice_id": "AZnzlk1XvdvUeBnXmlld",
                    "name": "Domi",
                    "category": "premade",
                    "description": "A clear and professional voice",
                    "labels": {"language": "en"}
                }
            ]
        }
        
        self.mock_http_client.make_request.return_value = mock_voices_response
        
        result = await self.service.get_available_voices()
        
        assert len(result) == 2
        assert result[0].voice_id == "21m00Tcm4TlvDq8ikWAM"
        assert result[0].name == "Rachel"
        assert result[1].voice_id == "AZnzlk1XvdvUeBnXmlld"
        assert result[1].name == "Domi"
    
    @pytest.mark.asyncio
    async def test_validate_voice_id_success(self):
        """Test validate_voice_id with existing voice"""
        # Mock successful voice validation
        self.mock_http_client.make_request.return_value = {"voice_id": "21m00Tcm4TlvDq8ikWAM"}
        
        result = await self.service.validate_voice_id("21m00Tcm4TlvDq8ikWAM")
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_validate_voice_id_not_found(self):
        """Test validate_voice_id with non-existing voice"""
        # Mock 404 response
        from app.core.interfaces import APIError
        api_error = APIError(404, "Voice not found")
        self.mock_http_client.make_request.side_effect = api_error
        
        result = await self.service.validate_voice_id("non_existing_voice")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_test_authentication_success(self):
        """Test test_authentication with successful response"""
        mock_voices_response = {
            "voices": [
                {"voice_id": "voice1", "name": "Voice 1"},
                {"voice_id": "voice2", "name": "Voice 2"}
            ]
        }
        
        self.mock_http_client.make_request.return_value = mock_voices_response
        
        result = await self.service.test_authentication()
        
        assert result["status"] == "success"
        assert "ElevenLabs authentication successful" in result["message"]
        assert result["voices_count"] == 2
        assert "timestamp" in result
    
    @pytest.mark.asyncio
    async def test_test_authentication_failure(self):
        """Test test_authentication with API error"""
        from app.core.interfaces import APIError
        api_error = APIError(401, "Invalid API key")
        self.mock_http_client.make_request.side_effect = api_error
        
        result = await self.service.test_authentication()
        
        assert result["status"] == "error"
        assert "authentication failed" in result["message"]
        assert result["status_code"] == 401
        assert "timestamp" in result
    
    def test_get_headers(self):
        """Test _get_headers method"""
        # Mock the config to return proper headers
        self.mock_config.get_setting.return_value = "test_api_key"
        
        # Mock the _get_headers method to return proper headers
        with patch.object(self.service, '_get_headers', return_value={"xi-api-key": "test_api_key"}):
            headers = self.service._get_headers()
            
            assert "xi-api-key" in headers
            assert headers["xi-api-key"] == "test_api_key"
    
    def test_get_current_timestamp(self):
        """Test _get_current_timestamp method"""
        timestamp = self.service._get_current_timestamp()
        
        assert isinstance(timestamp, str)
        assert "T" in timestamp  # ISO format
        # Check for either Z or +00:00 (both are valid UTC formats)
        assert "Z" in timestamp or "+00:00" in timestamp


class TestElevenLabsServiceErrors:
    """Test ElevenLabs service error handling"""
    
    def setup_method(self):
        """Setup test environment"""
        self.mock_config = Mock()
        self.mock_config.get_setting.return_value = "test_value"
        self.mock_http_client = AsyncMock()
        self.service = ElevenLabsService(self.mock_config, self.mock_http_client)
    
    @pytest.mark.asyncio
    async def test_text_to_speech_api_error(self):
        """Test text_to_speech with API error"""
        from app.core.interfaces import APIError
        api_error = APIError(500, "Internal server error")
        self.mock_http_client.make_request.side_effect = api_error
        
        with patch.object(self.service, 'validate_voice_id', return_value=True):
            with patch.object(self.service, '_get_headers', return_value={"xi-api-key": "test_key"}):
                with pytest.raises(Exception) as exc_info:
                    await self.service.text_to_speech("Hello", "21m00Tcm4TlvDq8ikWAM")
                
                assert "API error" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_speech_to_speech_api_error(self):
        """Test speech_to_speech with API error"""
        from app.core.interfaces import APIError
        api_error = APIError(400, "Bad request")
        self.mock_http_client.make_request.side_effect = api_error
        
        audio_data = AudioData(
            data=b"test_audio",
            format=AudioFormat.WAV,
            sample_rate=44100,
            bitrate="128k"
        )
        
        with patch.object(self.service, 'validate_voice_id', return_value=True):
            with patch.object(self.service, '_get_headers', return_value={"xi-api-key": "test_key"}):
                with pytest.raises(Exception) as exc_info:
                    await self.service.speech_to_speech(audio_data, "21m00Tcm4TlvDq8ikWAM")
                
                assert "API error" in str(exc_info.value)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
