// Типы для будущего перехода на TypeScript

/**
 * @typedef {Object} Voice
 * @property {string} voice_id - Уникальный идентификатор голоса
 * @property {string} name - Название голоса
 * @property {string} description - Описание голоса
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Статус успешности запроса
 * @property {any} data - Данные ответа
 * @property {string} [message] - Сообщение
 */

/**
 * @typedef {Object} StreamConfig
 * @property {File} image - Файл изображения
 * @property {string} voiceId - ID выбранного голоса
 * @property {Object} [options] - Дополнительные опции
 */

/**
 * @typedef {Object} ErrorState
 * @property {string} message - Сообщение об ошибке
 * @property {string} [code] - Код ошибки
 * @property {Function} [onRetry] - Функция повторной попытки
 */

// Примеры использования:
// const voice = /** @type {Voice} */ ({ voice_id: '123', name: 'Rachel', description: 'Female voice' });
// const response = /** @type {ApiResponse} */ await apiService.getVoices();
