/**
 * Интерфейс для сервиса голосов
 * Определяет контракт для работы с различными провайдерами TTS
 */
export class IVoiceService {
  /**
   * Получает список доступных голосов
   * @returns {Promise<Array>} Массив голосов
   */
  async getVoices() {
    throw new Error('getVoices method must be implemented');
  }

  /**
   * Получает информацию о конкретном голосе
   * @param {string} voiceId - ID голоса
   * @returns {Promise<Object>} Информация о голосе
   */
  async getVoice(voiceId) {
    throw new Error('getVoice method must be implemented');
  }

  /**
   * Проверяет валидность голоса
   * @param {string} voiceId - ID голоса
   * @returns {Promise<boolean>} Результат проверки
   */
  async validateVoice(voiceId) {
    throw new Error('validateVoice method must be implemented');
  }

  /**
   * Генерирует речь из текста
   * @param {string} text - Текст для озвучивания
   * @param {string} voiceId - ID голоса
   * @param {Object} [settings] - Настройки голоса
   * @returns {Promise<Object>} Результат генерации
   */
  async textToSpeech(text, voiceId, settings = null) {
    throw new Error('textToSpeech method must be implemented');
  }

  /**
   * Преобразует речь в речь (STS)
   * @param {File} audioFile - Аудио файл
   * @param {string} voiceId - ID голоса
   * @param {Object} [settings] - Настройки голоса
   * @returns {Promise<Object>} Результат преобразования
   */
  async speechToSpeech(audioFile, voiceId, settings = null) {
    throw new Error('speechToSpeech method must be implemented');
  }

  /**
   * Воспроизводит предварительный просмотр голоса
   * @param {string} voiceId - ID голоса
   * @param {string} [previewText] - Текст для предварительного просмотра
   * @returns {Promise<Object>} Результат воспроизведения
   */
  async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
    throw new Error('playVoice method must be implemented');
  }

  /**
   * Тестирует аутентификацию с провайдером
   * @returns {Promise<Object>} Результат тестирования
   */
  async testAuth() {
    throw new Error('testAuth method must be implemented');
  }
}
