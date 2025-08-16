/**
 * Менеджер конфигурации приложения
 */
export class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.subscribers = new Set();
  }

  /**
   * Загружает конфигурацию
   */
  loadConfig() {
    const defaultConfig = {
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
        timeout: 30000,
        retries: 3
      },
      storage: {
        defaultProvider: 'd_id', // 'cloudinary' or 'd_id'
        dId: {
          enabled: true,
          autoCleanup: true,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          supportedImageTypes: ['image/jpeg', 'image/png'],
          supportedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']
        },
        cloudinary: {
          enabled: true,
          fallback: true
        }
      },
      streaming: {
        defaultImageUrl: '/default_avatar.jpg',
        defaultVoiceId: 'en-US-JennyNeural',
        chunkDuration: 2000,
        outputResolution: 512,
        quality: 'medium'
      },
      audio: {
        sampleRate: 48000,
        channels: 1,
        bitrate: 128000,
        format: 'mp3',
        enableSpeechDetection: true,
        silenceThreshold: 0.1
      },
      webrtc: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require'
      },
      logging: {
        level: 'info',
        maxLogs: 1000,
        saveToStorage: true,
        enableConsole: true
      },
      features: {
        enableMicrophone: true,
        enableVoicePreview: true,
        enableAutoReconnect: true,
        enableErrorReporting: true
      }
    };

    // Загружаем пользовательскую конфигурацию из localStorage
    try {
      const savedConfig = localStorage.getItem('app_config');
      if (savedConfig) {
        const userConfig = JSON.parse(savedConfig);
        return this.mergeConfig(defaultConfig, userConfig);
      }
    } catch (error) {
      console.warn('Could not load saved config:', error);
    }

    return defaultConfig;
  }

  /**
   * Объединяет конфигурации
   */
  mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };
    
    for (const [key, value] of Object.entries(userConfig)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = this.mergeConfig(merged[key] || {}, value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Получает конфигурацию
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Получает секцию конфигурации
   */
  getSection(section) {
    return this.config[section] ? { ...this.config[section] } : null;
  }

  /**
   * Получает значение конфигурации
   */
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

  /**
   * Устанавливает значение конфигурации
   */
  set(key, value) {
    const keys = key.split('.');
    const config = { ...this.config };
    let current = config;
    
    // Проходим по всем ключам кроме последнего
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    // Устанавливаем значение
    current[keys[keys.length - 1]] = value;
    
    this.config = config;
    this.saveConfig();
    this.notifySubscribers();
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(updates) {
    this.config = this.mergeConfig(this.config, updates);
    this.saveConfig();
    this.notifySubscribers();
  }

  /**
   * Сбрасывает конфигурацию к значениям по умолчанию
   */
  resetConfig() {
    this.config = this.loadConfig();
    this.saveConfig();
    this.notifySubscribers();
  }

  /**
   * Сохраняет конфигурацию в localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem('app_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Could not save config to localStorage:', error);
    }
  }

  /**
   * Подписывается на изменения конфигурации
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Уведомляет подписчиков об изменениях
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.warn('Error in config subscriber:', error);
      }
    });
  }

  /**
   * Получает конфигурацию API
   */
  getApiConfig() {
    return this.getSection('api');
  }

  /**
   * Получает конфигурацию хранилища
   */
  getStorageConfig() {
    return this.getSection('storage');
  }

  /**
   * Получает провайдера хранилища по умолчанию
   */
  getDefaultStorageProvider() {
    return this.get('storage.defaultProvider', 'd_id');
  }

  /**
   * Проверяет, включен ли D-ID провайдер
   */
  isDIdEnabled() {
    return this.get('storage.dId.enabled', true);
  }

  /**
   * Проверяет, включен ли Cloudinary провайдер
   */
  isCloudinaryEnabled() {
    return this.get('storage.cloudinary.enabled', true);
  }

  /**
   * Получает максимальный размер файла для D-ID
   */
  getDIdMaxFileSize() {
    return this.get('storage.dId.maxFileSize', 10 * 1024 * 1024);
  }

  /**
   * Получает поддерживаемые типы изображений для D-ID
   */
  getDIdSupportedImageTypes() {
    return this.get('storage.dId.supportedImageTypes', ['image/jpeg', 'image/png']);
  }

  /**
   * Получает поддерживаемые типы аудио для D-ID
   */
  getDIdSupportedAudioTypes() {
    return this.get('storage.dId.supportedAudioTypes', ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']);
  }

  /**
   * Получает конфигурацию стриминга
   */
  getStreamingConfig() {
    return this.getSection('streaming');
  }

  /**
   * Получает конфигурацию аудио
   */
  getAudioConfig() {
    return this.getSection('audio');
  }

  /**
   * Получает конфигурацию WebRTC
   */
  getWebRtcConfig() {
    return this.getSection('webrtc');
  }

  /**
   * Получает конфигурацию логирования
   */
  getLoggingConfig() {
    return this.getSection('logging');
  }

  /**
   * Получает конфигурацию функций
   */
  getFeaturesConfig() {
    return this.getSection('features');
  }

  /**
   * Проверяет, включена ли функция
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * Экспортирует конфигурацию
   */
  exportConfig() {
    return {
      config: this.config,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Импортирует конфигурацию
   */
  importConfig(configData) {
    if (configData && configData.config) {
      this.updateConfig(configData.config);
      return true;
    }
    return false;
  }
}

// Создаем глобальный экземпляр менеджера конфигурации
export const configManager = new ConfigManager();

// Экспортируем удобные функции
export const getConfig = () => configManager.getConfig();
export const getSection = (section) => configManager.getSection(section);
export const get = (key, defaultValue) => configManager.get(key, defaultValue);
export const set = (key, value) => configManager.set(key, value);
export const updateConfig = (updates) => configManager.updateConfig(updates);
export const subscribe = (callback) => configManager.subscribe(callback);
export const isFeatureEnabled = (feature) => configManager.isFeatureEnabled(feature);
