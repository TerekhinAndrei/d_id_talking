/**
 * Унифицированный логгер для устранения дубликатов логирования
 */
export class Logger {
  static levels = {
    INFO: 'info',
    ERROR: 'error',
    WARN: 'warn',
    DEBUG: 'debug'
  };

  /**
   * Основной метод логирования
   * @param {string} level - Уровень логирования
   * @param {string} message - Сообщение
   * @param {any} data - Дополнительные данные
   */
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case this.levels.INFO:
        console.log(logMessage, data || '');
        break;
      case this.levels.ERROR:
        console.error(logMessage, data || '');
        break;
      case this.levels.WARN:
        console.warn(logMessage, data || '');
        break;
      case this.levels.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, data || '');
        }
        break;
      default:
        console.log(logMessage, data || '');
    }
  }

  /**
   * Логирование информационных сообщений
   */
  static info(message, data = null) {
    this.log(this.levels.INFO, message, data);
  }

  /**
   * Логирование ошибок
   */
  static error(message, data = null) {
    this.log(this.levels.ERROR, message, data);
  }

  /**
   * Логирование предупреждений
   */
  static warn(message, data = null) {
    this.log(this.levels.WARN, message, data);
  }

  /**
   * Логирование отладочной информации
   */
  static debug(message, data = null) {
    this.log(this.levels.DEBUG, message, data);
  }

  /**
   * Логирование API запросов
   */
  static apiRequest(url, config = null) {
    this.info(`🌐 API Request: ${url}`, config);
  }

  /**
   * Логирование API ответов
   */
  static apiResponse(endpoint, data = null) {
    this.info(`✅ API Response (${endpoint}):`, data);
  }

  /**
   * Логирование API ошибок
   */
  static apiError(endpoint, error = null) {
    this.error(`❌ API Error (${endpoint}):`, error);
  }

  /**
   * Логирование состояния компонентов
   */
  static componentState(componentName, state) {
    this.debug(`🔄 ${componentName} state:`, state);
  }

  /**
   * Логирование хуков
   */
  static hook(hookName, action, data = null) {
    this.debug(`🎣 ${hookName}: ${action}`, data);
  }

  /**
   * Логирование сервисов
   */
  static service(serviceName, action, data = null) {
    this.debug(`🔧 ${serviceName}: ${action}`, data);
  }

  /**
   * Логирование файловых операций
   */
  static fileOperation(operation, fileName, data = null) {
    this.info(`📁 File ${operation}: ${fileName}`, data);
  }

  /**
   * Логирование аудио операций
   */
  static audioOperation(operation, data = null) {
    this.debug(`🎵 Audio ${operation}:`, data);
  }

  /**
   * Логирование WebSocket операций
   */
  static websocket(operation, data = null) {
    this.debug(`🔌 WebSocket ${operation}:`, data);
  }
}
