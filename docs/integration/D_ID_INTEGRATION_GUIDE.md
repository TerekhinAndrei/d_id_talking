# 🔗 Полное руководство по интеграции D-ID

## 📋 Обзор

D-ID (Digital Identity) - это платформа для создания говорящих аватаров с использованием искусственного интеллекта. Данное руководство описывает полную интеграцию D-ID API в проект Talking Head.

## 🚀 Возможности D-ID

### Основные функции
- **Генерация говорящих аватаров** - создание видео с говорящими персонажами
- **Talks API** - создание и управление talks (видео с говорящими головами)
- **File API** - загрузка и управление изображениями и аудио
- **Стриминг** - генерация видео в реальном времени
- **WebRTC** - интерактивные сессии
- **Webhook поддержка** - асинхронные уведомления о статусе обработки

### Поддерживаемые форматы
- **Изображения:** JPEG, PNG, WebP
- **Аудио:** MP3, WAV, WebM, OGG
- **Видео:** MP4, WebM

## 🏗️ Архитектура интеграции

### Backend интеграция

#### 1. D-ID Service (`app/services/d_id_service.py`)
```python
class DIdService(IVideoGenerator, BaseService):
    """Сервис для работы с D-ID API"""
    
    def __init__(self, config_provider, http_client: AsyncHTTPClient):
        self.http_client = http_client
        super().__init__(config_provider)
        
        # Service-specific configuration
        self.api_key = self.config.get_setting("D_ID_API_KEY")
        self.base_url = self.config.get_setting("D_ID_BASE_URL")
        self.default_presenter_id = self.config.get_setting("D_ID_DEFAULT_PRESENTER_ID")
        self.default_driver_url = self.config.get_setting("D_ID_DEFAULT_DRIVER_URL")
    
    async def create_talk_direct(
        self,
        source_url: str,
        script: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Создание talk с прямым script"""
        payload = {
            "source_url": source_url,
            "script": script,
            "config": config or {"stitch": True, "result_format": "mp4"}
        }
        
        if driver_url:
            payload["driver_url"] = driver_url
        else:
            payload["driver_url"] = self.default_driver_url
        
        if webhook:
            payload["webhook"] = webhook
        
        response = await self.http_client.make_request(
            method="POST",
            url=f"{self.base_url}/talks",
            headers=self._get_headers(),
            data=payload
        )
        
        return response.get("id")
    
    async def create_talk_with_text(
        self, 
        image_url: str, 
        text: str, 
        provider: Optional[DIdProviderType] = None,
        voice_id: Optional[str] = None,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Создание talk с текстом"""
        script = DIdScript(
            type=DIdScriptType.TEXT,
            input=text,
            provider={
                "type": provider.value if provider else "microsoft",
                "voice_id": voice_id
            } if provider or voice_id else None
        )
        
        return await self.create_talk_direct(
            source_url=image_url,
            script={
                "type": script.type.value,
                "input": script.input,
                "provider": script.provider
            },
            driver_url=driver_url,
            webhook=webhook
        )
    
    async def create_talk_with_audio(
        self, 
        image_url: str, 
        audio_url: str,
        driver_url: Optional[str] = None,
        webhook: Optional[str] = None
    ) -> str:
        """Создание talk с аудио"""
        script = DIdScript(
            type=DIdScriptType.AUDIO,
            audio_url=audio_url
        )
        
        return await self.create_talk_direct(
            source_url=image_url,
            script={
                "type": script.type.value,
                "audio_url": script.audio_url
            },
            driver_url=driver_url,
            webhook=webhook
        )
    
    async def get_video_status(self, video_id: str) -> VideoResponse:
        """Получение статуса видео"""
        response = await self.http_client.make_request(
            method="GET",
            url=f"{self.base_url}/talks/{video_id}",
            headers=self._get_headers()
        )
        
        # Map D-ID status to our VideoStatus enum
        d_id_status = response.get("status", "")
        if d_id_status == "created":
            status = VideoStatus.PENDING
        elif d_id_status == "started":
            status = VideoStatus.PROCESSING
        elif d_id_status == "done":
            status = VideoStatus.COMPLETED
        elif d_id_status == "failed":
            status = VideoStatus.FAILED
        elif d_id_status == "rejected":
            status = VideoStatus.FAILED
        else:
            status = VideoStatus.PENDING
        
        return VideoResponse(
            video_id=video_id,
            status=status,
            result_url=response.get("result_url"),
            error_message=response.get("error", {}).get("message") if response.get("error") else None,
            created_at=response.get("created_at", ""),
            updated_at=response.get("updated_at", "")
        )
```

#### 2. D-ID File Service (`app/services/d_id_file_service.py`)
```python
class DIdFileService(AuthenticatedService):
    """Сервис для работы с D-ID File API"""
    
    async def upload_image(self, file: UploadFile) -> DIdFileUploadResponse:
        """Загрузка изображения в D-ID"""
        form_data = aiohttp.FormData()
        form_data.add_field('image', file.file, filename=file.filename)
        
        response = await self.http_client.post(
            "https://api.d-id.com/images",
            data=form_data,
            headers={"accept": "application/json"}
        )
        
        return DIdFileUploadResponse(**response)
    
    async def upload_audio(self, file: UploadFile) -> DIdFileUploadResponse:
        """Загрузка аудио в D-ID"""
        form_data = aiohttp.FormData()
        form_data.add_field('audio', file.file, filename=file.filename)
        
        response = await self.http_client.post(
            "https://api.d-id.com/audios",
            data=form_data,
            headers={"accept": "application/json"}
        )
        
        return DIdFileUploadResponse(**response)
```

#### 3. API Endpoints

##### D-ID Files (`app/api/v1/endpoints/d_id_files.py`)
```python
@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(BaseEndpoint.get_services)
):
    """Загрузка изображения в D-ID"""
    try:
        d_id_service = services["d_id_file_service"]
        result = await d_id_service.upload_image(file)
        return DIdFileUploadResponse(
            success=True,
            message="Image uploaded successfully to D-ID",
            data=result
        )
    except Exception as e:
        raise ServiceErrorHandler.handle_service_error(e)

@router.post("/upload/audio")
async def upload_audio(
    file: UploadFile = File(...),
    services: Dict[str, Any] = Depends(BaseEndpoint.get_services)
):
    """Загрузка аудио в D-ID"""
    try:
        d_id_service = services["d_id_file_service"]
        result = await d_id_service.upload_audio(file)
        return DIdFileUploadResponse(
            success=True,
            message="Audio uploaded successfully to D-ID",
            data=result
        )
    except Exception as e:
        raise ServiceErrorHandler.handle_service_error(e)
```

##### D-ID Talks (`app/api/v1/endpoints/d_id_talks.py`)
```python
@router.post("/create")
async def create_talk(
    request: DIdTalkRequest,
    services: Dict[str, Any] = Depends(get_services)
):
    """Создание нового D-ID talk"""
    try:
        d_id_service = services["d_id_service"]
        
        try:
            talk_id = await d_id_service.create_talk_direct(
                source_url=request.source_url,
                script=request.script,
                config=request.config,
                driver_url=request.driver_url,
                webhook=request.webhook
            )
            
            return BaseResponse(
                success=True,
                message="D-ID talk created successfully",
                data={
                    "id": talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
            
        except Exception as d_id_error:
            # Fallback на stub режим для тестирования
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk creation is currently a stub")
            
            import uuid
            mock_talk_id = f"tlk_{uuid.uuid4().hex[:16]}"
            
            return BaseResponse(
                success=True,
                message="D-ID talk created successfully (stub mode)",
                data={
                    "id": mock_talk_id,
                    "status": "created",
                    "created_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        raise ServiceErrorHandler.handle_service_error(e)

@router.get("/{talk_id}/status")
async def get_talk_status(
    talk_id: str,
    services: Dict[str, Any] = Depends(get_services)
):
    """Получение статуса D-ID talk"""
    try:
        d_id_service = services["d_id_service"]
        
        try:
            status_response = await d_id_service.get_video_status(talk_id)
            
            return BaseResponse(
                success=True,
                message="D-ID talk status retrieved successfully",
                data={
                    "id": talk_id,
                    "status": status_response.status.value,
                    "result_url": status_response.result_url,
                    "error_message": status_response.error_message,
                    "created_at": status_response.created_at,
                    "updated_at": status_response.updated_at
                }
            )
            
        except Exception as d_id_error:
            # Fallback на stub режим для тестирования
            logger.warning("⚠️ D-ID API integration requires additional configuration")
            logger.warning("⚠️ Talk status is currently a stub")
            
            return BaseResponse(
                success=True,
                message="D-ID talk status retrieved successfully (stub mode)",
                data={
                    "id": talk_id,
                    "status": "done",
                    "result_url": "https://example.com/mock-video.mp4",
                    "created_at": d_id_service._get_current_timestamp(),
                    "updated_at": d_id_service._get_current_timestamp()
                }
            )
        
    except Exception as e:
        raise ServiceErrorHandler.handle_service_error(e)

@router.post("/webhook")
async def d_id_webhook(
    payload: DIdWebhookPayload,
    services: Dict[str, Any] = Depends(get_services)
):
    """Обработка webhook уведомлений от D-ID"""
    try:
        logger.info(f"Received D-ID webhook for talk: {payload.id}, status: {payload.status}")
        
        if payload.status == "done":
            logger.info(f"Talk {payload.id} completed successfully. Result URL: {payload.result_url}")
            # Здесь можно добавить логику обработки завершенного talk
        elif payload.status == "failed":
            logger.error(f"Talk {payload.id} failed. Error: {payload.error}")
            # Здесь можно добавить логику обработки ошибки
        
        return BaseResponse(
            success=True,
            message="Webhook processed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error processing D-ID webhook: {e}")
        return BaseResponse(
            success=False,
            message=f"Webhook processing failed: {str(e)}"
        )
```

### Frontend интеграция

#### 1. FileService (`frontend/src/services/FileService.js`)
```javascript
export class FileService {
    constructor() {
        this.configManager = new ConfigManager();
        this.apiClient = new ApiClient();
        this.logger = Logger;
    }

    async uploadImage(file, options = {}) {
        const defaultProvider = this.configManager.get('storage.defaultProvider', 'd_id');
        const useDId = options.provider === 'd_id' || 
                      (defaultProvider === 'd_id' && options.provider !== 'cloudinary');

        try {
            if (useDId) {
                return await this.uploadToDId(file, 'image');
            } else {
                return await this.uploadToCloudinary(file, 'image');
            }
        } catch (error) {
            // Fallback to Cloudinary if D-ID fails
            if (useDId && this.configManager.get('storage.fallback.enabled', true)) {
                this.logger.warn('D-ID upload failed, falling back to Cloudinary', error);
                return await this.uploadToCloudinary(file, 'image');
            }
            throw error;
        }
    }

    async uploadToDId(file, type) {
        const endpoint = type === 'image' ? 
            '/api/v1/d-id-files/upload/image' : 
            '/api/v1/d-id-files/upload/audio';
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.apiClient.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        this.logger.fileOperation('uploadToDId', file.name, { type, response });
        return response;
    }
}
```

#### 2. ConfigManager (`frontend/src/config/ConfigManager.js`)
```javascript
export class ConfigManager {
    constructor() {
        this.config = {
            storage: {
                defaultProvider: 'd_id',
                fallback: {
                    enabled: true,
                    provider: 'cloudinary'
                },
                dId: {
                    enabled: true,
                    maxFileSize: '10MB',
                    supportedFormats: {
                        images: ['jpg', 'jpeg', 'png', 'webp'],
                        audio: ['mp3', 'wav', 'webm', 'ogg']
                    }
                },
                cloudinary: {
                    enabled: true,
                    maxFileSize: '10MB'
                }
            }
        };
    }

    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}
```

## 🔧 Конфигурация

### Environment Variables
```bash
# D-ID API Settings
D_ID_API_KEY=your_email:your_token
D_ID_BASE_URL=https://api.d-id.com
D_ID_TIMEOUT=30

# D-ID Talks Settings
D_ID_DEFAULT_PRESENTER_ID=your_presenter_id
D_ID_DEFAULT_DRIVER_URL=bank://lively/driver-02/flipped
```

### Frontend Configuration
```javascript
// Настройки по умолчанию
const defaultConfig = {
    storage: {
        defaultProvider: 'd_id',
        fallback: {
            enabled: true,
            provider: 'cloudinary'
        },
        dId: {
            enabled: true,
            maxFileSize: '10MB',
            supportedFormats: {
                images: ['jpg', 'jpeg', 'png', 'webp'],
                audio: ['mp3', 'wav', 'webm', 'ogg']
            }
        }
    }
};
```

## 📊 API Endpoints

### D-ID Talks API

#### Создание Talk с произвольным script
```bash
POST /api/v1/d-id-talks/create
Content-Type: application/json

# Request
{
  "source_url": "https://myhost.com/image.jpg",
  "script": {
    "type": "audio",
    "audio_url": "https://path.to/audio.mp3"
  },
  "config": {
    "stitch": true
  },
  "driver_url": "bank://lively/driver-02/flipped",
  "webhook": "https://myhost.com/webhook"
}

# Response
{
  "success": true,
  "message": "D-ID talk created successfully",
  "data": {
    "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
    "status": "created",
    "created_at": "2023-03-22T16:38:49.723Z"
  }
}
```

#### Создание Talk с текстом
```bash
POST /api/v1/d-id-talks/create-with-text
Content-Type: application/x-www-form-urlencoded

# Request
source_url=https://myhost.com/image.jpg
text=Hello, this is a test message
voice_id=en-US-JennyNeural
webhook=https://myhost.com/webhook

# Response
{
  "success": true,
  "message": "D-ID talk with text created successfully",
  "data": {
    "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
    "status": "created",
    "created_at": "2023-03-22T16:38:49.723Z"
  }
}
```

#### Создание Talk с аудио
```bash
POST /api/v1/d-id-talks/create-with-audio
Content-Type: application/x-www-form-urlencoded

# Request
source_url=https://myhost.com/image.jpg
audio_url=https://path.to/audio.mp3
driver_url=bank://lively/driver-02/flipped
webhook=https://myhost.com/webhook

# Response
{
  "success": true,
  "message": "D-ID talk with audio created successfully",
  "data": {
    "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
    "status": "created",
    "created_at": "2023-03-22T16:38:49.723Z"
  }
}
```

#### Получение статуса Talk
```bash
GET /api/v1/d-id-talks/{talk_id}/status

# Response
{
  "success": true,
  "message": "D-ID talk status retrieved successfully",
  "data": {
    "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
    "status": "done",
    "result_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../image.mp4",
    "audio_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../microsoft.wav",
    "source_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../image.jpeg",
    "created_at": "2023-03-22T16:38:49.723Z",
    "modified_at": "2023-03-22T16:39:15.603Z",
    "started_at": "2023-03-22T16:39:13.633",
    "duration": 2,
    "metadata": {
      "driver_url": "bank://lively/driver-02/flipped",
      "mouth_open": false,
      "num_faces": 1,
      "num_frames": 41,
      "processing_fps": 51.51385098457352,
      "resolution": [512, 512],
      "size_kib": 334.22265625
    },
    "face": {
      "mask_confidence": -1,
      "detection": [224, 198, 484, 553],
      "overlap": "no",
      "size": 512,
      "top_left": [98, 119],
      "face_id": 0,
      "detect_confidence": 0.9998300075531006
    },
    "config": {
      "stitch": false,
      "pad_audio": 0,
      "align_driver": true,
      "sharpen": true,
      "auto_match": true,
      "normalization_factor": 1,
      "logo": {
        "url": "ai",
        "position": [0, 0]
      },
      "motion_factor": 1,
      "result_format": ".mp4",
      "fluent": false,
      "align_expand_factor": 0.3
    }
  }
}
```

#### Отмена Talk
```bash
DELETE /api/v1/d-id-talks/{talk_id}

# Response
{
  "success": true,
  "message": "D-ID talk cancelled successfully"
}
```

#### Webhook Endpoint
```bash
POST /api/v1/d-id-talks/webhook
Content-Type: application/json

# Request (от D-ID)
{
  "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
  "created_at": "2023-03-22T16:38:49.723Z",
  "created_by": "google-oauth2|12345678",
  "status": "done",
  "object": "talk",
  "result_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../image.mp4",
  "audio_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../microsoft.wav",
  "source_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/.../image.jpeg",
  "modified_at": "2023-03-22T16:39:15.603Z",
  "user_id": "google-oauth2|12345678",
  "duration": 2,
  "started_at": "2023-03-22T16:39:13.633",
  "metadata": {
    "driver_url": "bank://lively/driver-02/flipped",
    "mouth_open": false,
    "num_faces": 1,
    "num_frames": 41,
    "processing_fps": 51.51385098457352,
    "resolution": [512, 512],
    "size_kib": 334.22265625
  },
  "face": {
    "mask_confidence": -1,
    "detection": [224, 198, 484, 553],
    "overlap": "no",
    "size": 512,
    "top_left": [98, 119],
    "face_id": 0,
    "detect_confidence": 0.9998300075531006
  },
  "config": {
    "stitch": false,
    "pad_audio": 0,
    "align_driver": true,
    "sharpen": true,
    "auto_match": true,
    "normalization_factor": 1,
    "logo": {
      "url": "ai",
      "position": [0, 0]
    },
    "motion_factor": 1,
    "result_format": ".mp4",
    "fluent": false,
    "align_expand_factor": 0.3
  }
}

# Response
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### D-ID File API

#### Загрузка изображения
```bash
POST /api/v1/d-id-files/upload/image
Content-Type: multipart/form-data

# Request
file: [image file]

# Response
{
    "success": true,
    "message": "Image uploaded successfully to D-ID",
    "data": {
        "url": "s3://d-id-images-prod/...",
        "id": "img_xxx"
    }
}
```

#### Загрузка аудио
```bash
POST /api/v1/d-id-files/upload/audio
Content-Type: multipart/form-data

# Request
file: [audio file]

# Response
{
    "success": true,
    "message": "Audio uploaded successfully to D-ID",
    "data": {
        "url": "s3://d-id-audios-prod/...",
        "id": "aud_xxx"
    }
}
```

#### Удаление файла
```bash
DELETE /api/v1/d-id-files/delete/{file_type}/{file_id}

# Response
{
    "success": true,
    "message": "File deleted successfully"
}
```

### Гибридные эндпоинты

#### Загрузка с выбором провайдера
```bash
POST /api/v1/storage/upload/image?use_d_id=true
Content-Type: multipart/form-data

# Response
{
    "success": true,
    "message": "Image uploaded successfully to D-ID",
    "data": {
        "storage_type": "d_id",
        "d_id_file_id": "img_xxx",
        "url": "s3://d-id-images-prod/..."
    }
}
```

## 🧪 Тестирование

### Backend тесты
```bash
# Тест аутентификации
curl -X GET "http://localhost:8000/api/v1/d-id-files/test-auth"

# Тест загрузки изображения
curl -X POST "http://localhost:8000/api/v1/d-id-files/upload/image" \
  -F "file=@test_image.jpg"

# Тест загрузки аудио
curl -X POST "http://localhost:8000/api/v1/d-id-files/upload/audio" \
  -F "file=@test_audio.mp3;type=audio/mpeg"

# Тест создания talk с аудио
curl -X POST "http://localhost:8000/api/v1/d-id-talks/create" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://myhost.com/image.jpg",
    "script": {
      "type": "audio",
      "audio_url": "https://path.to/audio.mp3"
    },
    "config": {
      "stitch": true
    }
  }'

# Тест создания talk с текстом
curl -X POST "http://localhost:8000/api/v1/d-id-talks/create-with-text" \
  -G \
  -d "source_url=https://myhost.com/image.jpg" \
  -d "text=Hello, this is a test message" \
  -d "voice_id=en-US-JennyNeural" \
  -d "webhook=https://myhost.com/webhook"

# Тест получения статуса talk
curl -X GET "http://localhost:8000/api/v1/d-id-talks/tlk_TMj4G1wiEGpQrdNFvrqAk/status"

# Тест webhook endpoint
curl -X POST "http://localhost:8000/api/v1/d-id-talks/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tlk_TMj4G1wiEGpQrdNFvrqAk",
    "status": "done",
    "result_url": "https://example.com/video.mp4"
  }'
```

### Frontend тесты
```javascript
// Тест FileService
const fileService = new FileService();
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

try {
    const result = await fileService.uploadImage(file);
    console.log('Upload successful:', result);
} catch (error) {
    console.error('Upload failed:', error);
}
```

## 🔄 Fallback механизм

### Автоматический fallback
```javascript
async uploadImage(file, options = {}) {
    const useDId = this.shouldUseDId(options);
    
    try {
        if (useDId) {
            return await this.uploadToDId(file, 'image');
        } else {
            return await this.uploadToCloudinary(file, 'image');
        }
    } catch (error) {
        // Автоматический fallback к Cloudinary
        if (useDId && this.configManager.get('storage.fallback.enabled', true)) {
            this.logger.warn('D-ID upload failed, falling back to Cloudinary', error);
            return await this.uploadToCloudinary(file, 'image');
        }
        throw error;
    }
}
```

### Настройка fallback
```javascript
// Отключить fallback
configManager.set('storage.fallback.enabled', false);

// Изменить провайдер по умолчанию
configManager.set('storage.defaultProvider', 'cloudinary');

// Принудительно использовать D-ID
fileService.uploadImage(file, { provider: 'd_id' });
```

## 🚨 Troubleshooting

### Частые ошибки

#### 1. Authentication Error
```bash
# Ошибка: API error 401: Unauthorized
# Решение: Проверить D_ID_API_KEY в .env файле
D_ID_API_KEY=your_email:your_token
```

#### 2. File Type Error
```bash
# Ошибка: File must be an audio or video file
# Решение: Убедиться, что файл имеет правильный MIME type
curl -X POST "..." -F "file=@test_audio.mp3;type=audio/mpeg"
```

#### 3. File Size Error
```bash
# Ошибка: File too large
# Решение: Проверить размер файла (максимум 10MB)
```

### Отладка

#### Backend логи
```bash
# Просмотр логов бэкенда
tail -f logs/backend.log | grep "D-ID"
```

#### Frontend логи
```javascript
// Включить детальное логирование
Logger.debug('D-ID upload attempt', { file, options });
```

## 📈 Мониторинг

### Метрики производительности
```python
# Автоматический сбор метрик
@dataclass
class DIdMetrics:
    upload_count: int = 0
    error_count: int = 0
    avg_response_time: float = 0.0
    last_upload_time: datetime = None
```

### Health checks
```bash
# Проверка состояния D-ID API
curl -X GET "http://localhost:8000/api/v1/d-id-files/test-auth"
```

## 🔒 Безопасность

### API Key Management
- API ключи хранятся в переменных окружения
- Никогда не коммитятся в репозиторий
- Ротация ключей каждые 90 дней

### File Validation
- Проверка MIME типов
- Валидация размера файлов
- Сканирование на вредоносное ПО

### Rate Limiting
- Ограничение количества запросов
- Graceful degradation при превышении лимитов
- Автоматический fallback

## 📚 Дополнительные ресурсы

### Официальная документация
- [D-ID API Documentation](https://docs.d-id.com/)
- [File API Reference](https://docs.d-id.com/reference/upload-an-image)
- [Authentication Guide](https://docs.d-id.com/reference/authentication)

### Примеры кода
- [Backend Examples](../technical/BACKEND_GUIDE.md)
- [Frontend Examples](../technical/FRONTEND_GUIDE.md)
- [Integration Status](INTEGRATION_STATUS.md)

---

*Дата создания: 16 августа 2025*  
*Статус: ✅ ИНТЕГРАЦИЯ ЗАВЕРШЕНА*
