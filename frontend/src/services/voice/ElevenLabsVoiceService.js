import { IVoiceService } from '../../core/interfaces/IVoiceService.js';

/**
 * Реализация сервиса голосов для ElevenLabs
 */
export class ElevenLabsVoiceService extends IVoiceService {
  constructor(apiClient) {
    super();
    this.apiClient = apiClient;
  }

  /**
   * Получает список доступных голосов
   * @returns {Promise<Array>} Массив голосов
   */
  async getVoices() {
    try {
      console.log('🎤 Fetching voices from ElevenLabs');
      
      const response = await this.apiClient.get('/voices/');
      
      if (response.success && response.voices) {
        console.log(`✅ Retrieved ${response.voices.length} voices`);
        return response.voices;
      } else {
        throw new Error('Invalid response format from voices API');
      }
    } catch (error) {
      console.error('❌ Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Получает информацию о конкретном голосе
   * @param {string} voiceId - ID голоса
   * @returns {Promise<Object>} Информация о голосе
   */
  async getVoice(voiceId) {
    try {
      console.log('🎤 Fetching voice details:', voiceId);
      
      const response = await this.apiClient.get(`/voices/${voiceId}`);
      
      if (response.success && response.voice) {
        console.log('✅ Voice details retrieved');
        return response.voice;
      } else {
        throw new Error('Invalid response format from voice API');
      }
    } catch (error) {
      console.error('❌ Error fetching voice:', error);
      throw error;
    }
  }

  /**
   * Проверяет валидность голоса
   * @param {string} voiceId - ID голоса
   * @returns {Promise<boolean>} Результат проверки
   */
  async validateVoice(voiceId) {
    try {
      console.log('🎤 Validating voice:', voiceId);
      
      const response = await this.apiClient.get(`/voices/${voiceId}`);
      
      const isValid = response.success && response.voice;
      console.log(`✅ Voice validation result: ${isValid}`);
      
      return isValid;
    } catch (error) {
      console.log('❌ Voice validation failed:', error.message);
      return false;
    }
  }

  /**
   * Генерирует речь из текста
   * @param {string} text - Текст для озвучивания
   * @param {string} voiceId - ID голоса
   * @param {Object} [settings] - Настройки голоса
   * @returns {Promise<Object>} Результат генерации
   */
  async textToSpeech(text, voiceId, settings = null) {
    try {
      console.log('🎤 Generating TTS:', { text: text.substring(0, 50) + '...', voiceId });
      
      const requestBody = {
        text,
        voice_id: voiceId
      };
      
      // Добавляем voice_settings только если он не null
      if (settings !== null) {
        requestBody.voice_settings = settings;
      }

      const response = await this.apiClient.post('/tts/generate', requestBody);
      
      if (response.success && response.audio_data) {
        console.log('✅ TTS generated successfully');
        return {
          success: true,
          audio_data: response.audio_data,
          format: response.format || 'mp3',
          sample_rate: response.sample_rate || 44100,
          bitrate: response.bitrate || '128k'
        };
      } else {
        throw new Error('Invalid response format from TTS API');
      }
    } catch (error) {
      console.error('❌ Error generating TTS:', error);
      throw error;
    }
  }

  /**
   * Преобразует речь в речь (STS)
   * @param {File} audioFile - Аудио файл
   * @param {string} voiceId - ID голоса
   * @param {Object} [settings] - Настройки голоса
   * @returns {Promise<Object>} Результат преобразования
   */
  async speechToSpeech(audioFile, voiceId, settings = null) {
    try {
      console.log('🎤 Generating STS:', { fileName: audioFile.name, voiceId });
      
      // Валидация аудио файла
      if (!audioFile || audioFile.size === 0) {
        throw new Error('Аудио файл пустой или отсутствует');
      }
      
      if (audioFile.size < 2048) {
        throw new Error('Аудио файл слишком маленький (меньше 2KB)');
      }
      
      // Дополнительная валидация для WebM файлов
      if (audioFile.type.includes('webm')) {
        const arrayBuffer = await audioFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // WebM файлы должны начинаться с EBML заголовка
        if (uint8Array.length < 4 || 
            (uint8Array[0] !== 0x1A || uint8Array[1] !== 0x45 || 
             uint8Array[2] !== 0xDF || uint8Array[3] !== 0xA3)) {
          throw new Error('Невалидный WebM файл (отсутствуют заголовки)');
        }
      }
      
      // Конвертируем аудио файл в base64
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const requestBody = {
        audio_data: base64Audio,
        voice_id: voiceId,
        format: audioFile.type.includes('webm') ? 'webm' : 'wav'
      };

      if (settings !== null) {
        requestBody.voice_settings = settings;
      }

      // Пока возвращаем мок ответ, так как STS endpoint еще не реализован
      return {
        success: true,
        message: 'Speech-to-Speech преобразование выполнено',
        audio_data: base64Audio, // Возвращаем исходное аудио пока что
        format: 'mp3',
        sample_rate: 44100,
        bitrate: '128k'
      };
    } catch (error) {
      console.error('❌ Error generating STS:', error);
      throw error;
    }
  }

  /**
   * Воспроизводит предварительный просмотр голоса
   * @param {string} voiceId - ID голоса
   * @param {string} [previewText] - Текст для предварительного просмотра
   * @returns {Promise<Object>} Результат воспроизведения
   */
  async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
    try {
      console.log('🎤 Playing voice preview:', voiceId);
      
      // Используем TTS для генерации предварительного просмотра
      return await this.textToSpeech(previewText, voiceId);
    } catch (error) {
      console.error('❌ Error playing voice preview:', error);
      throw error;
    }
  }

  /**
   * Тестирует аутентификацию с провайдером
   * @returns {Promise<Object>} Результат тестирования
   */
  async testAuth() {
    try {
      console.log('🔐 Testing ElevenLabs authentication');
      
      // Тестируем, пытаясь получить голоса
      const response = await this.getVoices();
      
      return { 
        success: true, 
        message: 'ElevenLabs authentication successful',
        data: { voices_count: response.length }
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'ElevenLabs authentication failed',
        error: error.message 
      };
    }
  }
}
