import { IStreamingService } from '../../core/interfaces/IStreamingService.js';

/**
 * Реализация сервиса стриминга для D-ID
 */
export class DIdStreamingService extends IStreamingService {
  constructor(apiClient) {
    super();
    this.apiClient = apiClient;
  }

  /**
   * Создает новый стрим
   * @param {Object} config - Конфигурация стрима
   * @param {string} config.imageUrl - URL изображения для аватара
   * @param {string} [config.description] - Описание стрима
   * @param {Object} [config.config] - Дополнительная конфигурация
   * @returns {Promise<Object>} Результат создания стрима
   */
  async createStream(config) {
    const { imageUrl, description = 'D-ID streaming session', config: streamConfig = null } = config;

    try {
      console.log('🎬 Creating D-ID stream with image:', imageUrl);
      
      // Проверяем доступность изображения
      await this.validateImageUrl(imageUrl);
      
      const requestBody = {
        image_url: imageUrl,
        description: description
      };

      if (streamConfig) {
        requestBody.config = streamConfig;
      } else {
        // Стандартная конфигурация
        requestBody.config = {
          output_resolution: 512
        };
      }

      const response = await this.apiClient.post('/streaming/start', requestBody);
      
      console.log('✅ Stream created successfully:', {
        streamId: response.stream_id,
        sessionId: response.session_id,
        hasSdpOffer: !!response.sdp_offer,
        hasIceServers: !!response.ice_servers
      });

      return {
        success: true,
        stream_id: response.stream_id,
        session_id: response.session_id,
        sdp_offer: response.sdp_offer,
        ice_servers: response.ice_servers
      };
    } catch (error) {
      console.error('❌ Error creating stream:', error);
      
      // Обрабатываем специфичные ошибки D-ID
      if (error.message.includes('Authentication failed')) {
        throw new Error('Ошибка подключения к D-ID API. Сервер не может подключиться к D-ID.');
      }
      
      if (error.message.includes('_create_session_if_needed')) {
        throw new Error('Бэкенд не полностью реализован. Некоторые методы D-ID API отсутствуют.');
      }
      
      if (error.message.includes('SDP exchange failed')) {
        throw new Error('D-ID API отклонил запрос. Проверьте формат данных.');
      }
      
      throw error;
    }
  }

  /**
   * Запускает стрим с WebRTC
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {string} sdpAnswer - SDP ответ
   * @returns {Promise<Object>} Результат запуска стрима
   */
  async startStream(streamId, sessionId, sdpAnswer) {
    try {
      console.log('🔗 Starting D-ID stream with WebRTC setup');
      
      const response = await this.apiClient.post(`/streaming/${streamId}/sdp`, {
        sdp_answer: sdpAnswer,
        session_id: sessionId
      });

      console.log('✅ Stream started successfully');
      
      return {
        success: true,
        session_id: response.session_id || sessionId
      };
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      
      if (error.message.includes('_create_session_if_needed')) {
        throw new Error('Бэкенд не полностью реализован. Метод SDP submission отсутствует.');
      }
      
      throw error;
    }
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
    try {
      console.log('🧊 Submitting ICE candidate');
      
      const response = await this.apiClient.post(`/streaming/${streamId}/ice`, {
        candidate: candidate,
        sdpMid: sdpMid,
        sdpMLineIndex: sdpMLineIndex,
        session_id: sessionId
      });

      console.log('✅ ICE candidate submitted');
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error submitting ICE candidate:', error);
      
      if (error.message.includes('_create_session_if_needed')) {
        throw new Error('Бэкенд не полностью реализован. Метод ICE submission отсутствует.');
      }
      
      throw error;
    }
  }

  /**
   * Создает talk стрим
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @param {Object} script - Скрипт для озвучивания
   * @returns {Promise<Object>} Результат создания talk
   */
  async createTalk(streamId, sessionId, script) {
    try {
      console.log('🎤 Creating talk stream');
      
      // Извлекаем текст из скрипта
      const text = typeof script === 'object' && script.input ? script.input : script;
      
      // Извлекаем voice_id из скрипта
      const voiceId = typeof script === 'object' && script.provider?.voice_id ? script.provider.voice_id : null;
      
      const response = await this.apiClient.post(`/streaming/${streamId}/talk`, {
        text: text,
        voice_id: voiceId,
        session_id: sessionId
      });

      console.log('✅ Talk stream created successfully');
      
      return {
        success: true,
        talk_id: response.talk_id
      };
    } catch (error) {
      console.error('❌ Error creating talk:', error);
      throw error;
    }
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
    try {
      console.log('🎵 Creating talk stream with audio');
      
      const response = await this.apiClient.post(`/streaming/${streamId}/talk-audio`, {
        text: audioUrl, // Используем text поле для передачи URL аудио
        voice_id: voiceId,
        session_id: sessionId
      });

      console.log('✅ Talk stream with audio created successfully');
      
      return {
        success: true,
        talk_id: response.talk_id
      };
    } catch (error) {
      console.error('❌ Error creating talk with audio:', error);
      throw error;
    }
  }

  /**
   * Закрывает стрим
   * @param {string} streamId - ID стрима
   * @param {string} sessionId - ID сессии
   * @returns {Promise<Object>} Результат закрытия стрима
   */
  async closeStream(streamId, sessionId) {
    try {
      console.log('🔚 Closing D-ID stream');
      
      const response = await this.apiClient.delete(`/streaming/${streamId}`, {
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      console.log('✅ Stream closed successfully');
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error closing stream:', error);
      throw error;
    }
  }

  /**
   * Получает статус стрима
   * @param {string} streamId - ID стрима
   * @returns {Promise<Object>} Статус стрима
   */
  async getStreamStatus(streamId) {
    try {
      console.log('📊 Getting stream status');
      
      const response = await this.apiClient.get(`/streaming/${streamId}/status`);
      
      console.log('✅ Stream status retrieved');
      
      return {
        success: true,
        status: response.status,
        data: response
      };
    } catch (error) {
      console.error('❌ Error getting stream status:', error);
      throw error;
    }
  }

  /**
   * Проверяет доступность изображения
   * @param {string} imageUrl - URL изображения
   * @private
   */
  async validateImageUrl(imageUrl) {
    try {
      console.log('🔍 Validating image URL:', imageUrl);
      
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`Image not found: ${imageUrl} (Status: ${response.status})`);
      }
      
      console.log('✅ Image URL is valid');
    } catch (error) {
      console.error('❌ Image validation failed:', error);
      throw new Error(`Не удалось проверить изображение: ${error.message}`);
    }
  }
}
