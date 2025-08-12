"""
Text-to-Speech endpoints
"""
import logging
import base64
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import Response
from typing import Dict, Any

from app.models.common import TTSRequest, PlayVoiceRequest, BaseResponse
from app.core.factory import get_service_container
from app.core.base import ConfigurationProvider
from app.core.config import settings as config

logger = logging.getLogger(__name__)
router = APIRouter()

def get_services():
    """Dependency injection for services"""
    config_provider = ConfigurationProvider(config)
    container = get_service_container(config_provider)
    return {
        "elevenlabs_service": container.get_tts_service(),
        "config_provider": config_provider
    }

@router.post("/generate")
async def generate_tts(request: TTSRequest, services: Dict[str, Any] = Depends(get_services)):
    """Generate speech from text using ElevenLabs"""
    try:
        elevenlabs_service = services["elevenlabs_service"]
        
        # Use default voice if not specified
        voice_id = request.voice_id or "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        logger.info(f"Generating TTS for text: '{request.text[:50]}...' with voice {voice_id}")
        
        # Generate audio using ElevenLabs
        audio_data = await elevenlabs_service.text_to_speech(
            text=request.text,
            voice_id=voice_id
        )
        
        # Return audio as response
        return Response(
            content=audio_data.data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=generated_speech.mp3"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating TTS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate speech: {str(e)}"
        )

@router.post("/play", response_model=BaseResponse)
async def play_voice(request: PlayVoiceRequest, services: Dict[str, Any] = Depends(get_services)):
    """Play voice with text using ElevenLabs"""
    try:
        elevenlabs_service = services["elevenlabs_service"]
        
        logger.info(f"Playing voice {request.voice_id} with text: '{request.text[:50]}...'")
        
        # Generate audio using ElevenLabs
        audio_data = await elevenlabs_service.text_to_speech(
            text=request.text,
            voice_id=request.voice_id
        )
        
        # For now, just return success response
        # In a real implementation, you might want to stream the audio or store it
        return BaseResponse(
            success=True,
            message=f"Audio generated successfully for voice {request.voice_id}"
        )
        
    except Exception as e:
        logger.error(f"Error playing voice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to play voice: {str(e)}"
        )
