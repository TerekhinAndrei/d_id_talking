import { IApiClient } from '../../core/interfaces/IApiClient.js';

/**
 * Реализация API клиента на основе fetch
 */
export class FetchApiClient extends IApiClient {
  constructor(baseUrl = '/api/v1') {
    super();
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    this.errorHandlers = [];
    this.requestHandlers = [];
    this.responseHandlers = [];
  }

  /**
   * Выполняет HTTP запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [options] - Опции запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Вызываем обработчики запросов
    this.requestHandlers.forEach(handler => {
      try {
        handler(url, config);
      } catch (error) {
        console.warn('Request handler error:', error);
      }
    });

    try {
      console.log(`🌐 API Request: ${url}`, config);
      const response = await fetch(url, config);
      
      console.log(`📡 API Response status: ${response.status}`);
      
      // Вызываем обработчики ответов
      this.responseHandlers.forEach(handler => {
        try {
          handler(response);
        } catch (error) {
          console.warn('Response handler error:', error);
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error (${endpoint}):`, errorData);
        
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        
        // Вызываем обработчики ошибок
        this.errorHandlers.forEach(handler => {
          try {
            handler(error, endpoint, config);
          } catch (handlerError) {
            console.warn('Error handler error:', handlerError);
          }
        });
        
        throw error;
      }
      
      const data = await response.json();
      console.log(`✅ API Response (${endpoint}):`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      
      // Вызываем обработчики ошибок
      this.errorHandlers.forEach(handler => {
        try {
          handler(error, endpoint, config);
        } catch (handlerError) {
          console.warn('Error handler error:', handlerError);
        }
      });
      
      throw error;
    }
  }

  /**
   * Выполняет GET запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async get(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'GET',
      headers
    });
  }

  /**
   * Выполняет POST запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object|string} [body] - Тело запроса
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async post(endpoint, body = null, headers = {}) {
    const config = {
      method: 'POST',
      headers
    };

    if (body !== null) {
      if (body instanceof FormData) {
        // Для FormData не устанавливаем Content-Type, браузер сам установит
        delete config.headers['Content-Type'];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    return this.request(endpoint, config);
  }

  /**
   * Выполняет PUT запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object|string} [body] - Тело запроса
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async put(endpoint, body = null, headers = {}) {
    const config = {
      method: 'PUT',
      headers
    };

    if (body !== null) {
      config.body = JSON.stringify(body);
    }

    return this.request(endpoint, config);
  }

  /**
   * Выполняет DELETE запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers
    });
  }

  /**
   * Загружает файл
   * @param {string} endpoint - Конечная точка API
   * @param {FormData} formData - Данные формы с файлом
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async uploadFile(endpoint, formData, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        // Не устанавливаем Content-Type для FormData
      },
      body: formData
    });
  }

  /**
   * Устанавливает базовый URL для API
   * @param {string} baseUrl - Базовый URL
   */
  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Устанавливает заголовки по умолчанию
   * @param {Object} headers - Заголовки по умолчанию
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers
    };
  }

  /**
   * Добавляет обработчик ошибок
   * @param {Function} errorHandler - Обработчик ошибок
   */
  addErrorHandler(errorHandler) {
    this.errorHandlers.push(errorHandler);
  }

  /**
   * Добавляет обработчик запросов
   * @param {Function} requestHandler - Обработчик запросов
   */
  addRequestHandler(requestHandler) {
    this.requestHandlers.push(requestHandler);
  }

  /**
   * Добавляет обработчик ответов
   * @param {Function} responseHandler - Обработчик ответов
   */
  addResponseHandler(responseHandler) {
    this.responseHandlers.push(responseHandler);
  }
}
