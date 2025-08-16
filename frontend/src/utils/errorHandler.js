import { Logger } from './Logger.js';

/**
 * Унифицированный обработчик ошибок
 * Устраняет дубликаты обработки ошибок в различных частях приложения
 */
export class ErrorHandler {
  static errorTypes = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    SERVER: 'server',
    UNKNOWN: 'unknown'
  };

  /**
   * Обработка ошибки с классификацией
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст ошибки
   * @returns {Object} Обработанная ошибка
   */
  static handle(error, context = '') {
    Logger.error(`Error in ${context}:`, error);

    const errorInfo = this.classifyError(error);
    const userMessage = this.getUserMessage(errorInfo);
    
    return {
      ...errorInfo,
      userMessage,
      context,
      timestamp: new Date().toISOString(),
      originalError: error
    };
  }

  /**
   * Классификация ошибки по типу
   * @param {Error} error - Ошибка для классификации
   * @returns {Object} Информация об ошибке
   */
  static classifyError(error) {
    // Сетевые ошибки
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: this.errorTypes.NETWORK,
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        severity: 'high'
      };
    }

    if (error.name === 'NetworkError') {
      return {
        type: this.errorTypes.NETWORK,
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        severity: 'high'
      };
    }

    // HTTP ошибки
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            type: this.errorTypes.VALIDATION,
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            severity: 'medium'
          };
        case 401:
          return {
            type: this.errorTypes.AUTHENTICATION,
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            severity: 'high'
          };
        case 403:
          return {
            type: this.errorTypes.AUTHORIZATION,
            code: 'FORBIDDEN',
            message: 'Access denied',
            severity: 'high'
          };
        case 404:
          return {
            type: this.errorTypes.NOT_FOUND,
            code: 'NOT_FOUND',
            message: 'Resource not found',
            severity: 'medium'
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: this.errorTypes.SERVER,
            code: 'SERVER_ERROR',
            message: 'Server error occurred',
            severity: 'high'
          };
        default:
          return {
            type: this.errorTypes.SERVER,
            code: 'HTTP_ERROR',
            message: `HTTP error ${error.status}`,
            severity: 'medium'
          };
      }
    }

    // Ошибки валидации
    if (error.name === 'ValidationError') {
      return {
        type: this.errorTypes.VALIDATION,
        code: 'VALIDATION_ERROR',
        message: error.message,
        severity: 'medium'
      };
    }

    // Ошибки файлов
    if (error.message && error.message.includes('file')) {
      return {
        type: this.errorTypes.VALIDATION,
        code: 'FILE_ERROR',
        message: 'File operation failed',
        severity: 'medium'
      };
    }

    // Ошибки аудио
    if (error.message && error.message.includes('audio')) {
      return {
        type: this.errorTypes.VALIDATION,
        code: 'AUDIO_ERROR',
        message: 'Audio operation failed',
        severity: 'medium'
      };
    }

    // Неизвестные ошибки
    return {
      type: this.errorTypes.UNKNOWN,
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      severity: 'medium'
    };
  }

  /**
   * Получение пользовательского сообщения об ошибке
   * @param {Object} errorInfo - Информация об ошибке
   * @returns {string} Пользовательское сообщение
   */
  static getUserMessage(errorInfo) {
    const messages = {
      [this.errorTypes.NETWORK]: 'Проблема с сетевым подключением. Проверьте интернет-соединение.',
      [this.errorTypes.VALIDATION]: 'Некорректные данные. Проверьте введенную информацию.',
      [this.errorTypes.AUTHENTICATION]: 'Требуется авторизация. Войдите в систему.',
      [this.errorTypes.AUTHORIZATION]: 'Доступ запрещен. У вас нет прав для выполнения этого действия.',
      [this.errorTypes.NOT_FOUND]: 'Ресурс не найден. Проверьте правильность ссылки.',
      [this.errorTypes.SERVER]: 'Ошибка сервера. Попробуйте позже.',
      [this.errorTypes.UNKNOWN]: 'Произошла неизвестная ошибка. Попробуйте еще раз.'
    };

    return messages[errorInfo.type] || errorInfo.message;
  }

  /**
   * Обработка API ошибок
   * @param {Response} response - HTTP ответ
   * @param {string} endpoint - Эндпоинт API
   * @returns {Promise<Object>} Обработанная ошибка
   */
  static async handleApiError(response, endpoint) {
    try {
      const errorData = await response.json().catch(() => ({}));
      
      const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.endpoint = endpoint;
      error.responseData = errorData;

      return this.handle(error, `API ${endpoint}`);
    } catch (parseError) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.endpoint = endpoint;

      return this.handle(error, `API ${endpoint}`);
    }
  }

  /**
   * Обработка ошибок валидации
   * @param {Object} validationErrors - Ошибки валидации
   * @param {string} field - Поле с ошибкой
   * @returns {Object} Обработанная ошибка
   */
  static handleValidationError(validationErrors, field = '') {
    const error = new Error(`Validation error for ${field}: ${validationErrors.join(', ')}`);
    error.name = 'ValidationError';
    error.field = field;
    error.validationErrors = validationErrors;

    return this.handle(error, `Validation ${field}`);
  }

  /**
   * Обработка ошибок файлов
   * @param {Error} error - Ошибка файла
   * @param {string} operation - Операция с файлом
   * @returns {Object} Обработанная ошибка
   */
  static handleFileError(error, operation = '') {
    const fileError = new Error(`File ${operation} failed: ${error.message}`);
    fileError.name = 'FileError';
    fileError.operation = operation;
    fileError.originalError = error;

    return this.handle(fileError, `File ${operation}`);
  }

  /**
   * Обработка ошибок аудио
   * @param {Error} error - Ошибка аудио
   * @param {string} operation - Операция с аудио
   * @returns {Object} Обработанная ошибка
   */
  static handleAudioError(error, operation = '') {
    const audioError = new Error(`Audio ${operation} failed: ${error.message}`);
    audioError.name = 'AudioError';
    audioError.operation = operation;
    audioError.originalError = error;

    return this.handle(audioError, `Audio ${operation}`);
  }

  /**
   * Проверка, является ли ошибка критической
   * @param {Object} errorInfo - Информация об ошибке
   * @returns {boolean} Является ли ошибка критической
   */
  static isCriticalError(errorInfo) {
    return errorInfo.severity === 'high';
  }

  /**
   * Проверка, можно ли повторить операцию
   * @param {Object} errorInfo - Информация об ошибке
   * @returns {boolean} Можно ли повторить операцию
   */
  static canRetry(errorInfo) {
    const retryableTypes = [
      this.errorTypes.NETWORK,
      this.errorTypes.SERVER
    ];

    return retryableTypes.includes(errorInfo.type);
  }

  /**
   * Получение рекомендаций по исправлению ошибки
   * @param {Object} errorInfo - Информация об ошибке
   * @returns {Array<string>} Рекомендации
   */
  static getRecommendations(errorInfo) {
    const recommendations = {
      [this.errorTypes.NETWORK]: [
        'Проверьте интернет-соединение',
        'Попробуйте обновить страницу',
        'Проверьте настройки прокси'
      ],
      [this.errorTypes.VALIDATION]: [
        'Проверьте правильность введенных данных',
        'Убедитесь, что все обязательные поля заполнены',
        'Проверьте формат файлов'
      ],
      [this.errorTypes.AUTHENTICATION]: [
        'Войдите в систему заново',
        'Проверьте правильность учетных данных',
        'Очистите кэш браузера'
      ],
      [this.errorTypes.SERVER]: [
        'Попробуйте позже',
        'Обратитесь к администратору',
        'Проверьте статус сервиса'
      ]
    };

    return recommendations[errorInfo.type] || ['Попробуйте еще раз'];
  }
}
