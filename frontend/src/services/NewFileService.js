import { apiService } from './api.js';
import configManager from '../config/ConfigManager.js';

/**
 * Новый сервис для работы с файлами
 * Использует новую систему файлового хранилища на Render и D-ID локально
 */
class NewFileService {
  constructor() {
    this.configManager = configManager;
    this.isProduction = configManager.isProduction;
    this.isDevelopment = configManager.isDevelopment;
  }

  /**
   * Определяет, какой провайдер использовать
   * Для стриминга ВСЕГДА используем D-ID, независимо от окружения
   */
  getStorageProvider() {
    // Для стриминга ВСЕГДА используем D-ID
    return 'd_id';
  }

  /**
   * Проверяет, является ли ошибка ошибкой модерации D-ID
   */
  isModerationError(error) {
    const errorMessage = error.message || '';
    return errorMessage.includes('ImageModerationError') || 
           errorMessage.includes('AudioModerationError') || 
           errorMessage.includes('451') ||
           errorMessage.includes('content moderation');
  }

  /**
   * Проверяет, является ли ошибка ошибкой недопустимого имени файла D-ID
   */
  isInvalidFilenameError(error) {
    const errorMessage = error.message || '';
    const isInvalid = errorMessage.includes('Filename contains invalid characters') ||
                     errorMessage.includes('invalid characters') ||
                     errorMessage.includes('Only a-z, A-Z, 0-9, ., _, - are allowed');
    
    console.log('🔍 Checking if error is invalid filename error:', {
      errorMessage,
      isInvalid,
      containsFilename: errorMessage.includes('Filename contains invalid characters'),
      containsInvalid: errorMessage.includes('invalid characters'),
      containsOnlyAllowed: errorMessage.includes('Only a-z, A-Z, 0-9, ., _, - are allowed')
    });
    
    return isInvalid;
  }

  /**
   * Создает безопасное имя файла для D-ID
   */
  createSafeFilename(originalFilename) {
    console.log('🔄 Creating safe filename for:', originalFilename);
    
    // Убираем расширение
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    const extension = originalFilename.match(/\.[^/.]+$/)?.[0] || '';
    
    // Заменяем недопустимые символы на подчеркивания
    let safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_') // Заменяем множественные подчеркивания на одно
      .replace(/^_|_$/g, ''); // Убираем подчеркивания в начале и конце
    
    // Добавляем timestamp для уникальности
    const timestamp = Date.now();
    let finalName = `${safeName}_${timestamp}${extension}`;
    
    // D-ID требует, чтобы имя файла было не более 50 символов
    if (finalName.length > 50) {
      console.log(`⚠️ Filename too long (${finalName.length} chars), truncating to 50 chars`);
      
      // Оставляем место для расширения и timestamp
      const maxNameLength = 50 - extension.length - timestamp.toString().length - 1; // -1 для подчеркивания
      
      // Обрезаем имя файла
      safeName = safeName.substring(0, maxNameLength);
      finalName = `${safeName}_${timestamp}${extension}`;
      
      console.log(`🔧 Truncated filename: ${finalName} (${finalName.length} chars)`);
    }
    
    console.log('✅ Safe filename created:', {
      original: originalFilename,
      nameWithoutExt,
      extension,
      safeName,
      timestamp,
      finalName,
      length: finalName.length
    });
    
    return finalName;
  }

  /**
   * Загружает изображение
   */
  async uploadImage(file, options = {}) {
    const uploadId = Math.random().toString(36).substr(2, 9);
    console.log(`🚀 [${uploadId}] Starting image upload for:`, file.name);
    
    try {
      // Валидация файла
      const validation = this.validateFile(file, 'image');
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // ВСЕГДА используем D-ID для изображений
      console.log(`📤 [${uploadId}] Using D-ID for image upload`);
      return await this.uploadImageToDId(file);
      
    } catch (error) {
      console.error(`❌ [${uploadId}] Image upload failed:`, error);
      throw error;
    }
  }

  /**
   * Загружает аудио файл
   */
  async uploadAudio(file, options = {}) {
    const provider = options.provider || this.getStorageProvider();
    
    try {
      // Валидация файла
      const validation = this.validateFile(file, 'audio');
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      if (provider === 'd_id') {
        // Локальная разработка - используем D-ID
        try {
          return await this.uploadAudioToDId(file);
        } catch (error) {
          // Если D-ID отклонил аудио из-за модерации, используем fallback
          if (this.isModerationError(error)) {
            console.log('⚠️ D-ID отклонил аудио из-за модерации, используем fallback на файловое хранилище');
            return await this.uploadAudioToFileStorage(file);
          }
          

          
          throw error;
        }
      } else {
        // Продакшн - используем новую систему файлового хранилища
        return await this.uploadAudioToFileStorage(file);
      }
    } catch (error) {
      console.error('Audio upload failed:', error);
      throw error;
    }
  }

  /**
   * Загружает изображение в D-ID (локальная разработка)
   */
  async uploadImageToDId(file) {
    console.log('📤 Uploading image to D-ID (local development)');
    
    // ПРИНУДИТЕЛЬНО исправляем имя файла ДО отправки
    const safeFilename = this.createSafeFilename(file.name);
    const safeFile = new File([file], safeFilename, { type: file.type });
    
    console.log(`🔧 Original filename: ${file.name} -> Safe filename: ${safeFilename}`);
    
    const result = await apiService.uploadImageToDId(safeFile);
    
    // Проверяем, является ли результат объектом ошибки
    if (result && result.error) {
      console.log('🔧 D-ID error detected (will be handled):', result.message);
      throw new Error(result.message);
    }
    
    return {
      success: true,
      data: {
        url: result.data?.url,
        public_id: result.data?.file_id,
        secure_url: result.data?.url,
        file_id: result.data?.file_id
      },
      provider: 'd_id',
      fileId: result.data?.file_id
    };
  }

  /**
   * Загружает аудио в D-ID (локальная разработка)
   */
  async uploadAudioToDId(file) {
    console.log('📤 Uploading audio to D-ID (local development)');
    
    // ПРИНУДИТЕЛЬНО исправляем имя файла ДО отправки
    const safeFilename = this.createSafeFilename(file.name);
    const safeFile = new File([file], safeFilename, { type: file.type });
    
    console.log(`🔧 Original filename: ${file.name} -> Safe filename: ${safeFilename}`);
    
    const result = await apiService.uploadAudioToDId(safeFile);
    
    // Проверяем, является ли результат объектом ошибки
    if (result && result.error) {
      console.log('🔧 D-ID error detected (will be handled):', result.message);
      throw new Error(result.message);
    }
    
    return {
      success: true,
      data: {
        url: result.data?.url,
        public_id: result.data?.file_id,
        secure_url: result.data?.url,
        file_id: result.data?.file_id
      },
      provider: 'd_id',
      fileId: result.data?.file_id
    };
  }

  /**
   * Загружает изображение в новую систему файлового хранилища (продакшн)
   */
  async uploadImageToFileStorage(file) {
    console.log('📤 Uploading image to file storage (production)');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.configManager.backendUrl}/api/v1/files/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      data: {
        url: result.data?.url,
        public_id: result.data?.filename,
        secure_url: result.data?.url,
        file_id: result.data?.filename
      },
      provider: 'file_storage',
      fileId: result.data?.filename
    };
  }

  /**
   * Загружает аудио в новую систему файлового хранилища (продакшн)
   */
  async uploadAudioToFileStorage(file) {
    console.log('📤 Uploading audio to file storage (production)');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.configManager.backendUrl}/api/v1/files/upload/audio`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      data: {
        url: result.data?.url,
        public_id: result.data?.filename,
        secure_url: result.data?.url,
        file_id: result.data?.filename
      },
      provider: 'file_storage',
      fileId: result.data?.filename
    };
  }

  /**
   * Получает информацию о текущем аватаре
   */
  async getCurrentAvatar() {
    try {
      const response = await fetch(`${this.configManager.backendUrl}/api/v1/files/avatar`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Аватар не найден
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        data: {
          url: result.data?.url,
          filename: result.data?.filename,
          size: result.data?.size,
          content_type: result.data?.content_type
        }
      };
    } catch (error) {
      console.error('Failed to get current avatar:', error);
      return null;
    }
  }

  /**
   * Удаляет файл
   */
  async deleteFile(fileId, provider = null) {
    const storageProvider = provider || this.getStorageProvider();
    
    try {
      if (storageProvider === 'd_id') {
        // Пытаемся удалить как изображение, затем как аудио
        try {
          await apiService.deleteImageFromDId(fileId);
          return { success: true, provider: 'd_id' };
        } catch (error) {
          try {
            await apiService.deleteAudioFromDId(fileId);
            return { success: true, provider: 'd_id' };
          } catch (audioError) {
            throw error; // Возвращаем первую ошибку
          }
        }
      } else {
        // Удаляем из новой системы файлового хранилища
        const response = await fetch(`${this.configManager.backendUrl}/api/v1/files/files/${fileId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { success: result.success, provider: 'file_storage' };
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Валидирует файл
   */
  validateFile(file, type = 'auto') {
    const errors = [];

    // Определяем тип файла
    if (type === 'auto') {
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else {
        errors.push('Unsupported file type');
        return { valid: false, errors };
      }
    }

    // Проверяем размер файла
    const maxSize = this.configManager.get('storage.maxFileSize', 10 * 1024 * 1024);
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Проверяем тип файла
    if (type === 'image') {
      const allowedTypes = this.configManager.get('storage.allowedImageTypes', ['image/jpeg', 'image/png', 'image/webp']);
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Unsupported image type: ${file.type}. Supported: ${allowedTypes.join(', ')}`);
      }
    } else if (type === 'audio') {
      const allowedTypes = this.configManager.get('storage.allowedAudioTypes', ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']);
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Unsupported audio type: ${file.type}. Supported: ${allowedTypes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      type,
      size: file.size,
      maxSize
    };
  }

  /**
   * Получает информацию о провайдерах
   */
  getProvidersInfo() {
    return {
      d_id: {
        enabled: this.isDevelopment,
        maxFileSize: this.configManager.get('storage.maxFileSize', 10 * 1024 * 1024),
        supportedImageTypes: this.configManager.get('storage.allowedImageTypes', ['image/jpeg', 'image/png', 'image/webp']),
        supportedAudioTypes: this.configManager.get('storage.allowedAudioTypes', ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'])
      },
      file_storage: {
        enabled: this.isProduction,
        maxFileSize: this.configManager.get('storage.maxFileSize', 10 * 1024 * 1024),
        supportedImageTypes: this.configManager.get('storage.allowedImageTypes', ['image/jpeg', 'image/png', 'image/webp']),
        supportedAudioTypes: this.configManager.get('storage.allowedAudioTypes', ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'])
      },
      default: this.getStorageProvider()
    };
  }

  /**
   * Тестирует подключение к сервисам
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.configManager.backendUrl}/api/v1/health`);
      const result = await response.json();
      
      return {
        success: true,
        backend: result.status === 'healthy',
        provider: this.getStorageProvider(),
        environment: this.isProduction ? 'production' : 'development'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.getStorageProvider(),
        environment: this.isProduction ? 'production' : 'development'
      };
    }
  }
}

export const newFileService = new NewFileService();
