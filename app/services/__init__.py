"""
Services package for external API integrations
"""

# Экспорт сервисов и исключений

# ElevenLabs Service
from .elevenlabs_service import (
    ElevenLabsService,
    ElevenLabsServiceError,
    ElevenLabsConfigurationError,
    ElevenLabsAPIError,
    VoiceSettings,
    SpeechToSpeechRequest,
    Voice
)

# D-ID Service
from .d_id_service import (
    DIdService,
    DIdServiceError,
    DIdConfigurationError,
    DIdAPIError,
    DIdVideoRequest,
    DIdVideoResponse,
    DIdStatus,
    DIdModel,
    DIdScriptType,
    DIdProviderType,
    DIdExpression,
    DIdScript,
    DIdExpressionConfig,
    DIdDriverExpressions,
    DIdConfig
)

# Storage Service
from .storage_service import (
    StorageService,
    StorageServiceError,
    StorageConfigurationError,
    StorageUploadError,
    UploadResult
)

__all__ = [
    # ElevenLabs
    "ElevenLabsService",
    "ElevenLabsServiceError", 
    "ElevenLabsConfigurationError",
    "ElevenLabsAPIError",
    "VoiceSettings",
    "SpeechToSpeechRequest",
    "Voice",
    
    # D-ID
    "DIdService",
    "DIdServiceError",
    "DIdConfigurationError", 
    "DIdAPIError",
    "DIdVideoRequest",
    "DIdVideoResponse",
    "DIdStatus",
    "DIdModel",
    "DIdScriptType",
    "DIdProviderType",
    "DIdExpression",
    "DIdScript",
    "DIdExpressionConfig",
    "DIdDriverExpressions",
    "DIdConfig",
    
    # Storage
    "StorageService",
    "StorageServiceError",
    "StorageConfigurationError",
    "StorageUploadError",
    "UploadResult"
] 