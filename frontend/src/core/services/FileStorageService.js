/**
 * Главный сервис управления файлами
 */

import { IFileService } from '../interfaces/IStorageProvider.js';
import { StorageProvider, UploadStrategy, UploadOptions, UploadResult, UploadStats } from '../types/storage.js';
import { storageConfig } from '../config/StorageConfig.js';
import { CloudinaryProvider } from '../providers/CloudinaryProvider.js';
import { DIdProvider } from '../providers/DIdProvider.js';

export class FileStorageService extends IFileService {
  constructor() {
    super();
    this.config = storageConfig;
    this.providers = new Map();
    this.stats = new UploadStats();
    this.isInitialized = false;
  }

  /**
   * Инициализация сервиса
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🔧 Initializing FileStorageService...');

      // Инициализируем провайдеры
      await this._initializeProviders();

      this.isInitialized = true;
      console.log('✅ FileStorageService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize FileStorageService:', error);
      throw error;
    }
  }

  /**
   * Загрузка файла с автоматическим выбором провайдера
   */
  async uploadFile(file, options = new UploadOptions()) {
    await this.ensureInitialized();

    const startTime = Date.now();
    const fileType = this._getFileType(file);

    try {
      // Определяем стратегию загрузки
      const strategy = this._determineStrategy(options);
      const provider = this._selectProvider(fileType, options, strategy);

      console.log(`📤 Uploading ${fileType} file using ${provider.name} provider with ${strategy} strategy`);

      let result;

      switch (strategy) {
        case UploadStrategy.DIRECT:
          result = await this._uploadDirect(file, provider, options);
          break;
        case UploadStrategy.FALLBACK:
          result = await this._uploadWithFallback(file, provider, options);
          break;
        case UploadStrategy.HYBRID:
          result = await this._uploadHybrid(file, provider, options);
          break;
        case UploadStrategy.AUTO:
        default:
          result = await this._uploadAuto(file, fileType, options);
          break;
      }

      // Обновляем статистику
      this.stats.addUpload(result);

      // Вызываем callback'и
      if (result.success && options.onSuccess) {
        options.onSuccess(result);
      } else if (!result.success && options.onError) {
        options.onError(result.error);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Upload failed after ${duration}ms:`, error);

      const result = new UploadResult({
        success: false,
        provider: options.provider || 'unknown',
        strategy: options.strategy || UploadStrategy.AUTO,
        error: error.message,
        duration
      });

      this.stats.addUpload(result);

      if (options.onError) {
        options.onError(error.message);
      }

      throw error;
    }
  }

  /**
   * Загрузка изображения
   */
  async uploadImage(file, options = new UploadOptions()) {
    return this.uploadFile(file, {
      ...options,
      fileType: 'image'
    });
  }

  /**
   * Загрузка аудио файла
   */
  async uploadAudio(file, options = new UploadOptions()) {
    return this.uploadFile(file, {
      ...options,
      fileType: 'audio'
    });
  }

  /**
   * Загрузка видео файла
   */
  async uploadVideo(file, options = new UploadOptions()) {
    return this.uploadFile(file, {
      ...options,
      fileType: 'video'
    });
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId, provider = null) {
    await this.ensureInitialized();

    try {
      // Определяем провайдера, если не указан
      if (!provider) {
        provider = this._detectProvider(fileId);
      }

      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new Error(`Provider ${provider} not found`);
      }

      const result = await providerInstance.deleteFile(fileId);
      console.log(`✅ File ${fileId} deleted from ${provider} successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to delete file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(fileId, provider = null) {
    await this.ensureInitialized();

    try {
      if (!provider) {
        provider = this._detectProvider(fileId);
      }

      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new Error(`Provider ${provider} not found`);
      }

      return await providerInstance.getFileMetadata(fileId);

    } catch (error) {
      console.error(`❌ Failed to get metadata for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Валидация файла
   */
  validateFile(file, fileType = null) {
    const detectedType = fileType || this._getFileType(file);
    const validationConfig = this.config.getValidationConfig();
    const fileTypeConfig = this.config.getFileTypeConfig(detectedType);

    const errors = [];

    // Проверяем размер файла
    if (file.size > fileTypeConfig.maxSize) {
      errors.push(`File size exceeds maximum allowed size: ${(fileTypeConfig.maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Проверяем тип файла
    if (fileTypeConfig.allowedTypes.length > 0) {
      const isAllowed = fileTypeConfig.allowedTypes.some(type => {
        if (type.endsWith('/')) {
          return file.type.startsWith(type);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        errors.push(`File type ${file.type} is not allowed. Allowed types: ${fileTypeConfig.allowedTypes.join(', ')}`);
      }
    }

    // Проверяем имя файла
    if (file.name.length > validationConfig.maxFilenameLength) {
      errors.push(`Filename is too long. Maximum length: ${validationConfig.maxFilenameLength} characters`);
    }

    if (!validationConfig.allowedFilenameChars.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
      fileType: detectedType,
      size: file.size,
      maxSize: fileTypeConfig.maxSize
    };
  }

  /**
   * Получение статистики загрузок
   */
  getUploadStats() {
    return this.stats;
  }

  /**
   * Получение информации о доступных провайдерах
   */
  getAvailableProviders() {
    return Array.from(this.providers.values()).map(provider => provider.getProviderInfo());
  }

  /**
   * Тестирование провайдера
   */
  async testProvider(provider) {
    await this.ensureInitialized();

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not found`);
    }

    try {
      const isAvailable = await providerInstance.checkAvailability();
      return {
        provider,
        available: isAvailable,
        info: providerInstance.getProviderInfo()
      };
    } catch (error) {
      return {
        provider,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Приватные методы
   */

  async _initializeProviders() {
    const availableProviders = this.config.getAvailableProviders();

    for (const providerInfo of availableProviders) {
      try {
        let provider;

        switch (providerInfo.name) {
          case StorageProvider.CLOUDINARY:
            provider = new CloudinaryProvider(providerInfo.options);
            break;
          case StorageProvider.D_ID:
            provider = new DIdProvider(providerInfo.options);
            break;
          default:
            console.warn(`Unknown provider: ${providerInfo.name}`);
            continue;
        }

        await provider.initialize();
        this.providers.set(providerInfo.name, provider);
        console.log(`✅ Provider ${providerInfo.name} initialized`);

      } catch (error) {
        console.error(`❌ Failed to initialize provider ${providerInfo.name}:`, error);
      }
    }

    if (this.providers.size === 0) {
      console.warn('⚠️ No storage providers available. Please check your configuration.');
      console.warn('Required environment variables:');
      console.warn('- VITE_D_ID_API_KEY for D-ID provider');
      console.warn('- VITE_CLOUDINARY_API_KEY for Cloudinary provider');
      throw new Error('No storage providers available. Please check your configuration.');
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  _getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }

  _determineStrategy(options) {
    if (options.strategy && options.strategy !== UploadStrategy.AUTO) {
      return options.strategy;
    }

    // Автоматический выбор стратегии
    const availableProviders = this.config.getAvailableProviders();
    
    if (availableProviders.length === 1) {
      return UploadStrategy.DIRECT;
    }

    // Если есть D-ID и Cloudinary, используем fallback
    if (availableProviders.some(p => p.name === StorageProvider.D_ID) &&
        availableProviders.some(p => p.name === StorageProvider.CLOUDINARY)) {
      return UploadStrategy.FALLBACK;
    }

    return UploadStrategy.DIRECT;
  }

  _selectProvider(fileType, options, strategy) {
    // Если провайдер явно указан
    if (options.provider && options.provider !== StorageProvider.AUTO) {
      const provider = this.providers.get(options.provider);
      if (provider) {
        return provider;
      }
    }

    // Автоматический выбор провайдера
    const optimalProvider = this.config.getOptimalProvider(fileType);
    const provider = this.providers.get(optimalProvider);
    
    if (!provider) {
      throw new Error(`No suitable provider found for ${fileType} files`);
    }

    return provider;
  }

  async _uploadDirect(file, provider, options) {
    return await provider.uploadFile(file, options);
  }

  async _uploadWithFallback(file, primaryProvider, options) {
    try {
      return await primaryProvider.uploadFile(file, options);
    } catch (error) {
      console.warn(`Primary provider ${primaryProvider.name} failed, trying fallback...`);

      // Ищем fallback провайдера
      const fallbackProvider = this._getFallbackProvider(primaryProvider.name);
      if (!fallbackProvider) {
        throw error;
      }

      return await fallbackProvider.uploadFile(file, options);
    }
  }

  async _uploadHybrid(file, primaryProvider, options) {
    const results = [];

    // Загружаем во все доступные провайдеры
    for (const provider of this.providers.values()) {
      try {
        const result = await provider.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        console.warn(`Hybrid upload to ${provider.name} failed:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error('All providers failed');
    }

    // Возвращаем первый успешный результат
    return results.find(r => r.success) || results[0];
  }

  async _uploadAuto(file, fileType, options) {
    const availableProviders = this.config.getAvailableProviders();
    
    if (availableProviders.length === 1) {
      return this._uploadDirect(file, this.providers.get(availableProviders[0].name), options);
    }

    // Пытаемся загрузить в оптимальный провайдер с fallback
    const optimalProvider = this.config.getOptimalProvider(fileType);
    const provider = this.providers.get(optimalProvider);
    
    return this._uploadWithFallback(file, provider, options);
  }

  _getFallbackProvider(primaryProviderName) {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.name !== primaryProviderName);

    return availableProviders.length > 0 ? availableProviders[0] : null;
  }

  _detectProvider(fileId) {
    // Определяем провайдера по ID файла
    if (fileId.startsWith('img_') || fileId.startsWith('f_')) {
      return StorageProvider.D_ID;
    }
    
    // Cloudinary IDs обычно содержат путь с папками
    if (fileId.includes('/')) {
      return StorageProvider.CLOUDINARY;
    }

    // По умолчанию возвращаем первый доступный провайдер
    return Array.from(this.providers.keys())[0];
  }
}

// Создаем единственный экземпляр сервиса
export const fileStorageService = new FileStorageService();
