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
}

// Создаем единственный экземпляр
const configManager = new ConfigManager();

export default configManager;
