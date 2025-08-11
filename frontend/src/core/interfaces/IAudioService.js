/**
 * Интерфейс для сервиса аудио
 * Определяет контракт для работы с аудио данными
 */
export class IAudioService {
  /**
   * Записывает аудио с микрофона
   * @param {Object} [options] - Опции записи
   * @param {number} [options.sampleRate] - Частота дискретизации
   * @param {number} [options.channels] - Количество каналов
   * @returns {Promise<MediaStream>} Аудио поток
   */
  async recordAudio(options = {}) {
    throw new Error('recordAudio method must be implemented');
  }

  /**
   * Останавливает запись аудио
   * @param {MediaStream} stream - Аудио поток для остановки
   */
  stopRecording(stream) {
    throw new Error('stopRecording method must be implemented');
  }

  /**
   * Обрабатывает аудио данные
   * @param {ArrayBuffer} audioData - Аудио данные
   * @param {Object} [options] - Опции обработки
   * @returns {Promise<Object>} Обработанные аудио данные
   */
  async processAudio(audioData, options = {}) {
    throw new Error('processAudio method must be implemented');
  }

  /**
   * Воспроизводит аудио
   * @param {string|ArrayBuffer} audioData - Аудио данные
   * @param {string} [format] - Формат аудио
   * @returns {Promise<Object>} Результат воспроизведения
   */
  async playAudio(audioData, format = 'mp3') {
    throw new Error('playAudio method must be implemented');
  }

  /**
   * Останавливает воспроизведение
   */
  stopPlayback() {
    throw new Error('stopPlayback method must be implemented');
  }

  /**
   * Конвертирует аудио в другой формат
   * @param {ArrayBuffer} audioData - Исходные аудио данные
   * @param {string} fromFormat - Исходный формат
   * @param {string} toFormat - Целевой формат
   * @returns {Promise<ArrayBuffer>} Конвертированные данные
   */
  async convertFormat(audioData, fromFormat, toFormat) {
    throw new Error('convertFormat method must be implemented');
  }

  /**
   * Создает аудио чанки для стриминга
   * @param {MediaStream} stream - Аудио поток
   * @param {number} chunkDuration - Длительность чанка в мс
   * @returns {AsyncGenerator<ArrayBuffer>} Генератор аудио чанков
   */
  async *createAudioChunks(stream, chunkDuration = 2000) {
    throw new Error('createAudioChunks method must be implemented');
  }

  /**
   * Определяет наличие речи в аудио
   * @param {ArrayBuffer} audioData - Аудио данные
   * @returns {Promise<boolean>} Наличие речи
   */
  async detectSpeech(audioData) {
    throw new Error('detectSpeech method must be implemented');
  }

  /**
   * Получает информацию об аудио файле
   * @param {File|ArrayBuffer} audioData - Аудио данные
   * @returns {Promise<Object>} Информация об аудио
   */
  async getAudioInfo(audioData) {
    throw new Error('getAudioInfo method must be implemented');
  }
}
