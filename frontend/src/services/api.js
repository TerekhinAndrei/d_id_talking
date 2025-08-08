const API_BASE_URL = '/api/v1';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${url}`, config);
      const response = await fetch(url, config);
      
      console.log(`📡 API Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error (${endpoint}):`, errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Response (${endpoint}):`, data);
      console.log(`🔍 Response data.success:`, data.success);
      console.log(`🔍 Response data type:`, typeof data.success);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Voices Management
  async getVoices() {
    return this.request('/voices/');
  }

  async getVoice(voiceId) {
    return this.request(`/voices/${voiceId}`);
  }

  async validateVoice(voiceId) {
    return this.request(`/voices/${voiceId}/validate`);
  }

  // ElevenLabs Authentication Test
  async testElevenLabsAuth() {
    return this.request('/voices/test-auth');
  }

  // TTS (Text-to-Speech)
  async textToSpeech(text, voiceId, settings = null) {
    const requestBody = {
      text,
      voice_id: voiceId
    };
    
    // Добавляем voice_settings только если он не null
    if (settings !== null) {
      requestBody.voice_settings = settings;
    }

    return this.request('/tts/text-to-speech', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // STS (Speech-to-Speech)
  async speechToSpeech(audioFile, voiceId, settings = null) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('voice_id', voiceId);
    if (settings !== null) {
      formData.append('voice_settings', JSON.stringify(settings));
    }

    return this.request('/tts/speech-to-speech', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Voice Preview/Play
  async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
    try {
      console.log('🎤 Запрос воспроизведения голоса:', { voiceId, previewText });
      
      const response = await this.request('/tts/play-voice', {
        method: 'POST',
        body: JSON.stringify({ 
          voice_id: voiceId,
          text: previewText
        }),
      });

      console.log('📡 Ответ playVoice:', {
        success: response.success,
        hasAudioData: !!response.audio_data,
        format: response.format,
        dataLength: response.audio_data?.length || 0
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка playVoice:', error);
      throw error;
    }
  }

  // Storage API
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/storage/upload/image', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/storage/upload/audio', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Video Generation
  async generateVideo(imageFile, audioFile, voiceId = null, settings = null) {
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('audio_file', audioFile);
    if (voiceId) {
      formData.append('voice_id', voiceId);
    }
    if (settings) {
      formData.append('settings', JSON.stringify(settings));
    }

    return this.request('/video/generate', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getTaskStatus(taskId) {
    return this.request(`/video/status/${taskId}`);
  }

  // Streaming API
  async createStream(imageUrl, description = 'D-ID streaming session') {
    return this.request('/streaming/sessions', {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl,
        description: description
      }),
    });
  }

  async startStream(streamId, sessionId, sdpAnswer) {
    return this.request(`/streaming/${streamId}/sdp`, {
      method: 'POST',
      body: JSON.stringify({
        answer: sdpAnswer,
        session_id: sessionId
      }),
    });
  }

  async submitIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex) {
    return this.request(`/streaming/${streamId}/ice`, {
      method: 'POST',
      body: JSON.stringify({
        candidate: candidate,
        sdpMid: sdpMid,
        sdpMLineIndex: sdpMLineIndex,
        session_id: sessionId
      }),
    });
  }

  async createTalk(streamId, sessionId, script) {
    return this.request(`/streaming/${streamId}/talk`, {
      method: 'POST',
      body: JSON.stringify({
        script: script,
        session_id: sessionId
      }),
    });
  }

  async closeStream(streamId, sessionId) {
    return this.request(`/streaming/${streamId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        session_id: sessionId
      }),
    });
  }

  async getStreamStatus(streamId) {
    return this.request(`/streaming/${streamId}/status`);
  }

  // Voice Changer
  async voiceChangerStream(audioData, voiceId, modelId = 'eleven_multilingual_sts_v2', outputFormat = 'mp3_44100_128', optimizeLatency = 3) {
    const formData = new FormData();
    formData.append('audio_data', audioData);
    formData.append('voice_id', voiceId);
    formData.append('model_id', modelId);
    formData.append('output_format', outputFormat);
    formData.append('optimize_latency', optimizeLatency);

    return this.request('/tts/voice-changer-stream', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Real-time Audio Streaming
  async streamAudioRealtime(audioData, voiceId, modelId = 'eleven_multilingual_sts_v2') {
    const formData = new FormData();
    formData.append('audio_data', audioData);
    formData.append('voice_id', voiceId);
    formData.append('model_id', modelId);

    return this.request('/tts/stream-audio-realtime', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // Legacy methods for backward compatibility
  async uploadToCloudinary(formData) {
    // This method is deprecated, use uploadImage/uploadAudio instead
    console.warn('uploadToCloudinary is deprecated, use uploadImage/uploadAudio instead');
    return this.uploadImage(formData.get('file'));
  }

  async createDIdStream(imageUrl, description = 'D-ID streaming session') {
    return this.createStream(imageUrl, description);
  }

  async startDIdStream(streamId, sessionId, sdpAnswer) {
    return this.startStream(streamId, sessionId, sdpAnswer);
  }

  async submitDIdIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex) {
    return this.submitIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex);
  }

  async createDIdTalk(streamId, sessionId, script) {
    return this.createTalk(streamId, sessionId, script);
  }

  async closeDIdStream(streamId, sessionId) {
    return this.closeStream(streamId, sessionId);
  }

  async getDIdStreamStatus(streamId) {
    return this.getStreamStatus(streamId);
  }
}

export const apiService = new ApiService();
