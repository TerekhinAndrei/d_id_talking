/**
 * Менеджер конфигурации приложения
 */
// Централизованная конфигурация для URL
class ConfigManager {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    
    // Определяем базовые URL в зависимости от окружения
    this.backendUrl = this.getBackendUrl();
    this.frontendUrl = this.getFrontendUrl();
    
    console.log('🔧 ConfigManager initialized:', {
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      backendUrl: this.backendUrl,
      frontendUrl: this.frontendUrl
    });
  }

  getBackendUrl() {
    // Приоритет: переменная окружения > продакшен > локальная разработка
    const envBackendUrl = import.meta.env.VITE_API_BASE_URL;
    
    if (envBackendUrl) {
      return envBackendUrl;
    }
    
    if (this.isProduction) {
      return 'https://talking-head.onrender.com';
    }
    
    return 'http://localhost:8000';
  }

  getFrontendUrl() {
    if (this.isProduction) {
      return 'https://talking-head-frontend.onrender.com';
    }
    
    return 'http://localhost:5173';
  }

  getWebSocketUrl(path = '/ws/stream') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = this.backendUrl.replace(/^https?:\/\//, '');
    return `${protocol}//${host}${path}`;
  }

  getApiUrl(endpoint = '') {
    return `${this.backendUrl}${endpoint}`;
  }

  // Методы для работы с конфигурацией хранилища
  get(key, defaultValue = null) {
    // Сначала проверяем переменные окружения
    const envKey = key.replace(/\./g, '_').toUpperCase();
    const envValue = import.meta.env[`VITE_${envKey}`];
    
    if (envValue !== undefined) {
      try {
        return JSON.parse(envValue);
      } catch {
        return envValue;
      }
    }
    
    // Затем проверяем localStorage
    const storedValue = localStorage.getItem(`config.${key}`);
    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue);
      } catch {
        return storedValue;
      }
    }
    
    return defaultValue;
  }

  set(key, value) {
    // Сохраняем значение в localStorage
    localStorage.setItem(`config.${key}`, JSON.stringify(value));
  }

  // Методы для работы с конфигурацией хранилища
  getStorageConfig() {
    return {
      // Cloudinary конфигурация
      'storage.cloudinary.enabled': this.get('storage.cloudinary.enabled', true),
      'storage.cloudinary.priority': this.get('storage.cloudinary.priority', 1),
      'storage.cloudinary.cloudName': this.get('storage.cloudinary.cloudName', 'daeoqig4w'),
      'storage.cloudinary.apiKey': this.get('storage.cloudinary.apiKey', import.meta.env.VITE_CLOUDINARY_API_KEY || ''),
      'storage.cloudinary.apiSecret': this.get('storage.cloudinary.apiSecret', import.meta.env.VITE_CLOUDINARY_API_SECRET || ''),
      'storage.cloudinary.uploadPreset': this.get('storage.cloudinary.uploadPreset', 'ml_default'),
      'storage.cloudinary.folder': this.get('storage.cloudinary.folder', 'd_id_talking'),
      'storage.cloudinary.maxFileSize': this.get('storage.cloudinary.maxFileSize', 10 * 1024 * 1024),
      'storage.cloudinary.allowedFormats': this.get('storage.cloudinary.allowedFormats', ['jpg', 'png', 'webp', 'mp3', 'wav', 'mp4']),
      'storage.cloudinary.transformation': this.get('storage.cloudinary.transformation', {}),
      'storage.cloudinary.fallback': this.get('storage.cloudinary.fallback', true),

      // D-ID конфигурация
      'storage.d_id.enabled': this.get('storage.d_id.enabled', true),
      'storage.d_id.priority': this.get('storage.d_id.priority', 2),
      'storage.d_id.apiKey': this.get('storage.d_id.apiKey', import.meta.env.VITE_D_ID_API_KEY || ''),
      'storage.d_id.baseUrl': this.get('storage.d_id.baseUrl', 'https://api.d-id.com'),
      'storage.d_id.maxFileSize': this.get('storage.d_id.maxFileSize', 50 * 1024 * 1024),
      'storage.d_id.allowedImageTypes': this.get('storage.d_id.allowedImageTypes', ['image/jpeg', 'image/png']),
      'storage.d_id.allowedAudioTypes': this.get('storage.d_id.allowedAudioTypes', ['audio/', 'video/']),
      'storage.d_id.maxFilenameLength': this.get('storage.d_id.maxFilenameLength', 50),
      'storage.d_id.fallback': this.get('storage.d_id.fallback', true),

      // Local конфигурация
      'storage.local.enabled': this.get('storage.local.enabled', false),
      'storage.local.priority': this.get('storage.local.priority', 0),
      'storage.local.uploadPath': this.get('storage.local.uploadPath', '/uploads'),
      'storage.local.maxFileSize': this.get('storage.local.maxFileSize', 5 * 1024 * 1024),
      'storage.local.allowedFormats': this.get('storage.local.allowedFormats', ['jpg', 'png', 'mp3', 'wav']),
      'storage.local.serveUrl': this.get('storage.local.serveUrl', '/uploads'),

      // Hybrid конфигурация
      'storage.hybrid.enabled': this.get('storage.hybrid.enabled', true),
      'storage.hybrid.priority': this.get('storage.hybrid.priority', 3),
      'storage.hybrid.primaryProvider': this.get('storage.hybrid.primaryProvider', 'd_id'),
      'storage.hybrid.fallbackProvider': this.get('storage.hybrid.fallbackProvider', 'cloudinary'),
      'storage.hybrid.strategy': this.get('storage.hybrid.strategy', 'fallback'),
      'storage.hybrid.uploadToBoth': this.get('storage.hybrid.uploadToBoth', false),

      // Общие настройки
      'storage.defaultProvider': this.get('storage.defaultProvider', 'd_id'),
      'storage.maxFileSize': this.get('storage.maxFileSize', 50 * 1024 * 1024),
      'storage.allowedImageTypes': this.get('storage.allowedImageTypes', ['image/jpeg', 'image/png', 'image/webp']),
      'storage.allowedAudioTypes': this.get('storage.allowedAudioTypes', ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav']),
      'storage.allowedVideoTypes': this.get('storage.allowedVideoTypes', ['video/mp4', 'video/webm']),
      'storage.enableValidation': this.get('storage.enableValidation', true),
      'storage.enableFallback': this.get('storage.enableFallback', true),
      'storage.retryAttempts': this.get('storage.retryAttempts', 3),
      'storage.retryDelay': this.get('storage.retryDelay', 1000)
    };
  }
}

// Создаем единственный экземпляр
const configManager = new ConfigManager();

export default configManager;
