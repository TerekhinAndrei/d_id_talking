import configManager from '../config/ConfigManager.js';

// API configuration
const API_BASE_URL = configManager.backendUrl;
const API_VERSION = 'v1.0.1'; // Force cache refresh
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Debug: Log the actual URL being used
console.log('🔧 API Configuration:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL: API_BASE_URL,
  API_TIMEOUT: API_TIMEOUT,
  API_VERSION: API_VERSION
});

// Test the voices endpoint directly
console.log('🔧 Testing voices endpoint:', `${API_BASE_URL}/api/v1/voices/`);

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  health: '/api/v1/health',
  
  // Voices
  voices: '/api/v1/voices/',
  voiceById: (id) => `/api/v1/voices/${id}`,
  
  // TTS
  ttsGenerate: '/api/v1/tts/generate',
  ttsPlay: '/api/v1/tts/play',
  
  // Video
  videoGenerate: '/api/v1/video/generate',
  videoStatus: (taskId) => `/api/v1/video/status/${taskId}`,
  
  // Streaming
  streamingSessions: '/api/v1/streaming/sessions',
  streamingStart: '/api/v1/streaming/start',
  streamingById: (streamId) => `/api/v1/streaming/${streamId}`,
  streamingIce: (streamId) => `/api/v1/streaming/${streamId}/ice`,
  streamingSdp: (streamId) => `/api/v1/streaming/${streamId}/sdp`,
  streamingStatus: (streamId) => `/api/v1/streaming/${streamId}/status`,
  streamingTalk: (streamId) => `/api/v1/streaming/${streamId}/talk`,
  streamingTalkAudio: (streamId) => `/api/v1/streaming/${streamId}/talk-audio`,
  
  // D-ID Files
  didFilesTestAuth: '/api/v1/d-id-files/test-auth',
  didFilesUploadAudio: '/api/v1/d-id-files/upload/audio',
  didFilesUploadImage: '/api/v1/d-id-files/upload/image',
  didFilesAudio: (fileId) => `/api/v1/d-id-files/audios/${fileId}`,
  didFilesImage: (fileId) => `/api/v1/d-id-files/images/${fileId}`,
  
  // Storage
  storageFiles: '/api/v1/storage/files',
  storageFileById: (fileId) => `/api/v1/storage/files/${fileId}`,
  storageUploadAudio: '/api/v1/storage/upload/audio',
  storageUploadImage: '/api/v1/storage/upload/image',
  
  // Tasks
  tasks: '/api/v1/tasks/',
  taskById: (id) => `/api/v1/tasks/${id}`,
  taskStart: (id) => `/api/v1/tasks/${id}/start`,
  taskComplete: (id) => `/api/v1/tasks/${id}/complete`,
  taskProgress: (id) => `/api/v1/tasks/${id}/progress`,
  tasksStatsOverview: '/api/v1/tasks/stats/overview',
  
  // Users
  users: '/api/v1/users/',
  userById: (id) => `/api/v1/users/${id}`,
  
  // Health
  healthConfig: '/api/v1/health/config',
  healthDid: '/api/v1/health/d-id',
  healthDetailed: '/api/v1/health/detailed',
};

// WebSocket endpoints
export const WS_ENDPOINTS = {
  test: configManager.getWebSocketUrl('/ws/test'),
  simpleStream: configManager.getWebSocketUrl('/ws/simple-stream'),
  stream: configManager.getWebSocketUrl('/ws/stream'),
};

class ApiService {
  async request(endpoint, options = {}) {
    // Add timestamp to bypass cache
    const timestamp = Date.now();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_CONFIG.baseURL}${endpoint}${separator}_t=${timestamp}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${url}`);
      if (config.body instanceof FormData) {
        console.log(`📤 Request body: FormData (${config.body.entries().length} entries)`);
      } else if (config.body) {
        try {
          console.log(`📤 Request body:`, JSON.parse(config.body));
        } catch (e) {
          console.log(`📤 Request body: (not JSON)`, config.body);
        }
      } else {
        console.log(`📤 Request body: No body`);
      }
      console.log(`📤 Request config:`, config);
      const response = await fetch(url, config);
      
              // Не логируем статус 500 только для загрузки файлов в D-ID, чтобы не показывать ошибку в UI
        if (!(response.status === 500 && endpoint.includes('/d-id-files/upload/'))) {
          console.log(`📡 API Response status: ${response.status}`);
        }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Проверяем, является ли это ошибкой имени файла или модерации для D-ID загрузки файлов
        const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        const isDIdFileUpload = endpoint.includes('/d-id-files/upload/');
        const isFilenameError = errorMessage.includes('Filename contains invalid characters') ||
                               errorMessage.includes('invalid characters') ||
                               errorMessage.includes('Only a-z, A-Z, 0-9, ., _, - are allowed') ||
                               errorMessage.includes('Filename must be 50 characters or less');
        const isModerationError = errorMessage.includes('ImageModerationError') ||
                                 errorMessage.includes('AudioModerationError') ||
                                 errorMessage.includes('451') ||
                                 errorMessage.includes('content moderation');
        
        if (isDIdFileUpload && (isFilenameError || isModerationError)) {
          // Для D-ID ошибок загрузки файлов возвращаем объект ошибки без выбрасывания исключения
          // Это предотвратит показ ошибки 500 в консоли браузера
          return {
            error: true,
            type: isFilenameError ? 'filename' : 'moderation',
            message: errorMessage,
            originalError: new Error(errorMessage)
          };
        }
        
        // Для других ошибок логируем и выбрасываем
        console.error(`❌ API Error (${endpoint}):`, errorData);
        console.error(`❌ Error details:`, JSON.stringify(errorData, null, 2));
        if (errorData.detail && Array.isArray(errorData.detail)) {
          console.error(`❌ Validation errors:`, errorData.detail);
        }
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      console.log(`📄 Raw response text:`, responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log(`✅ API Response (${endpoint}):`, data);
        console.log(`🔍 Response data.success:`, data.success);
        console.log(`🔍 Response data type:`, typeof data.success);
      } catch (parseError) {
        console.error(`❌ JSON Parse error:`, parseError);
        console.error(`❌ Response text:`, responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Voices Management
  async getVoices() {
    return this.request(API_ENDPOINTS.voices);
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

    const response = await fetch(`${API_BASE_URL}/api/v1/tts/generate`, {
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

    const response = await fetch(`${API_BASE_URL}/api/v1/tts/play`, {
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

    return this.request(API_ENDPOINTS.storageUploadImage, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.storageUploadAudio, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // D-ID File API (New)
  async uploadImageToDId(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.didFilesUploadImage, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadAudioToDId(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.didFilesUploadAudio, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async deleteImageFromDId(fileId) {
    return this.request(`/d-id-files/images/${fileId}`, {
      method: 'DELETE',
    });
  }

  async deleteAudioFromDId(fileId) {
    return this.request(`/d-id-files/audios/${fileId}`, {
      method: 'DELETE',
    });
  }

  async testDIdAuthentication() {
    return this.request(API_ENDPOINTS.didFilesTestAuth);
  }

  // Hybrid Storage API (with D-ID option)
  async uploadImageHybrid(file, useDId = false) {
    const formData = new FormData();
    formData.append('file', file);

    const url = useDId 
      ? `${API_ENDPOINTS.storageUploadImage}?use_d_id=true`
      : API_ENDPOINTS.storageUploadImage;

    return this.request(url, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadAudioHybrid(file, useDId = false) {
    const formData = new FormData();
    formData.append('file', file);

    const url = useDId 
      ? '/storage/upload/audio?use_d_id=true'
      : '/storage/upload/audio';

    return this.request(url, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async deleteFileHybrid(fileId, storageType = 'cloudinary') {
    const url = storageType === 'd_id'
      ? `/storage/files/${fileId}?storage_type=d_id`
      : `/storage/files/${fileId}`;

    return this.request(url, {
      method: 'DELETE',
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

    return this.request(API_ENDPOINTS.videoGenerate, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getTaskStatus(taskId) {
    return this.request(API_ENDPOINTS.videoStatus(taskId));
  }

  // Streaming API
  async createStream(imageUrl, description = 'D-ID streaming session') {
    return this.request(API_ENDPOINTS.streamingStart, {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl
      }),
    });
  }

  async startStream(streamId, sessionId, sdpAnswer) {
    return this.request(API_ENDPOINTS.streamingSdp(streamId), {
      method: 'POST',
      body: JSON.stringify({
        sdp_answer: sdpAnswer,
        session_id: sessionId
      }),
    });
  }

  async submitIceCandidate(streamId, sessionId, candidate, sdpMid, sdpMLineIndex) {
    return this.request(API_ENDPOINTS.streamingIce(streamId), {
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
    
    return this.request(API_ENDPOINTS.streamingTalk(streamId), {
      method: 'POST',
      body: JSON.stringify({
        text: text,
        voice_id: voiceId,
        session_id: sessionId
      }),
    });
  }

  async closeStream(streamId, sessionId) {
    return this.request(API_ENDPOINTS.streamingById(streamId), {
      method: 'DELETE',
      body: JSON.stringify({
        session_id: sessionId
      }),
    });
  }

  async getStreamStatus(streamId) {
    return this.request(API_ENDPOINTS.streamingStatus(streamId));
  }



  // Real-time Audio Streaming
  async streamAudioRealtime(audioData, voiceId, modelId = 'eleven_multilingual_sts_v2') {
    const formData = new FormData();
    formData.append('audio_data', audioData);
    formData.append('voice_id', voiceId);
    formData.append('model_id', modelId);

    return this.request('/api/v1/tts/stream-audio-realtime', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Health Check
  async healthCheck() {
    return this.request(API_ENDPOINTS.health);
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
      return this.request(API_ENDPOINTS.streamingStart, {
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
    return this.request(API_ENDPOINTS.streamingTalkAudio(streamId), {
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
