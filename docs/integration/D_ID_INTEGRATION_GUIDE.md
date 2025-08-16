# 🔗 Полное руководство по интеграции D-ID

## 📋 Обзор

D-ID (Digital Identity) - это платформа для создания говорящих аватаров с использованием искусственного интеллекта. Данное руководство описывает полную интеграцию D-ID API в проект Talking Head.

## 🚀 Возможности D-ID

### Основные функции
- **Генерация говорящих аватаров** - создание видео с говорящими персонажами
- **File API** - загрузка и управление изображениями и аудио
- **Стриминг** - генерация видео в реальном времени
- **WebRTC** - интерактивные сессии

### Поддерживаемые форматы
- **Изображения:** JPEG, PNG, WebP
- **Аудио:** MP3, WAV, WebM, OGG
- **Видео:** MP4, WebM

## 🏗️ Архитектура интеграции

### Backend интеграция

#### 1. D-ID Service (`app/services/d_id_service.py`)
```python
class DIdService(AuthenticatedService):
    """Сервис для работы с D-ID API"""
    
    def __init__(self, config_provider: ConfigurationProvider):
        super().__init__(config_provider)
        self.base_url = "https://api.d-id.com"
        self.headers = self._get_auth_headers()
    
    async def _test_authentication_impl(self) -> Dict[str, Any]:
        """Тестирование аутентификации D-ID"""
        response = await self.http_client.get(f"{self.base_url}/talks")
        return {
            "authenticated": True,
            "talks_count": len(response.get("talks", []))
        }
    
    async def create_talk(self, image_url: str, audio_url: str) -> TalkResponse:
        """Создание говорящего аватара"""
        payload = {
            "source_url": image_url,
            "script": {
                "type": "audio",
                "audio_url": audio_url
            }
        }
        
        response = await self.http_client.post(
            f"{self.base_url}/talks",
            json=payload
        )
        
        return TalkResponse(**response)
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

#### 3. API Endpoints (`app/api/v1/endpoints/d_id_files.py`)
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
