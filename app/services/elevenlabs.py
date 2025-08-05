import aiohttp
import os
import base64
from typing import Optional, Dict, Any
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class ElevenLabsService:
    """Service for interacting with ElevenLabs Speech to Speech API"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.base_url = "https://api.elevenlabs.io/v1"
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID
        
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY not found in environment variables")
    
    async def speech_to_speech(
        self, 
        audio_data: bytes, 
        voice_id: Optional[str] = None,
        model_id: str = "eleven_multilingual_v2"
    ) -> bytes:
        """
        Convert speech to speech using ElevenLabs STS API
        
        Args:
            audio_data: Raw audio bytes
            voice_id: Target voice ID (optional, uses default if not provided)
            model_id: Model to use for conversion
            
        Returns:
            Processed audio bytes
        """
        if not self.api_key:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        target_voice_id = voice_id or self.voice_id
        
        # Prepare the request payload
        payload = {
            "audio": base64.b64encode(audio_data).decode('utf-8'),
            "voice_id": target_voice_id,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/speech-to-speech",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)  # 60 seconds timeout
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        audio_base64 = result.get("audio")
                        
                        if audio_base64:
                            # Decode base64 audio back to bytes
                            processed_audio = base64.b64decode(audio_base64)
                            logger.info(f"Successfully processed audio with voice {target_voice_id}")
                            return processed_audio
                        else:
                            raise HTTPException(
                                status_code=500,
                                detail="No audio data received from ElevenLabs"
                            )
                    else:
                        error_text = await response.text()
                        logger.error(f"ElevenLabs API error: {response.status} - {error_text}")
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"ElevenLabs API error: {error_text}"
                        )
                        
        except aiohttp.ClientError as e:
            logger.error(f"Network error during ElevenLabs API call: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Network error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during ElevenLabs API call: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )
    
    async def get_available_voices(self) -> list:
        """Get list of available voices from ElevenLabs"""
        if not self.api_key:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/voices",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        return result.get("voices", [])
                    else:
                        error_text = await response.text()
                        logger.error(f"Error fetching voices: {response.status} - {error_text}")
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"Error fetching voices: {error_text}"
                        )
                        
        except Exception as e:
            logger.error(f"Error fetching voices: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching voices: {str(e)}"
            )
    
    async def validate_voice_id(self, voice_id: str) -> bool:
        """Validate if a voice ID exists"""
        voices = await self.get_available_voices()
        return any(voice.get("voice_id") == voice_id for voice in voices)


# Global instance
elevenlabs_service = ElevenLabsService() 