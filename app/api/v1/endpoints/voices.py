"""
Voice management endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any

from app.models.common import Voice, GetVoicesResponse, BaseResponse
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

@router.get("/", response_model=GetVoicesResponse)
async def get_voices(services: Dict[str, Any] = Depends(get_services)):
    """Get available voices from ElevenLabs"""
    try:
        elevenlabs_service = services["elevenlabs_service"]
        
        # Get voices from ElevenLabs API
        voices_data = await elevenlabs_service.get_available_voices()
        
        # Convert to our Voice model format
        voices = []
        for voice_data in voices_data:
            voice = Voice(
                voice_id=voice_data.voice_id,
                name=voice_data.name,
                description=voice_data.description or f"Voice: {voice_data.name}",
                category=voice_data.category
            )
            voices.append(voice)
        
        logger.info(f"Retrieved {len(voices)} voices from ElevenLabs")
        
        return GetVoicesResponse(
            success=True,
            voices=voices
        )
        
    except Exception as e:
        logger.error(f"Error getting voices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get voices: {str(e)}"
        )

@router.get("/{voice_id}", response_model=Voice)
async def get_voice(voice_id: str, services: Dict[str, Any] = Depends(get_services)):
    """Get specific voice by ID from ElevenLabs"""
    try:
        elevenlabs_service = services["elevenlabs_service"]
        
        # Validate voice ID
        is_valid = await elevenlabs_service.validate_voice_id(voice_id)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Voice with ID {voice_id} not found"
            )
        
        # Get all voices and find the specific one
        voices_data = await elevenlabs_service.get_available_voices()
        for voice_data in voices_data:
            if voice_data.voice_id == voice_id:
                return Voice(
                    voice_id=voice_data.voice_id,
                    name=voice_data.name,
                    description=voice_data.description or f"Voice: {voice_data.name}",
                    category=voice_data.category
                )
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice with ID {voice_id} not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting voice {voice_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get voice: {str(e)}"
        )
