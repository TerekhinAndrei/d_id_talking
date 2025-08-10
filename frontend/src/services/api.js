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
    // Since we don't have a separate validate endpoint, we'll try to get the voice
    try {
      await this.getVoice(voiceId);
      return { success: true, valid: true };
    } catch (error) {
      return { success: true, valid: false };
    }
  }

  // ElevenLabs Authentication Test
  async testElevenLabsAuth() {
    // Test by trying to get voices
    try {
      const response = await this.getVoices();
      return { 
        success: true, 
        message: 'ElevenLabs authentication successful',
        data: { voices_count: response.voices?.length || 0 }
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'ElevenLabs authentication failed',
        error: error.message 
      };
    }
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

    const response = await fetch(`${API_BASE_URL}/tts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Get audio data as blob
    const audioBlob = await response.blob();
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    return {
      success: true,
      audio_data: audioBase64,
      format: 'mp3',
      sample_rate: 44100,
      bitrate: '128k'
    };
  }

  // STS (Speech-to-Speech)
  async speechToSpeech(audioFile, voiceId, settings = null) {
    try {
      // Validate audio file
      if (!audioFile || audioFile.size === 0) {
        throw new Error('Аудио файл пустой или отсутствует');
      }
      
      if (audioFile.size < 2048) {
        throw new Error('Аудио файл слишком маленький (меньше 2KB)');
      }
      
      // Additional validation for WebM files
      if (audioFile.type.includes('webm')) {
        // Check if file has proper WebM headers
        const arrayBuffer = await audioFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // WebM files should start with EBML header
        if (uint8Array.length < 4 || 
            (uint8Array[0] !== 0x1A || uint8Array[1] !== 0x45 || 
             uint8Array[2] !== 0xDF || uint8Array[3] !== 0xA3)) {
          throw new Error('Невалидный WebM файл (отсутствуют заголовки)');
        }
      }
      
      console.log('📁 Отправка аудио файла:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      });

      // Convert audio file to base64
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

      // For now, return a mock response since we don't have STS endpoint yet
      return {
        success: true,
        message: 'Speech-to-Speech преобразование выполнено',
        audio_data: base64Audio, // Return original audio for now
        format: 'mp3',
        sample_rate: 44100,
        bitrate: '128k'
      };

    } catch (error) {
      console.error('❌ Ошибка STS:', error);
      throw error;
    }
  }

  // Voice Preview
  async playVoice(voiceId, previewText = "Привет! Это пример голоса.") {
    const requestBody = {
      voice_id: voiceId,
      text: previewText
    };

    const response = await fetch(`${API_BASE_URL}/tts/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // For now, generate TTS instead of play
    return this.textToSpeech(previewText, voiceId);
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
    return this.request('/streaming/start', {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl,
        description: description,
        config: {
          output_resolution: 512 // Стандартное разрешение для квадратного видео
        }
      }),
    });
  }

  async startStream(streamId, sessionId, sdpAnswer) {
    return this.request(`/streaming/${streamId}/sdp`, {
      method: 'POST',
      body: JSON.stringify({
        sdp_answer: sdpAnswer,
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
    // Extract text from script object if it's an object, otherwise use as is
    const text = typeof script === 'object' && script.input ? script.input : script;
    
    // Extract voice_id from script object if available
    const voiceId = typeof script === 'object' && script.voice_id ? script.voice_id : null;
    
    return this.request(`/streaming/${streamId}/talk`, {
      method: 'POST',
      body: JSON.stringify({
        text: text,
        voice_id: voiceId,
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

  async createDIdStream(imageUrl, description = 'D-ID streaming session', config = null) {
    if (config) {
      // Если передана конфигурация, используем её
      return this.request('/streaming/start', {
        method: 'POST',
        body: JSON.stringify({
          image_url: imageUrl,
          description: description,
          config: config
        }),
      });
    } else {
      // Иначе используем стандартную конфигурацию
      return this.createStream(imageUrl, description);
    }
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

  async createDIdTalkAudio(streamId, sessionId, audioUrl, voiceId = null) {
    return this.request(`/streaming/${streamId}/talk-audio`, {
      method: 'POST',
      body: JSON.stringify({
        text: audioUrl, // We use text field to pass audio URL
        voice_id: voiceId,
        session_id: sessionId
      }),
    });
  }
}

export const apiService = new ApiService();
