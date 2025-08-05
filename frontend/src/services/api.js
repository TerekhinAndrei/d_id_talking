import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens, etc.
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Health check
  async getHealth() {
    const response = await api.get('/api/v1/health');
    return response.data;
  },

  // Voices
  async getVoices() {
    const response = await api.get('/api/v1/voices');
    return response.data;
  },

  async validateVoice(voiceId) {
    const response = await api.get(`/api/v1/voices/${voiceId}/validate`);
    return response.data;
  },

  async getVoiceById(voiceId) {
    const response = await api.get(`/api/v1/voices/${voiceId}`);
    return response.data;
  },

  // Video Generation
  async generateVideo(imageFile, audioFile, voiceId = null) {
    console.log('API Service - generateVideo called with:', {
      imageFile: imageFile?.name,
      imageFileSize: imageFile?.size,
      audioFile: audioFile?.size,
      audioFileType: audioFile?.type,
      voiceId
    });

    const formData = new FormData();
    formData.append('image_file', imageFile);
    
    // Convert Blob to File with proper name and type
    if (audioFile instanceof Blob) {
      let audioFileName;
      let audioFileObj;
      
      // Use original format but with proper extension
      if (audioFile.type === 'audio/webm' || audioFile.type === 'audio/webm;codecs=opus') {
        audioFileName = `audio_${Date.now()}.webm`;
        audioFileObj = new File([audioFile], audioFileName, { type: audioFile.type });
        console.log('WebM audio file:', audioFileName, audioFileObj.size, 'bytes');
      } else {
        audioFileName = `audio_${Date.now()}.${audioFile.type.split('/')[1] || 'webm'}`;
        audioFileObj = new File([audioFile], audioFileName, { type: audioFile.type });
        console.log('Audio file:', audioFileName, audioFileObj.size, 'bytes');
      }
      
      formData.append('audio_file', audioFileObj);
    } else {
      formData.append('audio_file', audioFile);
    }
    
    if (voiceId) {
      formData.append('voice_id', voiceId);
    }

    // Debug FormData contents
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.size} bytes, type: ${value.type})` : value);
    }

    console.log('Sending request to /api/v1/generate...');
    const response = await api.post('/api/v1/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response received:', response.data);
    return response.data;
  },

  async getTaskStatus(taskId) {
    const response = await api.get(`/api/v1/status/${taskId}`);
    return response.data;
  },



  // Users (legacy methods)
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api; 