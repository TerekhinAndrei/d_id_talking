/**
 * Конфигурация системы хранения файлов
 */

import { IStorageConfig } from '../interfaces/IStorageProvider.js';
import { StorageProvider, ValidationConfig, ProviderConfig } from '../types/storage.js';
import configManager from '../../config/ConfigManager.js';

export class StorageConfig extends IStorageConfig {
  constructor() {
    super();
    this.configManager = configManager;
    this._validationConfig = null;
    this._providerConfigs = null;
    this._defaultProvider = null;
  }

  /**
   * Получение конфигурации провайдера
   */
  getProviderConfig(provider) {
    if (!this._providerConfigs) {
      this._initializeProviderConfigs();
    }
    return this._providerConfigs[provider] || null;
  }

  /**
   * Получение провайдера по умолчанию
   */
  getDefaultProvider() {
    if (!this._defaultProvider) {
      this._defaultProvider = this.configManager.get('storage.defaultProvider', StorageProvider.D_ID);
    }
    return this._defaultProvider;
  }

  /**
   * Получение конфигурации валидации
   */
  getValidationConfig() {
    if (!this._validationConfig) {
      this._validationConfig = new ValidationConfig({
        maxFileSize: this.configManager.get('storage.maxFileSize', 10 * 1024 * 1024),
        allowedImageTypes: this.configManager.get('storage.allowedImageTypes', [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ]),
        allowedAudioTypes: this.configManager.get('storage.allowedAudioTypes', [
          'audio/mpeg',
          'audio/wav',
          'audio/webm',
          'audio/ogg',
          'audio/x-wav'
        ]),
        allowedVideoTypes: this.configManager.get('storage.allowedVideoTypes', [
          'video/mp4',
          'video/webm',
          'video/ogg'
        ]),
        maxFilenameLength: this.configManager.get('storage.maxFilenameLength', 255),
        allowedFilenameChars: new RegExp(
          this.configManager.get('storage.allowedFilenameChars', '^[a-zA-Z0-9._-]+$')
        )
      });
    }
    return this._validationConfig;
  }

  /**
   * Проверка доступности провайдера
   */
  isProviderEnabled(provider) {
    const config = this.getProviderConfig(provider);
    return config ? config.enabled : false;
  }

  /**
   * Получение приоритета провайдера
   */
  getProviderPriority(provider) {
    const config = this.getProviderConfig(provider);
    return config ? config.priority : 0;
  }

  /**
   * Получение всех доступных провайдеров
   */
  getAvailableProviders() {
    if (!this._providerConfigs) {
      this._initializeProviderConfigs();
    }
    
    return Object.entries(this._providerConfigs)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => b.priority - a.priority)
      .map(([name, config]) => ({ name, ...config }));
  }

  /**
   * Получение настроек провайдера
   */
  getProviderSettings(provider) {
    const config = this.getProviderConfig(provider);
    return config ? config.options : {};
  }

  /**
   * Инициализация конфигураций провайдеров
   */
  _initializeProviderConfigs() {
    this._providerConfigs = {
      [StorageProvider.CLOUDINARY]: new ProviderConfig(
        StorageProvider.CLOUDINARY,
        this.configManager.get('storage.cloudinary.enabled', true),
        this.configManager.get('storage.cloudinary.priority', 1),
        {
          cloudName: this.configManager.get('storage.cloudinary.cloudName', 'daeoqig4w'),
          apiKey: this.configManager.get('storage.cloudinary.apiKey', import.meta.env.VITE_CLOUDINARY_API_KEY || ''),
          apiSecret: this.configManager.get('storage.cloudinary.apiSecret', import.meta.env.VITE_CLOUDINARY_API_SECRET || ''),
          uploadPreset: this.configManager.get('storage.cloudinary.uploadPreset', 'ml_default'),
          folder: this.configManager.get('storage.cloudinary.folder', 'd_id_talking'),
          maxFileSize: this.configManager.get('storage.cloudinary.maxFileSize', 10 * 1024 * 1024),
          allowedFormats: this.configManager.get('storage.cloudinary.allowedFormats', ['jpg', 'png', 'webp', 'mp3', 'wav', 'mp4']),
          transformation: this.configManager.get('storage.cloudinary.transformation', {}),
          fallback: this.configManager.get('storage.cloudinary.fallback', true)
        }
      ),
      
      [StorageProvider.D_ID]: new ProviderConfig(
        StorageProvider.D_ID,
        this.configManager.get('storage.d_id.enabled', true),
        this.configManager.get('storage.d_id.priority', 2),
        {
          apiKey: this.configManager.get('storage.d_id.apiKey', import.meta.env.VITE_D_ID_API_KEY || ''),
          baseUrl: this.configManager.get('storage.d_id.baseUrl', 'https://api.d-id.com'),
          maxFileSize: this.configManager.get('storage.d_id.maxFileSize', 50 * 1024 * 1024),
          allowedImageTypes: this.configManager.get('storage.d_id.allowedImageTypes', ['image/jpeg', 'image/png']),
          allowedAudioTypes: this.configManager.get('storage.d_id.allowedAudioTypes', ['audio/', 'video/']),
          maxFilenameLength: this.configManager.get('storage.d_id.maxFilenameLength', 50),
          fallback: this.configManager.get('storage.d_id.fallback', true)
        }
      ),
      
      [StorageProvider.LOCAL]: new ProviderConfig(
        StorageProvider.LOCAL,
        this.configManager.get('storage.local.enabled', false),
        this.configManager.get('storage.local.priority', 0),
        {
          uploadPath: this.configManager.get('storage.local.uploadPath', '/uploads'),
          maxFileSize: this.configManager.get('storage.local.maxFileSize', 5 * 1024 * 1024),
          allowedFormats: this.configManager.get('storage.local.allowedFormats', ['jpg', 'png', 'mp3', 'wav']),
          serveUrl: this.configManager.get('storage.local.serveUrl', '/uploads')
        }
      ),
      
      [StorageProvider.HYBRID]: new ProviderConfig(
        StorageProvider.HYBRID,
        this.configManager.get('storage.hybrid.enabled', true),
        this.configManager.get('storage.hybrid.priority', 3),
        {
          primaryProvider: this.configManager.get('storage.hybrid.primaryProvider', StorageProvider.D_ID),
          fallbackProvider: this.configManager.get('storage.hybrid.fallbackProvider', StorageProvider.CLOUDINARY),
          strategy: this.configManager.get('storage.hybrid.strategy', 'fallback'),
          uploadToBoth: this.configManager.get('storage.hybrid.uploadToBoth', false)
        }
      )
    };
  }

  /**
   * Обновление конфигурации
   */
  updateConfig(newConfig) {
    // Обновляем настройки
    Object.entries(newConfig).forEach(([key, value]) => {
      this.configManager.set(key, value);
    });

    // Сбрасываем кэшированные значения
    this._validationConfig = null;
    this._providerConfigs = null;
    this._defaultProvider = null;
  }

  /**
   * Получение конфигурации для определенного типа файла
   */
  getFileTypeConfig(fileType) {
    const validationConfig = this.getValidationConfig();
    
    switch (fileType) {
      case 'image':
        return {
          allowedTypes: validationConfig.allowedImageTypes,
          maxSize: this.configManager.get('storage.image.maxSize', validationConfig.maxFileSize)
        };
      case 'audio':
        return {
          allowedTypes: validationConfig.allowedAudioTypes,
          maxSize: this.configManager.get('storage.audio.maxSize', validationConfig.maxFileSize)
        };
      case 'video':
        return {
          allowedTypes: validationConfig.allowedVideoTypes,
          maxSize: this.configManager.get('storage.video.maxSize', validationConfig.maxFileSize)
        };
      default:
        return {
          allowedTypes: [],
          maxSize: validationConfig.maxFileSize
        };
    }
  }

  /**
   * Получение оптимального провайдера для типа файла
   */
  getOptimalProvider(fileType) {
    const availableProviders = this.getAvailableProviders();
    
    // Сортируем по приоритету и совместимости
    const compatibleProviders = availableProviders.filter(provider => {
      const settings = this.getProviderSettings(provider.name);
      
      switch (fileType) {
        case 'image':
          return settings.allowedImageTypes || settings.allowedFormats;
        case 'audio':
          return settings.allowedAudioTypes || settings.allowedFormats;
        case 'video':
          return settings.allowedVideoTypes || settings.allowedFormats;
        default:
          return true;
      }
    });

    return compatibleProviders.length > 0 ? compatibleProviders[0].name : this.getDefaultProvider();
  }

  /**
   * Получение всей конфигурации
   */
  getConfig() {
    return {
      defaultProvider: this.getDefaultProvider(),
      validationConfig: this.getValidationConfig(),
      availableProviders: this.getAvailableProviders(),
      providerConfigs: this._providerConfigs || {}
    };
  }
}

// Создаем единственный экземпляр конфигурации
export const storageConfig = new StorageConfig();
