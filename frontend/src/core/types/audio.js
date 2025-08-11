/**
 * Типы для работы с аудио
 */

/**
 * Аудио данные
 * @typedef {Object} AudioData
 * @property {ArrayBuffer} data - Аудио данные
 * @property {string} format - Формат аудио ('mp3', 'wav', 'webm', etc.)
 * @property {number} sampleRate - Частота дискретизации
 * @property {number} channels - Количество каналов
 * @property {number} duration - Длительность в секундах
 * @property {number} size - Размер в байтах
 */

/**
 * Обработанные аудио данные
 * @typedef {Object} ProcessedAudio
 * @property {AudioData} data - Аудио данные
 * @property {number} duration - Длительность в секундах
 * @property {number} size - Размер в байтах
 * @property {Object} [metadata] - Метаданные
 */

/**
 * Опции записи аудио
 * @typedef {Object} AudioRecordingOptions
 * @property {number} [sampleRate] - Частота дискретизации (по умолчанию 48000)
 * @property {number} [channels] - Количество каналов (по умолчанию 1)
 * @property {boolean} [echoCancellation] - Отмена эха (по умолчанию true)
 * @property {boolean} [noiseSuppression] - Подавление шума (по умолчанию true)
 * @property {boolean} [autoGainControl] - Автоматическое управление усилением (по умолчанию true)
 */

/**
 * Опции обработки аудио
 * @typedef {Object} AudioProcessingOptions
 * @property {string} [targetFormat] - Целевой формат
 * @property {number} [targetSampleRate] - Целевая частота дискретизации
 * @property {number} [targetChannels] - Целевое количество каналов
 * @property {boolean} [normalize] - Нормализация громкости
 * @property {number} [volume] - Громкость (0-1)
 */

/**
 * Аудио чанк
 * @typedef {Object} AudioChunk
 * @property {ArrayBuffer} data - Данные чанка
 * @property {number} timestamp - Временная метка
 * @property {number} duration - Длительность в мс
 * @property {boolean} hasSpeech - Содержит ли речь
 */

/**
 * Информация об аудио файле
 * @typedef {Object} AudioInfo
 * @property {string} format - Формат файла
 * @property {number} sampleRate - Частота дискретизации
 * @property {number} channels - Количество каналов
 * @property {number} duration - Длительность в секундах
 * @property {number} size - Размер в байтах
 * @property {string} [codec] - Кодек
 * @property {number} [bitrate] - Битрейт
 */

/**
 * Результат воспроизведения аудио
 * @typedef {Object} PlaybackResult
 * @property {boolean} success - Успешность операции
 * @property {string} [message] - Сообщение
 * @property {boolean} [canRetry] - Можно ли повторить
 * @property {string} [error] - Ошибка
 */

/**
 * Состояние аудио
 * @typedef {Object} AudioState
 * @property {boolean} isRecording - Записывается ли аудио
 * @property {boolean} isPlaying - Воспроизводится ли аудио
 * @property {boolean} isProcessing - Обрабатывается ли аудио
 * @property {MediaStream|null} stream - Аудио поток
 * @property {AudioData|null} currentAudio - Текущие аудио данные
 * @property {string|null} error - Ошибка
 * @property {Array<AudioChunk>} chunks - Аудио чанки
 * @property {number} totalChunks - Общее количество чанков
 * @property {number} speechDetected - Количество чанков с речью
 * @property {number} silenceDetected - Количество тихих чанков
 */

/**
 * Конфигурация аудио
 * @typedef {Object} AudioConfig
 * @property {number} chunkDuration - Длительность чанка в мс
 * @property {number} sampleRate - Частота дискретизации
 * @property {number} channels - Количество каналов
 * @property {string} format - Формат аудио
 * @property {boolean} enableSpeechDetection - Включить определение речи
 * @property {number} silenceThreshold - Порог тишины
 */

export {
  // Экспортируем типы для использования в JSDoc
};
