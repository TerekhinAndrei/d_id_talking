import { apiService } from './api.js';
import { configManager } from '../config/ConfigManager.js';

/**
 * Сервис для работы с файлами
 * Поддерживает D-ID и Cloudinary провайдеры
 */
class FileService {
  constructor() {
    this.configManager = configManager;
  }

  /**
   * Загружает изображение с автоматическим выбором провайдера
   */
  async uploadImage(file, options = {}) {
    const {
      provider = this.configManager.getDefaultStorageProvider(),
      fallback = true
    } = options;

    try {
      // Проверяем размер файла
      if (provider === 'd_id') {
        const maxSize = this.configManager.getDIdMaxFileSize();
        if (file.size > maxSize) {
          throw new Error(`File size exceeds maximum allowed size: ${maxSize} bytes`);
        }

        // Проверяем тип файла
        const supportedTypes = this.configManager.getDIdSupportedImageTypes();
        if (!supportedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}. Supported: ${supportedTypes.join(', ')}`);
        }
      }

      // Пытаемся загрузить через выбранный провайдер
      if (provider === 'd_id' && this.configManager.isDIdEnabled()) {
        try {
          const result = await apiService.uploadImageToDId(file);
          return {
            ...result,
            provider: 'd_id',
            fileId: result.data?.file_id || result.data?.public_id
          };
        } catch (error) {
          console.warn('D-ID upload failed, trying fallback:', error);
          if (!fallback) throw error;
        }
      }

      // Fallback к Cloudinary или гибридному эндпоинту
      if (this.configManager.isCloudinaryEnabled()) {
        const useDId = provider === 'd_id';
        const result = await apiService.uploadImageHybrid(file, useDId);
        return {
          ...result,
          provider: useDId ? 'd_id' : 'cloudinary',
          fileId: result.data?.file_id || result.data?.public_id
        };
      }

      throw new Error('No storage provider available');
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Загружает аудио файл с автоматическим выбором провайдера
   */
  async uploadAudio(file, options = {}) {
    const {
      provider = this.configManager.getDefaultStorageProvider(),
      fallback = true
    } = options;

    try {
      // Проверяем размер файла
      if (provider === 'd_id') {
        const maxSize = this.configManager.getDIdMaxFileSize();
        if (file.size > maxSize) {
          throw new Error(`File size exceeds maximum allowed size: ${maxSize} bytes`);
        }

        // Проверяем тип файла
        const supportedTypes = this.configManager.getDIdSupportedAudioTypes();
        if (!supportedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}. Supported: ${supportedTypes.join(', ')}`);
        }
      }

      // Пытаемся загрузить через выбранный провайдер
      if (provider === 'd_id' && this.configManager.isDIdEnabled()) {
        try {
          const result = await apiService.uploadAudioToDId(file);
          return {
            ...result,
            provider: 'd_id',
            fileId: result.data?.file_id || result.data?.public_id
          };
        } catch (error) {
          console.warn('D-ID upload failed, trying fallback:', error);
          if (!fallback) throw error;
        }
      }

      // Fallback к Cloudinary или гибридному эндпоинту
      if (this.configManager.isCloudinaryEnabled()) {
        const useDId = provider === 'd_id';
        const result = await apiService.uploadAudioHybrid(file, useDId);
        return {
          ...result,
          provider: useDId ? 'd_id' : 'cloudinary',
          fileId: result.data?.file_id || result.data?.public_id
        };
      }

      throw new Error('No storage provider available');
    } catch (error) {
      console.error('Audio upload failed:', error);
      throw error;
    }
  }

  /**
   * Удаляет файл
   */
  async deleteFile(fileId, provider = 'auto') {
    try {
      if (provider === 'auto') {
        // Пытаемся определить провайдера по ID
        if (fileId.startsWith('img_') || fileId.startsWith('fTrFFyunjsa7AkLgxrU_S')) {
          provider = 'd_id';
        } else {
          provider = 'cloudinary';
        }
      }

      if (provider === 'd_id') {
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
        const result = await apiService.deleteFileHybrid(fileId, provider);
        return { ...result, provider };
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Тестирует аутентификацию D-ID
   */
  async testDIdAuthentication() {
    try {
      const result = await apiService.testDIdAuthentication();
      return {
        ...result,
        provider: 'd_id'
      };
    } catch (error) {
      console.error('D-ID authentication test failed:', error);
      throw error;
    }
  }

  /**
   * Получает информацию о провайдерах
   */
  getProvidersInfo() {
    return {
      dId: {
        enabled: this.configManager.isDIdEnabled(),
        maxFileSize: this.configManager.getDIdMaxFileSize(),
        supportedImageTypes: this.configManager.getDIdSupportedImageTypes(),
        supportedAudioTypes: this.configManager.getDIdSupportedAudioTypes()
      },
      cloudinary: {
        enabled: this.configManager.isCloudinaryEnabled(),
        fallback: this.configManager.get('storage.cloudinary.fallback', true)
      },
      default: this.configManager.getDefaultStorageProvider()
    };
  }

  /**
   * Валидирует файл для загрузки
   */
  validateFile(file, type = 'auto') {
    const errors = [];

    // Определяем тип файла
    if (type === 'auto') {
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        type = 'audio';
      } else {
        errors.push('Unsupported file type');
        return { valid: false, errors };
      }
    }

    // Проверяем размер файла
    const maxSize = this.configManager.getDIdMaxFileSize();
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Проверяем тип файла для D-ID
    if (type === 'image') {
      const supportedTypes = this.configManager.getDIdSupportedImageTypes();
      if (!supportedTypes.includes(file.type)) {
        errors.push(`Unsupported image type: ${file.type}. Supported: ${supportedTypes.join(', ')}`);
      }
    } else if (type === 'audio') {
      const supportedTypes = this.configManager.getDIdSupportedAudioTypes();
      if (!supportedTypes.includes(file.type)) {
        errors.push(`Unsupported audio type: ${file.type}. Supported: ${supportedTypes.join(', ')}`);
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
}

export const fileService = new FileService();
