/**
 * Базовый класс для провайдеров хранения файлов
 */

import { IStorageProvider } from '../interfaces/IStorageProvider.js';
import { FileMetadata, UploadResult, UploadOptions, UploadStatus } from '../types/storage.js';

export class BaseStorageProvider extends IStorageProvider {
  constructor(name, config = {}) {
    super();
    this.name = name;
    this.config = config;
    this.isInitialized = false;
    this.isAvailable = false;
    this.logger = console; // Можно заменить на более продвинутый логгер
  }

  /**
   * Инициализация провайдера
   */
  async initialize() {
    try {
      this.logger.log(`🔧 Initializing ${this.name} provider...`);
      
      // Проверяем конфигурацию
      if (!this.validateConfig()) {
        throw new Error(`Invalid configuration for ${this.name} provider`);
      }

      // Выполняем специфичную инициализацию
      await this._initializeProvider();
      
      this.isInitialized = true;
      this.isAvailable = true;
      
      this.logger.log(`✅ ${this.name} provider initialized successfully`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to initialize ${this.name} provider:`, error);
      this.isAvailable = false;
      throw error;
    }
  }

  /**
   * Проверка доступности провайдера
   */
  async checkAvailability() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const isAvailable = await this._checkAvailability();
      this.isAvailable = isAvailable;
      
      this.logger.log(`🔍 ${this.name} provider availability: ${isAvailable ? '✅ Available' : '❌ Unavailable'}`);
      return isAvailable;
    } catch (error) {
      this.logger.error(`❌ Error checking ${this.name} provider availability:`, error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Загрузка файла
   */
  async uploadFile(file, options = new UploadOptions()) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`📤 Uploading file to ${this.name}: ${file.name} (${file.size} bytes)`);
      
      // Проверяем доступность
      if (!await this.checkAvailability()) {
        throw new Error(`${this.name} provider is not available`);
      }

      // Валидируем файл
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Выполняем загрузку
      const result = await this._uploadFile(file, options);
      
      const duration = Date.now() - startTime;
      
      this.logger.log(`✅ File uploaded to ${this.name} successfully in ${duration}ms`);
      
      return new UploadResult({
        success: true,
        fileMetadata: result,
        provider: this.name,
        strategy: options.strategy,
        duration,
        retries: 0
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`❌ Failed to upload file to ${this.name}:`, error);
      
      return new UploadResult({
        success: false,
        provider: this.name,
        strategy: options.strategy,
        error: error.message,
        duration,
        retries: 0
      });
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId) {
    try {
      this.logger.log(`🗑️ Deleting file from ${this.name}: ${fileId}`);
      
      if (!await this.checkAvailability()) {
        throw new Error(`${this.name} provider is not available`);
      }

      const result = await this._deleteFile(fileId);
      
      this.logger.log(`✅ File deleted from ${this.name} successfully`);
      return result;
      
    } catch (error) {
      this.logger.error(`❌ Failed to delete file from ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(fileId) {
    try {
      this.logger.log(`📋 Getting file metadata from ${this.name}: ${fileId}`);
      
      if (!await this.checkAvailability()) {
        throw new Error(`${this.name} provider is not available`);
      }

      const metadata = await this._getFileMetadata(fileId);
      
      this.logger.log(`✅ File metadata retrieved from ${this.name} successfully`);
      return metadata;
      
    } catch (error) {
      this.logger.error(`❌ Failed to get file metadata from ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Получение URL файла
   */
  async getFileUrl(fileId) {
    try {
      if (!await this.checkAvailability()) {
        throw new Error(`${this.name} provider is not available`);
      }

      return await this._getFileUrl(fileId);
      
    } catch (error) {
      this.logger.error(`❌ Failed to get file URL from ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Валидация файла
   */
  validateFile(file, options = new UploadOptions()) {
    const errors = [];
    
    // Проверяем наличие файла
    if (!file) {
      errors.push('File is required');
      return { valid: false, errors };
    }

    // Проверяем размер файла
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size exceeds maximum allowed size: ${(options.maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Проверяем тип файла
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const isAllowed = options.allowedTypes.some(type => {
        if (type.endsWith('/')) {
          return file.type.startsWith(type);
        }
        return file.type === type;
      });
      
      if (!isAllowed) {
        errors.push(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }

    // Проверяем имя файла
    if (options.maxFilenameLength && file.name.length > options.maxFilenameLength) {
      errors.push(`Filename is too long. Maximum length: ${options.maxFilenameLength} characters`);
    }

    // Выполняем специфичную валидацию
    const specificValidation = this._validateFile(file, options);
    if (specificValidation && !specificValidation.valid) {
      errors.push(...specificValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
      fileType: this._getFileType(file),
      size: file.size,
      maxSize: options.maxSize
    };
  }

  /**
   * Получение информации о провайдере
   */
  getProviderInfo() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable,
      config: this.config,
      capabilities: this._getCapabilities()
    };
  }

  /**
   * Получение типа файла
   */
  _getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }

  /**
   * Получение возможностей провайдера
   */
  _getCapabilities() {
    return {
      upload: true,
      delete: true,
      getMetadata: true,
      getUrl: true,
      supportsImage: true,
      supportsAudio: true,
      supportsVideo: false,
      maxFileSize: this.config.maxFileSize || 10 * 1024 * 1024,
      allowedTypes: this.config.allowedTypes || []
    };
  }

  /**
   * Валидация конфигурации (должна быть переопределена в наследниках)
   */
  validateConfig() {
    return true;
  }

  /**
   * Специфичная инициализация провайдера (должна быть переопределена в наследниках)
   */
  async _initializeProvider() {
    // Базовая реализация - ничего не делает
  }

  /**
   * Специфичная проверка доступности (должна быть переопределена в наследниках)
   */
  async _checkAvailability() {
    return this.isInitialized;
  }

  /**
   * Специфичная загрузка файла (должна быть переопределена в наследниках)
   */
  async _uploadFile(file, options) {
    throw new Error('_uploadFile() method must be implemented in subclass');
  }

  /**
   * Специфичное удаление файла (должна быть переопределена в наследниках)
   */
  async _deleteFile(fileId) {
    throw new Error('_deleteFile() method must be implemented in subclass');
  }

  /**
   * Специфичное получение метаданных (должна быть переопределена в наследниках)
   */
  async _getFileMetadata(fileId) {
    throw new Error('_getFileMetadata() method must be implemented in subclass');
  }

  /**
   * Специфичное получение URL (должна быть переопределена в наследниках)
   */
  async _getFileUrl(fileId) {
    throw new Error('_getFileUrl() method must be implemented in subclass');
  }

  /**
   * Специфичная валидация файла (может быть переопределена в наследниках)
   */
  _validateFile(file, options) {
    return { valid: true, errors: [] };
  }
}
