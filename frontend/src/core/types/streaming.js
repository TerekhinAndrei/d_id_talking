/**
 * Типы для стриминга
 */

/**
 * Конфигурация стрима
 * @typedef {Object} StreamConfig
 * @property {string} imageUrl - URL изображения для аватара
 * @property {string} [description] - Описание стрима
 * @property {Object} [config] - Дополнительная конфигурация
 * @property {number} [config.output_resolution] - Разрешение выходного видео
 * @property {string} [config.quality] - Качество стрима
 */

/**
 * Результат создания стрима
 * @typedef {Object} StreamResult
 * @property {boolean} success - Успешность операции
 * @property {string} stream_id - ID стрима
 * @property {string} session_id - ID сессии
 * @property {string} sdp_offer - SDP предложение
 * @property {Array} ice_servers - ICE серверы
 * @property {string} [error] - Ошибка
 */

/**
 * Скрипт для озвучивания
 * @typedef {Object} TalkScript
 * @property {string} type - Тип скрипта ('text' | 'audio')
 * @property {string} input - Входные данные (текст или URL аудио)
 * @property {Object} provider - Провайдер голоса
 * @property {string} provider.type - Тип провайдера ('elevenlabs' | 'microsoft')
 * @property {string} provider.voice_id - ID голоса
 */

/**
 * Состояние стрима
 * @typedef {Object} StreamState
 * @property {boolean} isCreating - Создается ли стрим
 * @property {boolean} isConnected - Подключен ли стрим
 * @property {boolean} isActive - Активен ли стрим
 * @property {string|null} streamId - ID стрима
 * @property {string|null} sessionId - ID сессии
 * @property {string|null} sdpOffer - SDP предложение
 * @property {Array|null} iceServers - ICE серверы
 * @property {RTCPeerConnection|null} peerConnection - WebRTC соединение
 * @property {MediaStream|null} audioStream - Аудио поток
 * @property {MediaStream|null} videoStream - Видео поток
 * @property {string|null} error - Ошибка
 * @property {string} status - Статус ('idle' | 'creating' | 'connecting' | 'connected' | 'error')
 */

/**
 * WebRTC обработчики событий
 * @typedef {Object} WebRtcEventHandlers
 * @property {Function} [onIceCandidate] - Обработчик ICE кандидатов
 * @property {Function} [onIceConnectionStateChange] - Обработчик изменения состояния ICE
 * @property {Function} [onTrack] - Обработчик получения треков
 */

/**
 * ICE кандидат
 * @typedef {Object} IceCandidate
 * @property {string} candidate - ICE кандидат
 * @property {string} sdpMid - SDP MID
 * @property {number} sdpMLineIndex - SDP MLINE индекс
 */

/**
 * SDP ответ
 * @typedef {Object} SdpAnswer
 * @property {string} type - Тип SDP ('answer')
 * @property {string} sdp - SDP данные
 */

export {
  // Экспортируем типы для использования в JSDoc
};
