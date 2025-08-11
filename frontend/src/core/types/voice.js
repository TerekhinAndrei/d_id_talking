/**
 * Типы для работы с голосами
 */

/**
 * Голос
 * @typedef {Object} Voice
 * @property {string} voice_id - Уникальный ID голоса
 * @property {string} name - Название голоса
 * @property {string} description - Описание голоса
 * @property {string} [language] - Язык голоса
 * @property {string} [gender] - Пол голоса ('male' | 'female')
 * @property {Object} [settings] - Настройки голоса
 */

/**
 * Настройки голоса
 * @typedef {Object} VoiceSettings
 * @property {number} [stability] - Стабильность (0-1)
 * @property {number} [similarity_boost] - Усиление сходства (0-1)
 * @property {number} [style] - Стиль (0-1)
 * @property {boolean} [use_speaker_boost] - Использовать усиление динамика
 */

/**
 * Результат генерации аудио
 * @typedef {Object} AudioResult
 * @property {boolean} success - Успешность операции
 * @property {string} audio_data - Аудио данные в base64
 * @property {string} format - Формат аудио ('mp3', 'wav', etc.)
 * @property {number} sample_rate - Частота дискретизации
 * @property {string} bitrate - Битрейт
 * @property {string} [error] - Ошибка
 */

/**
 * Состояние голосов
 * @typedef {Object} VoiceState
 * @property {Array<Voice>} voices - Список голосов
 * @property {string|null} selectedVoice - Выбранный голос
 * @property {boolean} loading - Загружаются ли голоса
 * @property {string|null} error - Ошибка
 * @property {boolean} isPlaying - Воспроизводится ли голос
 * @property {boolean} isProcessing - Обрабатывается ли запрос
 */

/**
 * Провайдер голоса
 * @typedef {Object} VoiceProvider
 * @property {string} type - Тип провайдера ('elevenlabs' | 'microsoft' | 'custom')
 * @property {string} voice_id - ID голоса
 * @property {Object} [settings] - Настройки провайдера
 */

/**
 * Конфигурация TTS
 * @typedef {Object} TtsConfig
 * @property {string} text - Текст для озвучивания
 * @property {string} voice_id - ID голоса
 * @property {VoiceSettings} [voice_settings] - Настройки голоса
 * @property {string} [model_id] - ID модели
 */

/**
 * Конфигурация STS
 * @typedef {Object} StsConfig
 * @property {File} audio_file - Аудио файл
 * @property {string} voice_id - ID голоса
 * @property {VoiceSettings} [voice_settings] - Настройки голоса
 * @property {string} [model_id] - ID модели
 * @property {string} [format] - Формат аудио
 */

export {
  // Экспортируем типы для использования в JSDoc
};
