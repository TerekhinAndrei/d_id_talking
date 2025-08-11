/**
 * Утилиты для генерации уникальных ключей
 */

/**
 * Генерирует уникальный ключ на основе данных элемента
 * @param {string} prefix - Префикс для ключа
 * @param {any} item - Элемент данных
 * @param {number} index - Индекс элемента
 * @param {string} idField - Поле для ID (по умолчанию 'id')
 * @param {string} timestampField - Поле для временной метки (по умолчанию 'timestamp')
 * @returns {string} Уникальный ключ
 */
export const generateKey = (prefix, item, index, idField = 'id', timestampField = 'timestamp') => {
  const id = item[idField] || item.id || index;
  const timestamp = item[timestampField] || item.timestamp || Date.now();
  
  return `${prefix}-${id}-${timestamp}`;
};

/**
 * Генерирует ключ для логов
 * @param {Object} log - Объект лога
 * @param {number} index - Индекс лога
 * @param {string} prefix - Префикс (по умолчанию 'log')
 * @returns {string} Уникальный ключ для лога
 */
export const generateLogKey = (log, index, prefix = 'log') => {
  return generateKey(prefix, log, index, 'id', 'timestamp');
};

/**
 * Генерирует ключ для файлов
 * @param {Object} file - Объект файла
 * @param {number} index - Индекс файла
 * @param {string} prefix - Префикс (по умолчанию 'file')
 * @returns {string} Уникальный ключ для файла
 */
export const generateFileKey = (file, index, prefix = 'file') => {
  return generateKey(prefix, file, index, 'id', 'timestamp');
};

/**
 * Генерирует ключ для чанков
 * @param {Object} chunk - Объект чанка
 * @param {number} index - Индекс чанка
 * @param {string} prefix - Префикс (по умолчанию 'chunk')
 * @returns {string} Уникальный ключ для чанка
 */
export const generateChunkKey = (chunk, index, prefix = 'chunk') => {
  return generateKey(prefix, chunk, index, 'id', 'timestamp');
};

/**
 * Генерирует ключ для элементов списка
 * @param {any} item - Элемент списка
 * @param {number} index - Индекс элемента
 * @param {string} prefix - Префикс
 * @returns {string} Уникальный ключ
 */
export const generateListItemKey = (item, index, prefix) => {
  if (typeof item === 'string') {
    return `${prefix}-${item}-${index}`;
  }
  
  if (typeof item === 'object' && item !== null) {
    return generateKey(prefix, item, index);
  }
  
  return `${prefix}-${index}`;
};

/**
 * Создает функцию для генерации ключей для map
 * @param {string} prefix - Префикс для ключей
 * @param {string} idField - Поле для ID
 * @param {string} timestampField - Поле для временной метки
 * @returns {Function} Функция для генерации ключей
 */
export const createKeyGenerator = (prefix, idField = 'id', timestampField = 'timestamp') => {
  return (item, index) => generateKey(prefix, item, index, idField, timestampField);
};

/**
 * Создает функцию для генерации ключей логов
 * @param {string} prefix - Префикс для ключей логов
 * @returns {Function} Функция для генерации ключей логов
 */
export const createLogKeyGenerator = (prefix = 'log') => {
  return (log, index) => generateLogKey(log, index, prefix);
};

/**
 * Создает функцию для генерации ключей файлов
 * @param {string} prefix - Префикс для ключей файлов
 * @returns {Function} Функция для генерации ключей файлов
 */
export const createFileKeyGenerator = (prefix = 'file') => {
  return (file, index) => generateFileKey(file, index, prefix);
};

/**
 * Создает функцию для генерации ключей чанков
 * @param {string} prefix - Префикс для ключей чанков
 * @returns {Function} Функция для генерации ключей чанков
 */
export const createChunkKeyGenerator = (prefix = 'chunk') => {
  return (chunk, index) => generateChunkKey(chunk, index, prefix);
};
