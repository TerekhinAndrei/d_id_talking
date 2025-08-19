/**
 * Типы и enum'ы для системы хранения файлов
 */

/**
 * Enum провайдеров хранения
 */
export const StorageProvider = {
  CLOUDINARY: 'cloudinary',
  D_ID: 'd_id',
  LOCAL: 'local',
  HYBRID: 'hybrid'
};

/**
 * Enum типов файлов
 */
export const FileType = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document'
};

/**
 * Enum статусов загрузки
 */
export const UploadStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Enum стратегий загрузки
 */
export const UploadStrategy = {
  DIRECT: 'direct',      // Прямая загрузка в выбранный провайдер
  FALLBACK: 'fallback',  // С fallback на другой провайдер
  HYBRID: 'hybrid',      // Гибридная загрузка (оба провайдера)
  AUTO: 'auto'           // Автоматический выбор
};

/**
 * Конфигурация провайдера
 */
export class ProviderConfig {
  constructor(name, enabled = true, priority = 0, options = {}) {
    this.name = name;
    this.enabled = enabled;
    this.priority = priority;
    this.options = options;
  }
}

/**
 * Метаданные файла
 */
export class FileMetadata {
  constructor(data = {}) {
    this.id = data.id || null;
    this.filename = data.filename || '';
    this.contentType = data.contentType || '';
    this.size = data.size || 0;
    this.url = data.url || null;
    this.secureUrl = data.secureUrl || null;
    this.provider = data.provider || StorageProvider.CLOUDINARY;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.expiresAt = data.expiresAt || null;
    this.metadata = data.metadata || {};
  }
}

/**
 * Результат загрузки
 */
export class UploadResult {
  constructor(data = {}) {
    this.success = data.success || false;
    this.fileMetadata = data.fileMetadata ? new FileMetadata(data.fileMetadata) : null;
    this.provider = data.provider || StorageProvider.CLOUDINARY;
    this.strategy = data.strategy || UploadStrategy.DIRECT;
    this.error = data.error || null;
    this.duration = data.duration || 0;
    this.retries = data.retries || 0;
  }
}

/**
 * Опции загрузки
 */
export class UploadOptions {
  constructor(options = {}) {
    this.provider = options.provider || StorageProvider.AUTO;
    this.strategy = options.strategy || UploadStrategy.AUTO;
    this.fileType = options.fileType || null;
    this.maxSize = options.maxSize || null;
    this.allowedTypes = options.allowedTypes || [];
    this.metadata = options.metadata || {};
    this.retries = options.retries || 3;
    this.timeout = options.timeout || 30000;
    this.onProgress = options.onProgress || null;
    this.onSuccess = options.onSuccess || null;
    this.onError = options.onError || null;
  }
}

/**
 * Конфигурация валидации
 */
export class ValidationConfig {
  constructor(config = {}) {
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = config.allowedImageTypes || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    this.allowedAudioTypes = config.allowedAudioTypes || [
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/x-wav'
    ];
    this.allowedVideoTypes = config.allowedVideoTypes || [
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];
    this.maxFilenameLength = config.maxFilenameLength || 255;
    this.allowedFilenameChars = config.allowedFilenameChars || /^[a-zA-Z0-9._-]+$/;
  }
}

/**
 * Статистика загрузки
 */
export class UploadStats {
  constructor() {
    this.totalUploads = 0;
    this.successfulUploads = 0;
    this.failedUploads = 0;
    this.totalBytes = 0;
    this.averageDuration = 0;
    this.providerStats = {};
  }

  addUpload(result) {
    this.totalUploads++;
    this.totalBytes += result.fileMetadata?.size || 0;
    
    if (result.success) {
      this.successfulUploads++;
    } else {
      this.failedUploads++;
    }

    // Обновляем статистику по провайдерам
    const provider = result.provider;
    if (!this.providerStats[provider]) {
      this.providerStats[provider] = {
        total: 0,
        success: 0,
        failed: 0,
        bytes: 0
      };
    }
    
    this.providerStats[provider].total++;
    this.providerStats[provider].bytes += result.fileMetadata?.size || 0;
    
    if (result.success) {
      this.providerStats[provider].success++;
    } else {
      this.providerStats[provider].failed++;
    }

    // Обновляем среднюю продолжительность
    if (result.duration > 0) {
      this.averageDuration = (this.averageDuration * (this.totalUploads - 1) + result.duration) / this.totalUploads;
    }
  }

  getSuccessRate() {
    return this.totalUploads > 0 ? (this.successfulUploads / this.totalUploads) * 100 : 0;
  }

  getProviderSuccessRate(provider) {
    const stats = this.providerStats[provider];
    return stats && stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
  }
}
