/**
 * Провайдер для Cloudinary
 */

import { BaseStorageProvider } from './BaseStorageProvider.js';
import { FileMetadata, UploadOptions } from '../types/storage.js';
import { apiService } from '../../services/api.js';

export class CloudinaryProvider extends BaseStorageProvider {
  constructor(config = {}) {
    super('cloudinary', {
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      uploadPreset: config.uploadPreset,
      folder: config.folder || 'd_id_talking',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024,
      allowedFormats: config.allowedFormats || ['jpg', 'png', 'webp', 'mp3', 'wav', 'mp4'],
      transformation: config.transformation || {},
      fallback: config.fallback !== false,
      ...config
    });
  }

  /**
   * Валидация конфигурации
   */
  validateConfig() {
    const requiredFields = ['cloudName', 'apiKey', 'uploadPreset'];
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      this.logger.warn(`Missing required Cloudinary configuration: ${missingFields.join(', ')}`);
      this.logger.warn('Cloudinary provider will be disabled');
      return false;
    }
    
    return true;
  }

  /**
   * Специфичная инициализация Cloudinary
   */
  async _initializeProvider() {
    // Проверяем доступность API
    try {
      // Можно добавить проверку через Cloudinary API
      this.logger.log('Cloudinary provider initialized');
    } catch (error) {
      throw new Error(`Failed to initialize Cloudinary: ${error.message}`);
    }
  }

  /**
   * Специфичная проверка доступности Cloudinary
   */
  async _checkAvailability() {
    try {
      // Проверяем через наш API
      const response = await apiService.testCloudinaryAuth();
      return response.success;
    } catch (error) {
      this.logger.warn('Cloudinary availability check failed:', error);
      return false;
    }
  }

  /**
   * Специфичная загрузка файла в Cloudinary
   */
  async _uploadFile(file, options = new UploadOptions()) {
    try {
      // Определяем тип файла
      const fileType = this._getFileType(file);
      
      // Выбираем правильный API метод
      let response;
      if (fileType === 'image') {
        response = await apiService.uploadImage(file);
      } else if (fileType === 'audio') {
        response = await apiService.uploadAudio(file);
      } else {
        throw new Error(`Unsupported file type for Cloudinary: ${fileType}`);
      }

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      // Создаем метаданные файла
      const metadata = new FileMetadata({
        id: response.data?.public_id || response.data?.file_id,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        url: response.data?.url,
        secureUrl: response.data?.secure_url,
        provider: 'cloudinary',
        createdAt: new Date().toISOString(),
        metadata: {
          cloudName: this.config.cloudName,
          folder: this.config.folder,
          format: response.data?.format,
          bytes: response.data?.bytes,
          width: response.data?.width,
          height: response.data?.height,
          duration: response.data?.duration
        }
      });

      return metadata;
      
    } catch (error) {
      this.logger.error('Cloudinary upload failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное удаление файла из Cloudinary
   */
  async _deleteFile(fileId) {
    try {
      const response = await apiService.deleteFileHybrid(fileId, 'cloudinary');
      return response.success;
    } catch (error) {
      this.logger.error('Cloudinary delete failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное получение метаданных из Cloudinary
   */
  async _getFileMetadata(fileId) {
    try {
      // Cloudinary не предоставляет прямой API для получения метаданных
      // Возвращаем базовую информацию
      return new FileMetadata({
        id: fileId,
        provider: 'cloudinary',
        url: this._buildCloudinaryUrl(fileId)
      });
    } catch (error) {
      this.logger.error('Cloudinary get metadata failed:', error);
      throw error;
    }
  }

  /**
   * Специфичное получение URL из Cloudinary
   */
  async _getFileUrl(fileId) {
    return this._buildCloudinaryUrl(fileId);
  }

  /**
   * Специфичная валидация файла для Cloudinary
   */
  _validateFile(file, options = new UploadOptions()) {
    const errors = [];
    
    // Проверяем формат файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (this.config.allowedFormats && !this.config.allowedFormats.includes(fileExtension)) {
      errors.push(`File format ${fileExtension} is not allowed. Allowed formats: ${this.config.allowedFormats.join(', ')}`);
    }

    // Проверяем размер файла
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds Cloudinary limit: ${(this.config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Получение возможностей Cloudinary
   */
  _getCapabilities() {
    return {
      upload: true,
      delete: true,
      getMetadata: false, // Cloudinary не предоставляет API для получения метаданных
      getUrl: true,
      supportsImage: true,
      supportsAudio: true,
      supportsVideo: true,
      maxFileSize: this.config.maxFileSize,
      allowedTypes: this.config.allowedFormats,
      features: [
        'image_transformation',
        'video_transformation',
        'audio_transformation',
        'cdn_delivery',
        'secure_urls'
      ]
    };
  }

  /**
   * Построение URL для Cloudinary
   */
  _buildCloudinaryUrl(fileId) {
    if (!fileId || !this.config.cloudName) {
      return null;
    }

    // Если fileId уже содержит полный URL, возвращаем его
    if (fileId.startsWith('http')) {
      return fileId;
    }

    // Строим URL для Cloudinary
    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}`;
    
    // Определяем тип ресурса по расширению
    const extension = fileId.split('.').pop()?.toLowerCase();
    let resourceType = 'image';
    
    if (['mp3', 'wav', 'ogg', 'webm'].includes(extension)) {
      resourceType = 'video'; // Cloudinary использует 'video' для аудио файлов
    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
      resourceType = 'video';
    }

    return `${baseUrl}/${resourceType}/upload/${fileId}`;
  }

  /**
   * Применение трансформаций к URL
   */
  applyTransformations(url, transformations = {}) {
    if (!url || !transformations || Object.keys(transformations).length === 0) {
      return url;
    }

    // Парсим URL Cloudinary
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) {
      return url;
    }

    const baseUrl = urlParts[0];
    const resourceId = urlParts[1];

    // Строим строку трансформаций
    const transformParams = [];
    
    if (transformations.width) transformParams.push(`w_${transformations.width}`);
    if (transformations.height) transformParams.push(`h_${transformations.height}`);
    if (transformations.quality) transformParams.push(`q_${transformations.quality}`);
    if (transformations.format) transformParams.push(`f_${transformations.format}`);
    if (transformations.crop) transformParams.push(`c_${transformations.crop}`);
    if (transformations.gravity) transformParams.push(`g_${transformations.gravity}`);

    const transformString = transformParams.join(',');
    
    if (transformString) {
      return `${baseUrl}/upload/${transformString}/${resourceId}`;
    }

    return url;
  }
}
