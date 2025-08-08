"""
Refactored ElevenLabs Service following SOLID principles
"""

import base64
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import json

from app.core.interfaces import (
    ITTSService, AudioData, AudioFormat, Voice, VoiceSettings, 
    ServiceError, ConfigurationError, APIError
)
from app.core.base import BaseService, AsyncHTTPClient

# Import official ElevenLabs library
from elevenlabs import stream
from elevenlabs.client import ElevenLabs


class ElevenLabsServiceError(ServiceError):
    """ElevenLabs service specific errors"""
    pass


class ElevenLabsConfigurationError(ConfigurationError):
    """ElevenLabs configuration errors"""
    pass


class ElevenLabsAPIError(APIError):
    """ElevenLabs API errors"""
    pass


class ElevenLabsService(ITTSService, BaseService):
    """
    Refactored ElevenLabs service following SOLID principles:
    - Single Responsibility: Only handles ElevenLabs API operations
    - Open/Closed: Extensible through interfaces
    - Liskov Substitution: Implements ITTSService interface
    - Interface Segregation: Uses specific interfaces
    - Dependency Inversion: Depends on abstractions
    """
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Service-specific configuration
        self.api_key = self.config.get_setting("ELEVENLABS_API_KEY")
        self.base_url = self.config.get_setting("ELEVENLABS_BASE_URL")
        self.default_voice_id = self.config.get_setting("ELEVENLABS_DEFAULT_VOICE_ID")
        self.default_model = self.config.get_setting("ELEVENLABS_DEFAULT_MODEL")
        self.sts_model = self.config.get_setting("ELEVENLABS_STS_MODEL")
        
        # Initialize official ElevenLabs client
        self.elevenlabs_client = ElevenLabs(api_key=self.api_key)
        
        self.logger.info(f"ElevenLabsService initialized with base URL: {self.base_url}")
    
    @property
    def service_name(self) -> str:
        return "elevenlabs"
    
    async def text_to_speech(self, text: str, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert text to speech"""
        if not text.strip():
            raise ElevenLabsServiceError("Text cannot be empty")
        
        if not await self.validate_voice_id(voice_id):
            raise ElevenLabsServiceError(f"Invalid voice ID: {voice_id}")
        
        try:
            self.logger.info(f"Making TTS request with voice {voice_id}")
            
            # Use official library for text-to-speech
            audio_stream = self.elevenlabs_client.text_to_speech.stream(
                text=text,
                voice_id=voice_id,
                model_id=self.default_model
            )
            
            # Collect all audio chunks
            audio_chunks = []
            for chunk in audio_stream:
                if isinstance(chunk, bytes):
                    audio_chunks.append(chunk)
            
            # Combine all chunks
            audio_bytes = b''.join(audio_chunks)
            
            self.logger.info(f"TTS completed, total bytes: {len(audio_bytes)}")
            
            return AudioData(
                data=audio_bytes,
                format=AudioFormat.MP3,
                sample_rate=44100,
                bitrate="128k"
            )
            
        except Exception as e:
            self.logger.error(f"TTS failed: {e}")
            raise ElevenLabsServiceError(f"Text-to-speech failed: {str(e)}")
    
    async def speech_to_speech(self, audio_data: AudioData, voice_id: str, settings: Optional[VoiceSettings] = None) -> AudioData:
        """Convert speech to speech with different voice"""
        if not audio_data.data:
            raise ElevenLabsServiceError("Audio data cannot be empty")
        
        if not await self.validate_voice_id(voice_id):
            raise ElevenLabsServiceError(f"Invalid voice ID: {voice_id}")
        
        try:
            self.logger.info(f"Speech-to-speech with voice: {voice_id}, audio size: {len(audio_data.data)} bytes")
            
            # Use original audio data for WebM/MP3, convert only if needed
            if audio_data.format == AudioFormat.WAV:
                wav_data = audio_data.data
            else:
                # For WebM, MP3, and other formats, use as-is
                wav_data = audio_data.data
            
            # Use direct API call for speech-to-speech
            endpoint = f"{self.base_url}/speech-to-speech/{voice_id}/stream"
            headers = self._get_headers()
            headers.pop("Content-Type", None)  # Let aiohttp set the correct content type
            
            # Determine correct MIME type based on audio format
            mime_type = "audio/wav"
            file_name = "audio.wav"
            
            if audio_data.format == AudioFormat.WEBM:
                mime_type = "audio/webm"
                file_name = "audio.webm"
            elif audio_data.format == AudioFormat.MP3:
                mime_type = "audio/mp3"
                file_name = "audio.mp3"
            elif audio_data.format == AudioFormat.OGG:
                mime_type = "audio/ogg"
                file_name = "audio.ogg"
            
            files = {
                "audio": (file_name, wav_data, mime_type)
            }
            
            data = {
                "model_id": self.sts_model,
                "output_format": "mp3_44100_128",
                "optimize_streaming_latency": 3
            }
            
            response = await self.http_client.make_request(
                method="POST",
                url=endpoint,
                headers=headers,
                data=data,
                files=files
            )
            
            if isinstance(response, bytes):
                self.logger.info(f"Speech-to-speech successful! Response size: {len(response)} bytes")
                return AudioData(
                    data=response,
                    format=AudioFormat.MP3,
                    sample_rate=44100,
                    bitrate="128k"
                )
            else:
                raise ElevenLabsServiceError(f"Unexpected response type: {type(response)}")
                
        except Exception as e:
            self.logger.error(f"Speech-to-speech failed: {e}")
            raise ElevenLabsServiceError(f"Speech-to-speech failed: {str(e)}")
    
    async def voice_changer_stream(self, audio_data: bytes, voice_id: str, model_id: str = "eleven_multilingual_sts_v2", 
                                 output_format: str = "mp3_44100_128", optimize_latency: int = 3) -> bytes:
        """Voice Changer Stream - converts audio to different voice using streaming endpoint"""
        
        try:
            self.logger.info(f"🎤 Voice Changer Stream with voice: {voice_id}, audio size: {len(audio_data)} bytes")
            
            # Prepare the streaming request
            stream_url = f"{self.base_url}/speech-to-speech/{voice_id}/stream"
            
            headers = self._get_headers()
            # Remove Content-Type for multipart form data
            headers.pop("Content-Type", None)
            
            data = {
                'model_id': model_id,
                'output_format': output_format,
                'optimize_streaming_latency': optimize_latency
            }
            
            files = {
                'audio': ('audio_input.webm', audio_data, 'audio/webm')
            }
            
            self.logger.info(f"🔄 Making Voice Changer Stream request to: {stream_url}")
            self.logger.info(f"📊 Request data: {data}")
            self.logger.info(f"📁 Files keys: {list(files.keys()) if files else 'None'}")
            self.logger.info(f"📁 Headers: {headers}")
            
            # Make the streaming request
            response = await self.http_client.make_request(
                method="POST",
                url=stream_url,
                headers=headers,
                data=data,
                files=files
            )
            
            self.logger.info(f"📡 Response received, type: {type(response)}")
            
            if isinstance(response, bytes):
                self.logger.info(f"✅ Voice Changer Stream successful! Response size: {len(response)} bytes")
                return response
            else:
                self.logger.warning(f"⚠️ No audio received from Voice Changer Stream, response: {response}")
                return b""
                
        except Exception as e:
            self.logger.error(f"❌ Voice Changer Stream failed: {e}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            raise ElevenLabsServiceError(f"Voice Changer Stream failed: {str(e)}")

    async def speech_to_speech_stream(self, audio_data: bytes, voice_id: str, model_id: str = "eleven_multilingual_sts_v2") -> bytes:
        """Convert speech to speech with different voice - streaming version"""
        if not audio_data:
            raise ElevenLabsServiceError("Audio data cannot be empty")
        
        if not await self.validate_voice_id(voice_id):
            raise ElevenLabsServiceError(f"Invalid voice ID: {voice_id}")
        
        try:
            self.logger.info(f"🔄 Speech-to-speech streaming with voice: {voice_id}, audio size: {len(audio_data)} bytes")
            
            # Convert WebM to WAV using ffmpeg
            try:
                self.logger.info("🔄 Starting FFmpeg conversion...")
                import subprocess
                import tempfile
                import os
                
                # Create temporary files for input and output
                with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as input_file:
                    input_file.write(audio_data)
                    input_path = input_file.name
                
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as output_file:
                    output_path = output_file.name
                
                try:
                    # Run ffmpeg with file paths instead of pipes
                    process = subprocess.Popen([
                        'ffmpeg',
                        '-i', input_path,  # Input file
                        '-f', 'wav',     # Output format
                        '-acodec', 'pcm_s16le',  # Audio codec
                        '-ar', '44100',  # Sample rate
                        '-ac', '1',      # Mono audio
                        '-y',            # Overwrite output file
                        output_path      # Output file
                    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    
                    # Wait for completion
                    stdout, stderr = process.communicate()
                    
                    if process.returncode != 0:
                        stderr_text = stderr.decode() if stderr else "Unknown error"
                        self.logger.error(f"❌ FFmpeg conversion failed: {stderr_text}")
                        raise Exception(f"FFmpeg conversion failed: {stderr_text}")
                    
                    # Read the converted WAV file
                    with open(output_path, 'rb') as f:
                        wav_data = f.read()
                    
                    self.logger.info(f"✅ Converted WebM to WAV: {len(wav_data)} bytes")
                    
                    # Use direct API call for streaming
                    endpoint = f"{self.base_url}/speech-to-speech/{voice_id}/stream?output_format=mp3_44100_128"
                    headers = self._get_headers()
                    headers.pop("Content-Type", None)  # Let aiohttp set the correct content type
                    
                    self.logger.info(f"🔄 Making request to ElevenLabs API: {endpoint}")
                    
                    # Prepare multipart form data according to API documentation
                    files = {
                        "audio": ("audio.wav", wav_data, "audio/wav")
                    }
                    
                    data = {
                        "model_id": model_id,
                    }
                    
                    self.logger.info(f"🔄 Request data: {data}")
                    
                    # Make streaming request
                    response = await self.http_client.make_request(
                        method="POST",
                        url=endpoint,
                        headers=headers,
                        data=data,
                        files=files
                    )
                    
                    self.logger.info(f"🔄 Response received, type: {type(response)}")
                    
                    if isinstance(response, bytes):
                        self.logger.info(f"✅ Streaming STS successful! Response size: {len(response)} bytes")
                        return response
                    else:
                        self.logger.warning(f"⚠️ No audio received from ElevenLabs, response: {response}")
                        return b""
                    
                finally:
                    # Clean up input and output files
                    if os.path.exists(input_path):
                        os.unlink(input_path)
                    if os.path.exists(output_path):
                        os.unlink(output_path)
                
            except Exception as e:
                self.logger.error(f"❌ Failed to process audio: {e}")
                import traceback
                self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
                return b""
                
        except Exception as e:
            self.logger.error(f"❌ Unexpected error in speech_to_speech_stream: {e}")
            import traceback
            self.logger.error(f"❌ Outer traceback: {traceback.format_exc()}")
            raise ElevenLabsServiceError(f"Speech-to-speech streaming failed: {str(e)}")
    
    async def get_available_voices(self) -> List[Voice]:
        """Get list of available voices"""
        try:
            # Use official library to get voices
            voices_data = self.elevenlabs_client.voices.get_all()
            
            self.logger.info(f"Retrieved voices from ElevenLabs, type: {type(voices_data)}")
            
            # Handle different response types
            if hasattr(voices_data, 'voices'):
                # If it's a response object with voices attribute
                voices_list = voices_data.voices
            elif isinstance(voices_data, list):
                # If it's already a list
                voices_list = voices_data
            else:
                # Try to convert to list
                voices_list = list(voices_data)
            
            self.logger.info(f"Processing {len(voices_list)} voices")
            
            voices = []
            for voice_data in voices_list:
                try:
                    # Log voice data structure for debugging
                    self.logger.debug(f"Voice data type: {type(voice_data)}")
                    self.logger.debug(f"Voice data: {voice_data}")
                    
                    # Handle different voice data structures
                    if hasattr(voice_data, 'voice_id'):
                        voice = Voice(
                            voice_id=voice_data.voice_id,
                            name=voice_data.name,
                            category=voice_data.category,
                            description=getattr(voice_data, 'description', '') or "",
                            labels=getattr(voice_data, 'labels', {}) or {}
                        )
                    elif isinstance(voice_data, dict):
                        voice = Voice(
                            voice_id=voice_data.get('voice_id'),
                            name=voice_data.get('name'),
                            category=voice_data.get('category'),
                            description=voice_data.get('description', '') or "",
                            labels=voice_data.get('labels', {}) or {}
                        )
                    else:
                        self.logger.warning(f"Unknown voice data structure: {voice_data}")
                        continue
                    
                    voices.append(voice)
                    
                except Exception as voice_error:
                    self.logger.error(f"Error processing voice data {voice_data}: {voice_error}")
                    continue
            
            self.logger.info(f"Successfully processed {len(voices)} voices")
            return voices
            
        except Exception as e:
            self.logger.error(f"Failed to get voices: {e}")
            raise ElevenLabsServiceError(f"Failed to get voices: {str(e)}")
    
    async def validate_voice_id(self, voice_id: str) -> bool:
        """Validate voice ID"""
        if not voice_id:
            return False
        
        try:
            # Use official library to validate voice
            voices_data = self.elevenlabs_client.voices.get_all()
            
            # Handle different response types
            if hasattr(voices_data, 'voices'):
                # If it's a response object with voices attribute
                voices_list = voices_data.voices
            elif isinstance(voices_data, list):
                # If it's already a list
                voices_list = voices_data
            else:
                # Try to convert to list
                voices_list = list(voices_data)
            
            # Check if voice_id exists in the list
            for voice in voices_list:
                if hasattr(voice, 'voice_id') and voice.voice_id == voice_id:
                    return True
                elif isinstance(voice, dict) and voice.get('voice_id') == voice_id:
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error validating voice ID: {e}")
            return False
    
    async def test_authentication(self) -> Dict[str, Any]:
        """Test service authentication"""
        try:
            # Use official library to test authentication
            voices_data = self.elevenlabs_client.voices.get_all()
            
            # Handle different response types
            if hasattr(voices_data, 'voices'):
                # If it's a response object with voices attribute
                voices_list = voices_data.voices
            elif isinstance(voices_data, list):
                # If it's already a list
                voices_list = voices_data
            else:
                # Try to convert to list
                voices_list = list(voices_data)
            
            return {
                "status": "success",
                "message": "ElevenLabs authentication successful",
                "voices_count": len(voices_list),
                "timestamp": self._get_current_timestamp()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"ElevenLabs authentication failed: {str(e)}",
                "timestamp": self._get_current_timestamp()
            }
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
