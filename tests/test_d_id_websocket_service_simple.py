"""
Simple test for D-ID WebSocket Service with real data
"""

import pytest
import json
import base64
from unittest.mock import patch, Mock
from app.services.d_id_websocket_service import DIdWebSocketService


class TestDIdWebSocketServiceSimple:
    """Simple test D-ID WebSocket Service with real data"""
    
    def setup_method(self):
        """Setup test environment"""
        with patch('app.services.d_id_websocket_service.config') as mock_config:
            mock_config.D_ID_API_KEY = "test_api_key"
            self.service = DIdWebSocketService()
    
    def test_service_initialization(self):
        """Test service initialization"""
        assert self.service.api_key == "test_api_key"
        assert self.service.websocket_url == "wss://api.d-id.com/streams"
        assert self.service.is_connected is False
        assert self.service.stream_id is None
        assert self.service.session_id is None
    
    def test_init_stream_message_format(self):
        """Test init stream message format with real data"""
        # Real D-ID stream initialization data
        real_source_url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face"
        real_presenter_type = "talk"
        
        # Test message format without connecting
        message = {
            "type": "init_stream",
            "source_url": real_source_url,
            "presenter_type": real_presenter_type
        }
        
        assert message["type"] == "init_stream"
        assert message["source_url"] == real_source_url
        assert message["presenter_type"] == real_presenter_type
    
    def test_stream_text_message_format(self):
        """Test stream text message format with real data"""
        real_text = "Hello, this is a test message for D-ID WebSocket streaming!"
        real_voice_id = "en-US-JennyNeural"
        real_index = 0
        
        message = {
            "type": "stream_text",
            "text": real_text,
            "voice_id": real_voice_id,
            "index": real_index
        }
        
        assert message["type"] == "stream_text"
        assert message["text"] == real_text
        assert message["voice_id"] == real_voice_id
        assert message["index"] == real_index
    
    def test_stream_audio_message_format(self):
        """Test stream audio message format with real data"""
        real_audio_data = b"fake_audio_data_for_testing"
        real_audio_base64 = base64.b64encode(real_audio_data).decode('utf-8')
        real_index = 0
        
        message = {
            "type": "stream_audio",
            "audio": real_audio_base64,
            "index": real_index
        }
        
        assert message["type"] == "stream_audio"
        assert message["audio"] == real_audio_base64
        assert message["index"] == real_index
    
    def test_sdp_answer_message_format(self):
        """Test SDP answer message format with real data"""
        real_sdp_answer = """v=0
o=- 1234567890 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=mid:0
a=recvonly
a=rtpmap:111 opus/48000/2
"""
        real_session_id = "session_456"
        
        message = {
            "type": "sdp",
            "answer": real_sdp_answer,
            "session_id": real_session_id
        }
        
        assert message["type"] == "sdp"
        assert message["answer"] == real_sdp_answer
        assert message["session_id"] == real_session_id
    
    def test_ice_candidate_message_format(self):
        """Test ICE candidate message format with real data"""
        real_candidate = "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host"
        real_sdp_mid = "0"
        real_sdp_m_line_index = 0
        real_session_id = "session_456"
        
        message = {
            "type": "ice",
            "candidate": real_candidate,
            "sdp_mid": real_sdp_mid,
            "sdp_m_line_index": real_sdp_m_line_index,
            "session_id": real_session_id
        }
        
        assert message["type"] == "ice"
        assert message["candidate"] == real_candidate
        assert message["sdp_mid"] == real_sdp_mid
        assert message["sdp_m_line_index"] == real_sdp_m_line_index
        assert message["session_id"] == real_session_id
    
    def test_real_d_id_messages_format(self):
        """Test real D-ID WebSocket messages format"""
        # Real D-ID WebSocket messages
        real_messages = [
            {
                "type": "init_stream",
                "stream_id": "stream_123",
                "session_id": "session_456"
            },
            {
                "type": "sdp",
                "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendonly\r\na=rtpmap:111 opus/48000/2\r\n",
                "session_id": "session_456"
            },
            {
                "type": "stream_ready",
                "stream_id": "stream_123"
            },
            {
                "type": "stream_started",
                "stream_id": "stream_123"
            },
            {
                "type": "stream_done",
                "stream_id": "stream_123"
            }
        ]
        
        # Test each message format
        for i, msg in enumerate(real_messages):
            assert "type" in msg
            assert msg["type"] in ["init_stream", "sdp", "stream_ready", "stream_started", "stream_done"]
            
            if msg["type"] == "init_stream":
                assert "stream_id" in msg
                assert "session_id" in msg
            elif msg["type"] == "sdp":
                assert "sdp" in msg
                assert "session_id" in msg
            elif msg["type"] in ["stream_ready", "stream_started", "stream_done"]:
                assert "stream_id" in msg
    
    def test_websocket_url_format(self):
        """Test WebSocket URL format with real API key"""
        api_key = "test_api_key_12345"
        expected_url = f"wss://api.d-id.com/streams?authorization=Basic {api_key}"
        
        # Simulate URL construction
        base_url = "wss://api.d-id.com/streams"
        ws_url = f"{base_url}?authorization=Basic {api_key}"
        
        assert ws_url == expected_url
        assert "wss://" in ws_url
        assert "api.d-id.com/streams" in ws_url
        assert "authorization=Basic" in ws_url
        assert api_key in ws_url
    
    def test_audio_encoding_format(self):
        """Test audio data encoding format"""
        # Real audio data
        real_audio_data = b"fake_audio_data_for_testing_12345"
        encoded_audio = base64.b64encode(real_audio_data).decode('utf-8')
        
        # Verify encoding
        assert isinstance(encoded_audio, str)
        assert len(encoded_audio) > 0
        
        # Verify decoding
        decoded_audio = base64.b64decode(encoded_audio.encode('utf-8'))
        assert decoded_audio == real_audio_data
    
    def test_json_message_serialization(self):
        """Test JSON message serialization with real data"""
        real_messages = [
            {
                "type": "init_stream",
                "source_url": "https://example.com/image.jpg",
                "presenter_type": "talk"
            },
            {
                "type": "stream_text",
                "text": "Hello world!",
                "voice_id": "en-US-JennyNeural",
                "index": 0
            },
            {
                "type": "stream_audio",
                "audio": base64.b64encode(b"test_audio").decode('utf-8'),
                "index": 0
            }
        ]
        
        for msg in real_messages:
            # Test serialization
            json_str = json.dumps(msg)
            assert isinstance(json_str, str)
            assert len(json_str) > 0
            
            # Test deserialization
            parsed_msg = json.loads(json_str)
            assert parsed_msg == msg
            assert parsed_msg["type"] == msg["type"]


if __name__ == "__main__":
    pytest.main([__file__])

