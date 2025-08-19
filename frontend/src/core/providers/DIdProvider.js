/**
 * Провайдер для D-ID
 */

import { BaseStorageProvider } from './BaseStorageProvider.js';
import { FileMetadata, UploadOptions } from '../types/storage.js';
import { apiService } from '../../services/api.js';

export class DIdProvider extends BaseStorageProvider {
  constructor(config = {}) {
    super('d_id', {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.d-id.com',
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024,
      allowedImageTypes: config.allowedImageTypes || ['image/jpeg', 'image/png'],
      allowedAudioTypes: config.allowedAudioTypes || ['audio/', 'video/'],
      maxFilenameLength: config.maxFilenameLength || 50,
      fallback: config.fallback !== false,
      ...config
    });
  }

  /**
   * Валидация конфигурации
   */
  validateConfig() {
    const requiredFields = ['apiKey'];
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      this.logger.warn(`Missing required D-ID configuration: ${missingFields.join(', ')}`);
      this.logger.warn('D-ID provider will be disabled');
      return false;
    }
    
    return true;
  }

  /**
   * Специфичная инициализация D-ID
   */
  async _initializeProvider() {
    try {
      // Проверяем аутентификацию с D-ID API
      const response = await apiService.testDIdAuthentication();
      if (!response.success) {
        throw new Error('D-ID authentication failed');
      }
      
      this.logger.log('D-ID provider initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize D-ID: ${error.message}`);
    }
  }

  /**
   * Специфичная проверка доступности D-ID
   */
  async _checkAvailability() {
    try {
      const response = await apiService.testDIdAuthentication();
      return response.success;
    } catch (error) {
      this.logger.warn('D-ID availability check failed:', error);
      return false;
    }
  }

  /**
   * Специфичная загрузка файла в D-ID
   */
  async _uploadFile(file, options = new UploadOptions()) {
    try {
      // Определяем тип файла
      const fileType = this._getFileType(file);
      
      // Выбираем правильный API метод
      let response;
      if (fileType === 'image') {
        response = await apiService.uploadImageToDId(file);
      } else if (fileType === 'audio') {
        response = await apiService.uploadAudioToDId(file);
      } else {
        throw new Error(`Unsupported file type for D-ID: ${fileType}`);
      }

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      // Создаем метаданные файла
      const metadata = new FileMetadata({
        id: response.data?.file_id || response.data?.id,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        url: response.data?.url,
        secureUrl: response.data?.url, // D-ID возвращает S3 URL
        provider: 'd_id',
        createdAt: response.data?.created_at || new Date().toISOString(),
        expiresAt: response.data?.expires_at,
        metadata: {
          baseUrl: this.config.baseUrl,
          fileType: fileType,
          s3Url: response.data?.url
        }
      });

      return metadata;
      
    } catch (error) {
      this.logger.error('D-ID upload failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное удаление файла из D-ID
   */
  async _deleteFile(fileId) {
    try {
      // Пытаемся удалить как изображение, затем как аудио
      try {
        const response = await apiService.deleteImageFromDId(fileId);
        return response.success;
      } catch (imageError) {
        try {
          const response = await apiService.deleteAudioFromDId(fileId);
          return response.success;
        } catch (audioError) {
          throw imageError; // Возвращаем первую ошибку
        }
      }
    } catch (error) {
      this.logger.error('D-ID delete failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное получение метаданных из D-ID
   */
  async _getFileMetadata(fileId) {
    try {
      // D-ID не предоставляет API для получения метаданных
      // Возвращаем базовую информацию
      return new FileMetadata({
        id: fileId,
        provider: 'd_id',
        url: this._buildDidUrl(fileId)
      });
    } catch (error) {
      this.logger.error('D-ID get metadata failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное получение URL из D-ID
   */
  async _getFileUrl(fileId) {
    return this._buildDidUrl(fileId);
  }

  /**
   * Специфичная валидация файла для D-ID
   */
  _validateFile(file, options = new UploadOptions()) {
    const errors = [];
    
    // Проверяем размер файла
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds D-ID limit: ${(this.config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Проверяем тип файла
    const fileType = this._getFileType(file);
    if (fileType === 'image') {
      if (!this.config.allowedImageTypes.some(type => file.type === type)) {
        errors.push(`Image type ${file.type} is not allowed. Allowed types: ${this.config.allowedImageTypes.join(', ')}`);
      }
    } else if (fileType === 'audio') {
      if (!this.config.allowedAudioTypes.some(type => file.type.startsWith(type))) {
        errors.push(`Audio type ${file.type} is not allowed. Allowed types: ${this.config.allowedAudioTypes.join(', ')}`);
      }
    } else {
      errors.push(`File type ${fileType} is not supported by D-ID`);
    }

    // Проверяем имя файла
    if (file.name.length > this.config.maxFilenameLength) {
      errors.push(`Filename is too long. Maximum length: ${this.config.maxFilenameLength} characters`);
    }

    // Проверяем допустимые символы в имени файла
    const allowedChars = /^[a-zA-Z0-9._-]+$/;
    if (!allowedChars.test(file.name)) {
      errors.push('Filename contains invalid characters. Only a-z, A-Z, 0-9, ., _, - are allowed');
    }

    // Специфичные проверки для изображений
    if (fileType === 'image') {
      // Проверяем минимальное разрешение (D-ID требует минимум 160x160)
      this._validateImageResolution(file).then(validation => {
        if (!validation.valid) {
          errors.push(...validation.errors);
        }
      }).catch(() => {
        // Если не удалось проверить разрешение, пропускаем
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация разрешения изображения
   */
  async _validateImageResolution(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const minResolution = 160 * 160; // 25,600 пикселей
        const resolution = img.width * img.height;
        
        if (resolution < minResolution) {
          resolve({
            valid: false,
            errors: [`Image resolution is too low. Minimum required: 160x160 pixels (${minResolution} total pixels), got: ${img.width}x${img.height} (${resolution} total pixels)`]
          });
        } else {
          resolve({ valid: true, errors: [] });
        }
      };
      img.onerror = () => {
        resolve({ valid: true, errors: [] }); // Если не удалось загрузить, пропускаем проверку
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Получение возможностей D-ID
   */
  _getCapabilities() {
    return {
      upload: true,
      delete: true,
      getMetadata: false, // D-ID не предоставляет API для получения метаданных
      getUrl: true,
      supportsImage: true,
      supportsAudio: true,
      supportsVideo: false,
      maxFileSize: this.config.maxFileSize,
      allowedTypes: [...this.config.allowedImageTypes, ...this.config.allowedAudioTypes],
      features: [
        'temporary_storage',
        's3_integration',
        'file_expiration',
        'direct_api_access'
      ],
      limitations: [
        'temporary_files_only',
        'no_metadata_api',
        'file_size_limits',
        'format_restrictions'
      ]
    };
  }

  /**
   * Построение URL для D-ID
   */
  _buildDidUrl(fileId) {
    if (!fileId) {
      return null;
    }

    // Если fileId уже содержит полный URL, возвращаем его
    if (fileId.startsWith('http')) {
      return fileId;
    }

    // D-ID использует S3 URLs, которые возвращаются при загрузке
    // Если у нас есть только ID, мы не можем построить URL
    return null;
  }

  /**
   * Проверка, является ли файл временным
   */
  isTemporaryFile(fileId) {
    // D-ID файлы являются временными и имеют срок действия
    return true;
  }

  /**
   * Получение времени истечения файла
   */
  getFileExpiration(fileId) {
    // D-ID файлы обычно истекают через определенное время
    // Точное время можно получить из метаданных при загрузке
    return null;
  }
}
