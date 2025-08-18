import { API_CONFIG, API_ENDPOINTS } from '../api.js';

/**
 * Fetch-based API client implementation
 */
class FetchApiClient {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.defaultHeaders = API_CONFIG.headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Voices
  async getVoices() {
    return this.request(API_ENDPOINTS.voices);
  }

  async getVoice(voiceId) {
    return this.request(API_ENDPOINTS.voiceById(voiceId));
  }

  // TTS
  async generateTTS(text, voiceId, options = {}) {
    return this.request(API_ENDPOINTS.tts, {
      method: 'POST',
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        ...options
      })
    });
  }

  // Video
  async generateVideo(audioUrl, presenterId, options = {}) {
    return this.request(API_ENDPOINTS.video, {
      method: 'POST',
      body: JSON.stringify({
        audio_url: audioUrl,
        presenter_id: presenterId,
        ...options
      })
    });
  }

  // Health check
  async healthCheck() {
    return this.request(API_ENDPOINTS.health);
  }
}

export default FetchApiClient;
