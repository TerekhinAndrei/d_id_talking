/**
 * Интерфейс для сервиса стриминга
 * Определяет контракт для работы с различными провайдерами стриминга
 */
export class IStreamingService {
  /**
   * Создает новый стрим
   * @param {Object} config - Конфигурация стрима
   * @param {string} config.imageUrl - URL изображения для аватара
   * @param {string} [config.description] - Описание стрима
   * @param {Object} [config.config] - Дополнительная конфигурация
   * @returns {Promise<Object>} Результат создания стрима
   */
  async createStream(config) {
    throw new Error('createStream method must be implemented');
  }

  /**
   * Запускает стрим с WebRTC
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {string} sdpAnswer - SDP ответ
   * @returns {Promise<Object>} Результат запуска стрима
   */
  async startStream(streamId, sessionId, sdpAnswer) {
    throw new Error('startStream method must be implemented');
  }

  /**
   * Отправляет ICE кандидата
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {string} candidate - ICE кандидат
   * @param {string} sdpMid - SDP MID
   * @param {number} sdpMLineIndex - SDP MLINE индекс
   * @returns {Promise<Object>} Результат отправки
   */
  async submitIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex) {
    throw new Error('submitIceCandidate method must be implemented');
  }

  /**
   * Создает talk стрим
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {Object} script - Скрипт для озвучивания
   * @returns {Promise<Object>} Результат создания talk
   */
  async createTalk(streamId, sessionId, script) {
    throw new Error('createTalk method must be implemented');
  }

  /**
   * Создает talk стрим с аудио
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {string} audioUrl - URL аудио файла
   * @param {string} voiceId - ID голоса
   * @returns {Promise<Object>} Результат создания talk с аудио
   */
  async createTalkAudio(streamId, sessionId, audioUrl, voiceId) {
    throw new Error('createTalkAudio method must be implemented');
  }

  /**
   * Закрывает стрим
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @returns {Promise<Object>} Результат закрытия стрима
   */
  async closeStream(streamId, sessionId) {
    throw new Error('closeStream method must be implemented');
  }

  /**
   * Получает статус стрима
   * @param {string} streamId - ID стрима
   * @returns {Promise<Object>} Статус стрима
   */
  async getStreamStatus(streamId) {
    throw new Error('getStreamStatus method must be implemented');
  }
}
