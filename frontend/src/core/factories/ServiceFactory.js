import { IStreamingService } from '../interfaces/IStreamingService.js';
import { IVoiceService } from '../interfaces/IVoiceService.js';
import { IAudioService } from '../interfaces/IAudioService.js';
import { IApiClient } from '../interfaces/IApiClient.js';

/**
 * Фабрика для создания сервисов
 * Реализует паттерн Factory для инъекции зависимостей
 */
export class ServiceFactory {
  /**
   * Создает сервис стриминга
   * @param {'did'|'custom'} type - Тип сервиса стриминга
   * @param {IApiClient} apiClient - API клиент
   * @returns {IStreamingService} Сервис стриминга
   */
  static createStreamingService(type, apiClient) {
    switch (type) {
      case 'did':
        // Импортируем динамически для избежания циклических зависимостей
        return import('../../services/streaming/DIdStreamingService.js')
          .then(module => new module.DIdStreamingService(apiClient));
      case 'custom':
        return import('../../services/streaming/CustomStreamingService.js')
          .then(module => new module.CustomStreamingService(apiClient));
      default:
        throw new Error(`Unknown streaming service type: ${type}`);
    }
  }

  /**
   * Создает сервис голосов
   * @param {'elevenlabs'|'microsoft'|'custom'} type - Тип сервиса голосов
   * @param {IApiClient} apiClient - API клиент
   * @returns {IVoiceService} Сервис голосов
   */
  static createVoiceService(type, apiClient) {
    switch (type) {
      case 'elevenlabs':
        return import('../../services/voice/ElevenLabsVoiceService.js')
          .then(module => new module.ElevenLabsVoiceService(apiClient));
      case 'microsoft':
        return import('../../services/voice/MicrosoftVoiceService.js')
          .then(module => new module.MicrosoftVoiceService(apiClient));
      case 'custom':
        return import('../../services/voice/CustomVoiceService.js')
          .then(module => new module.CustomVoiceService(apiClient));
      default:
        throw new Error(`Unknown voice service type: ${type}`);
    }
  }

  /**
   * Создает сервис аудио
   * @param {'native'|'custom'} type - Тип сервиса аудио
   * @returns {IAudioService} Сервис аудио
   */
  static createAudioService(type) {
    switch (type) {
      case 'native':
        return import('../../services/audio/NativeAudioService.js')
          .then(module => new module.NativeAudioService());
      case 'custom':
        return import('../../services/audio/CustomAudioService.js')
          .then(module => new module.CustomAudioService());
      default:
        throw new Error(`Unknown audio service type: ${type}`);
    }
  }

  /**
   * Создает API клиент
   * @param {'fetch'|'axios'|'custom'} type - Тип API клиента
   * @param {string} baseUrl - Базовый URL API
   * @returns {IApiClient} API клиент
   */
  static createApiClient(type, baseUrl = '/api/v1') {
    switch (type) {
      case 'fetch':
        return import('../../services/api/FetchApiClient.js')
          .then(module => new module.FetchApiClient(baseUrl));
      case 'axios':
        return import('../../services/api/AxiosApiClient.js')
          .then(module => new module.AxiosApiClient(baseUrl));
      case 'custom':
        return import('../../services/api/CustomApiClient.js')
          .then(module => new module.CustomApiClient(baseUrl));
      default:
        throw new Error(`Unknown API client type: ${type}`);
    }
  }

  /**
   * Создает полный набор сервисов для приложения
   * @param {Object} config - Конфигурация сервисов
   * @param {string} config.streamingType - Тип сервиса стриминга
   * @param {string} config.voiceType - Тип сервиса голосов
   * @param {string} config.audioType - Тип сервиса аудио
   * @param {string} config.apiClientType - Тип API клиента
   * @param {string} config.apiBaseUrl - Базовый URL API
   * @returns {Promise<Object>} Объект с сервисами
   */
  static async createServices(config) {
    const {
      streamingType = 'did',
      voiceType = 'elevenlabs',
      audioType = 'native',
      apiClientType = 'fetch',
      apiBaseUrl = '/api/v1'
    } = config;

    // Создаем API клиент
    const apiClient = await this.createApiClient(apiClientType, apiBaseUrl);

    // Создаем остальные сервисы
    const [streamingService, voiceService, audioService] = await Promise.all([
      this.createStreamingService(streamingType, apiClient),
      this.createVoiceService(voiceType, apiClient),
      this.createAudioService(audioType)
    ]);

    return {
      streamingService,
      voiceService,
      audioService,
      apiClient
    };
  }

  /**
   * Создает сервисы по умолчанию
   * @returns {Promise<Object>} Объект с сервисами по умолчанию
   */
  static async createDefaultServices() {
    return this.createServices({
      streamingType: 'did',
      voiceType: 'elevenlabs',
      audioType: 'native',
      apiClientType: 'fetch',
      apiBaseUrl: '/api/v1'
    });
  }
}
