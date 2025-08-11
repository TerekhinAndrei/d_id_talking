/**
 * Интерфейс для API клиента
 * Определяет контракт для работы с HTTP API
 */
export class IApiClient {
  /**
   * Выполняет HTTP запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [options] - Опции запроса
   * @param {string} [options.method] - HTTP метод
   * @param {Object} [options.headers] - Заголовки запроса
   * @param {Object|string} [options.body] - Тело запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async request(endpoint, options = {}) {
    throw new Error('request method must be implemented');
  }

  /**
   * Выполняет GET запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async get(endpoint, headers = {}) {
    throw new Error('get method must be implemented');
  }

  /**
   * Выполняет POST запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object|string} [body] - Тело запроса
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async post(endpoint, body = null, headers = {}) {
    throw new Error('post method must be implemented');
  }

  /**
   * Выполняет PUT запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object|string} [body] - Тело запроса
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async put(endpoint, body = null, headers = {}) {
    throw new Error('put method must be implemented');
  }

  /**
   * Выполняет DELETE запрос
   * @param {string} endpoint - Конечная точка API
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async delete(endpoint, headers = {}) {
    throw new Error('delete method must be implemented');
  }

  /**
   * Загружает файл
   * @param {string} endpoint - Конечная точка API
   * @param {FormData} formData - Данные формы с файлом
   * @param {Object} [headers] - Заголовки запроса
   * @returns {Promise<Object>} Ответ от API
   */
  async uploadFile(endpoint, formData, headers = {}) {
    throw new Error('uploadFile method must be implemented');
  }

  /**
   * Устанавливает базовый URL для API
   * @param {string} baseUrl - Базовый URL
   */
  setBaseUrl(baseUrl) {
    throw new Error('setBaseUrl method must be implemented');
  }

  /**
   * Устанавливает заголовки по умолчанию
   * @param {Object} headers - Заголовки по умолчанию
   */
  setDefaultHeaders(headers) {
    throw new Error('setDefaultHeaders method must be implemented');
  }

  /**
   * Добавляет обработчик ошибок
   * @param {Function} errorHandler - Обработчик ошибок
   */
  addErrorHandler(errorHandler) {
    throw new Error('addErrorHandler method must be implemented');
  }

  /**
   * Добавляет обработчик запросов
   * @param {Function} requestHandler - Обработчик запросов
   */
  addRequestHandler(requestHandler) {
    throw new Error('addRequestHandler method must be implemented');
  }

  /**
   * Добавляет обработчик ответов
   * @param {Function} responseHandler - Обработчик ответов
   */
  addResponseHandler(responseHandler) {
    throw new Error('addResponseHandler method must be implemented');
  }
}
