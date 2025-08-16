"""
Services package for external API integrations
"""

# Экспорт сервисов и исключений

# ElevenLabs Service
from .elevenlabs_service import (
    ElevenLabsService,
    ElevenLabsServiceError,
    ElevenLabsConfigurationError,
    ElevenLabsAPIError
)

# D-ID Service
from .d_id_service import (
    DIdService,
    DIdServiceError,
    DIdConfigurationError,
    DIdAPIError,
    DIdModel,
    DIdScriptType,
    DIdProviderType,
    DIdScript,
    DIdConfig
)

# D-ID File Service
from .d_id_file_service import (
    DIdFileService,
    DIdFileServiceError,
    DIdFileConfigurationError,
    DIdFileAPIError
)

# Storage Service
from .storage_service import (
    LocalStorageService,
    CloudinaryStorageService,
    StorageServiceError,
    StorageConfigurationError,
    StorageAPIError,
    create_storage_service
)

# WebRTC Service
from .webrtc_service import (
    WebRTCService
)

__all__ = [
    # ElevenLabs
    "ElevenLabsService",
    "ElevenLabsServiceError", 
    "ElevenLabsConfigurationError",
    "ElevenLabsAPIError",
    
    # D-ID
    "DIdService",
    "DIdServiceError",
    "DIdConfigurationError", 
    "DIdAPIError",
    "DIdModel",
    "DIdScriptType",
    "DIdProviderType",
    "DIdScript",
    "DIdConfig",
    
    # D-ID File
    "DIdFileService",
    "DIdFileServiceError",
    "DIdFileConfigurationError",
    "DIdFileAPIError",
    
    # Storage
    "LocalStorageService",
    "CloudinaryStorageService",
    "StorageServiceError",
    "StorageConfigurationError",
    "StorageAPIError",
    "create_storage_service",
    
    # WebRTC
    "WebRTCService"
] 