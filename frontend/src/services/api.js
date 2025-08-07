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

  // ElevenLabs Voice Management
  async getVoices() {
    return this.request('/generation/voices');
  }

  async getVoice(voiceId) {
    return this.request(`/generation/voices/${voiceId}`);
  }

  async validateVoice(voiceId) {
    return this.request(`/generation/voices/validate/${voiceId}`);
  }

  // ElevenLabs TTS (Text-to-Speech)
  async textToSpeech(text, voiceId, settings = null) {
    return this.request('/generation/tts', {
      method: 'POST',
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        voice_settings: settings
      }),
    });
  }

  // ElevenLabs STS (Speech-to-Speech)
  async speechToSpeech(audioFile, voiceId, settings = null) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('voice_id', voiceId);
    if (settings) {
      formData.append('voice_settings', JSON.stringify(settings));
    }

    return this.request('/generation/sts', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // ElevenLabs Authentication Test
  async testElevenLabsAuth() {
    return this.request('/generation/test-auth');
  }

  // Voice Preview/Play
  async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
    try {
      console.log('🎤 Запрос воспроизведения голоса:', { voiceId, previewText });
      
      const response = await this.request('/generation/play-voice', {
        method: 'POST',
        body: JSON.stringify({ 
          voice_id: voiceId,
          preview_text: previewText
        }),
      });

      console.log('📡 Ответ playVoice:', {
        success: response.success,
        hasAudioData: !!response.audio_data,
        format: response.format,
        dataLength: response.audio_data?.length || 0
      });

      // Validate response
      if (!response.success) {
        throw new Error(response.message || 'Ошибка воспроизведения голоса');
      }

      if (!response.audio_data) {
        throw new Error('Сервер не вернул аудио данные');
      }

      if (typeof response.audio_data !== 'string') {
        throw new Error('Аудио данные должны быть строкой');
      }

      if (response.audio_data.length === 0) {
        throw new Error('Получены пустые аудио данные');
      }

      return response;
    } catch (error) {
      console.error('❌ Ошибка playVoice:', error);
      throw error;
    }
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
      formData.append('voice_settings', JSON.stringify(settings));
    }

    return this.request('/generation/generate', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getTaskStatus(taskId) {
    return this.request(`/generation/status/${taskId}`);
  }

  // Streaming
  async createStream(imageFile, voiceId) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('voice_id', voiceId);

    return this.request('/streaming/create', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // D-ID Streaming API Methods
  async createDIdStream(imageUrl, description = 'D-ID streaming session') {
    // Step 1: Create a new stream
    console.log('🚀 createDIdStream called with:', { imageUrl, description });
    
    try {
      const result = await this.request('/streaming/start', {
        method: 'POST',
        body: JSON.stringify({
          image_url: imageUrl,
          description: description
        }),
      });
      
      console.log('🎯 createDIdStream result:', result);
      console.log('🔍 result.success:', result.success);
      console.log('🔍 typeof result.success:', typeof result.success);
      return result;
    } catch (error) {
      console.error('❌ createDIdStream error:', error);
      throw error;
    }
  }

  async startDIdStream(streamId, sessionId, sdpAnswer) {
    // Step 2: Start the stream
    console.log('🎬 startDIdStream called with:', { streamId, sessionId, sdpAnswerLength: sdpAnswer.sdp ? sdpAnswer.sdp.length : 'unknown' });
    
    const payload = {
      answer: {
        type: sdpAnswer.type || 'answer',
        sdp: sdpAnswer.sdp || sdpAnswer
      },
      session_id: sessionId
    };
    
    console.log('📤 SDP payload:', payload);
    
    return this.request(`/streaming/${streamId}/sdp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitDIdIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex) {
    // Step 3: Submit ICE candidate
    console.log('🎬 submitDIdIceCandidate called with:', { 
      streamId, 
      sessionId, 
      candidateLength: candidate.length,
      sdpMid,
      sdpMLineIndex
    });
    
    const payload = {
      candidate: candidate,
      sdpMid: sdpMid,
      sdpMLineIndex: sdpMLineIndex,
      session_id: sessionId
    };
    
    console.log('📤 ICE payload:', payload);
    
    return this.request(`/streaming/${streamId}/ice`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createDIdTalk(streamId, sessionId, script) {
    // Step 4: Create talk stream
    return this.request('/streaming/create-talk-stream', {
      method: 'POST',
      body: JSON.stringify({
        stream_id: streamId,
        session_id: sessionId,
        script: script
      }),
    });
  }

  async closeDIdStream(streamId, sessionId) {
    // Step 5: Close the stream
    return this.request(`/streaming/${streamId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        session_id: sessionId
      }),
    });
  }

  async getDIdStreamStatus(streamId) {
    // Get stream status
    return this.request(`/streaming/${streamId}/status`);
  }

  // Upload to Cloudinary
  async uploadToCloudinary(formData) {
    return this.request('/streaming/upload/image', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }
}

export const apiService = new ApiService();
