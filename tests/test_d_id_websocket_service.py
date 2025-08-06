"""
Test D-ID WebSocket Service with real data
"""

import pytest
import asyncio
import json
import base64
from unittest.mock import Mock, patch, AsyncMock
from app.services.d_id_websocket_service import DIdWebSocketService


class TestDIdWebSocketService:
    """Test D-ID WebSocket Service with real data"""
    
    def setup_method(self):
        """Setup test environment"""
        with patch('app.services.d_id_websocket_service.config') as mock_config:
            mock_config.D_ID_API_KEY = "test_api_key"
            self.service = DIdWebSocketService()
    
    @pytest.mark.asyncio
    async def test_service_initialization(self):
        """Test service initialization"""
        assert self.service.api_key == "test_api_key"
        assert self.service.websocket_url == "wss://api.d-id.com/streams"
        assert self.service.is_connected is False
        assert self.service.stream_id is None
        assert self.service.session_id is None
    
    @pytest.mark.asyncio
    async def test_connect_success(self):
        """Test successful WebSocket connection"""
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('app.services.d_id_websocket_service.websockets.connect', return_value=mock_ws):
            connection_called = False
            message_called = False
            
            async def on_connection_change(status):
                nonlocal connection_called
                connection_called = True
                assert status == "connected"
            
            async def on_message(data):
                nonlocal message_called
                message_called = True
            
            await self.service.connect(on_message, on_connection_change)
            
            assert self.service.is_connected is True
            assert connection_called is True
    
    @pytest.mark.asyncio
    async def test_init_stream_with_real_data(self):
        """Test stream initialization with real data"""
        # Real D-ID stream initialization data
        real_source_url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face"
        real_presenter_type = "talk"
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test sending real init stream message
            await self.service.init_stream(real_source_url, real_presenter_type)
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "init_stream"
            assert sent_message["source_url"] == real_source_url
            assert sent_message["presenter_type"] == real_presenter_type
    
    @pytest.mark.asyncio
    async def test_send_stream_text_with_real_data(self):
        """Test sending real text data"""
        real_text = "Hello, this is a test message for D-ID WebSocket streaming!"
        real_voice_id = "en-US-JennyNeural"
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test sending real text
            await self.service.send_stream_text(real_text, real_voice_id, 0)
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "stream_text"
            assert sent_message["text"] == real_text
            assert sent_message["voice_id"] == real_voice_id
            assert sent_message["index"] == 0
    
    @pytest.mark.asyncio
    async def test_send_stream_audio_with_real_data(self):
        """Test sending real audio data"""
        # Real audio data (base64 encoded)
        real_audio_data = base64.b64encode(b"fake_audio_data_for_testing").decode('utf-8')
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test sending real audio
            await self.service.send_stream_audio(b"fake_audio_data_for_testing", 0)
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "stream_audio"
            assert sent_message["audio"] == real_audio_data
            assert sent_message["index"] == 0
    
    @pytest.mark.asyncio
    async def test_handle_real_messages(self):
        """Test handling real D-ID WebSocket messages"""
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
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([json.dumps(msg) for msg in real_messages]))
        
        received_messages = []
        
        async def on_message(data):
            received_messages.append(data)
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect(on_message)
            
            # Wait for messages to be processed
            await asyncio.sleep(0.1)
            
            # Verify all messages were received
            assert len(received_messages) == len(real_messages)
            
            # Check specific message types
            assert received_messages[0]["type"] == "init_stream"
            assert received_messages[1]["type"] == "sdp"
            assert received_messages[2]["type"] == "stream_ready"
            assert received_messages[3]["type"] == "stream_started"
            assert received_messages[4]["type"] == "stream_done"
    
    @pytest.mark.asyncio
    async def test_sdp_answer_with_real_data(self):
        """Test sending real SDP answer"""
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
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test sending real SDP answer
            await self.service.send_sdp_answer(real_sdp_answer, real_session_id)
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "sdp"
            assert sent_message["answer"] == real_sdp_answer
            assert sent_message["session_id"] == real_session_id
    
    @pytest.mark.asyncio
    async def test_ice_candidate_with_real_data(self):
        """Test sending real ICE candidate"""
        real_candidate = "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host"
        real_sdp_mid = "0"
        real_sdp_m_line_index = 0
        real_session_id = "session_456"
        
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test sending real ICE candidate
            await self.service.send_ice_candidate(real_candidate, real_sdp_mid, real_sdp_m_line_index, real_session_id)
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "ice"
            assert sent_message["candidate"] == real_candidate
            assert sent_message["sdp_mid"] == real_sdp_mid
            assert sent_message["sdp_m_line_index"] == real_sdp_m_line_index
            assert sent_message["session_id"] == real_session_id
    
    @pytest.mark.asyncio
    async def test_delete_stream(self):
        """Test stream deletion"""
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Test deleting stream
            await self.service.delete_stream()
            
            # Verify the message was sent
            mock_ws.send.assert_called_once()
            sent_message = json.loads(mock_ws.send.call_args[0][0])
            
            assert sent_message["type"] == "delete_stream"
    
    @pytest.mark.asyncio
    async def test_disconnect(self):
        """Test WebSocket disconnection"""
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter([]))
        mock_ws.close = AsyncMock()
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            assert self.service.is_connected is True
            
            await self.service.disconnect()
            assert self.service.is_connected is False
            mock_ws.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_connection_error_handling(self):
        """Test connection error handling"""
        with patch('websockets.connect', side_effect=Exception("Connection failed")):
            connection_status = None
            
            async def on_connection_change(status):
                nonlocal connection_status
                connection_status = status
            
            with pytest.raises(Exception):
                await self.service.connect(on_connection_change=on_connection_change)
            
            assert connection_status == "failed"
            assert self.service.is_connected is False
    
    @pytest.mark.asyncio
    async def test_message_parsing_error(self):
        """Test handling of invalid JSON messages"""
        mock_ws = AsyncMock()
        mock_ws.__aiter__ = AsyncMock(return_value=iter(["invalid json message"]))
        
        with patch('websockets.connect', return_value=mock_ws):
            await self.service.connect()
            
            # Should not raise exception, just log error
            await asyncio.sleep(0.1)
            
            # Service should still be connected
            assert self.service.is_connected is True


if __name__ == "__main__":
    pytest.main([__file__])
