import { ApiResponse } from '../../types';

/**
 * Общий сервис для работы с API бэкенда
 */
export class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8000', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Универсальный метод для выполнения HTTP запросов
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    // Если это FormData, не устанавливаем Content-Type
    if (data instanceof FormData) {
      delete requestOptions.headers!['Content-Type'];
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // ===== D-ID File API =====

  /**
   * Загрузить изображение в D-ID
   */
  async uploadImageToDId(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.makeRequest(
      'POST',
      '/api/v1/d-id-files/upload/image',
      formData
    );

    return response.data;
  }

  /**
   * Загрузить аудио файл в D-ID
   */
  async uploadAudioToDId(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.makeRequest(
      'POST',
      '/api/v1/d-id-files/upload/audio',
      formData
    );

    return response.data;
  }

  /**
   * Удалить изображение из D-ID
   */
  async deleteImageFromDId(fileId: string) {
    const response = await this.makeRequest(
      'DELETE',
      `/api/v1/d-id-files/images/${fileId}`
    );

    return response.success;
  }

  /**
   * Удалить аудио файл из D-ID
   */
  async deleteAudioFromDId(fileId: string) {
    const response = await this.makeRequest(
      'DELETE',
      `/api/v1/d-id-files/audios/${fileId}`
    );

    return response.success;
  }

  /**
   * Тестировать аутентификацию D-ID API
   */
  async testDIdAuthentication() {
    const response = await this.makeRequest(
      'GET',
      '/api/v1/d-id-files/test-auth'
    );

    return response.data;
  }

  // ===== D-ID Streaming API =====

  /**
   * Создать стрим в D-ID
   */
  async createDIdStream(imageUrl: string, description?: string) {
    const response = await this.makeRequest(
      'POST',
      '/api/v1/d-id/streams',
      {
        image_url: imageUrl,
        description: description || 'Stream created from frontend'
      }
    );

    return response.data;
  }

  /**
   * Запустить стрим в D-ID
   */
  async startDIdStream(streamId: string, sessionId: string, sdpAnswer: string) {
    const response = await this.makeRequest(
      'POST',
      `/api/v1/d-id/streams/${streamId}/start`,
      {
        session_id: sessionId,
        sdp_answer: sdpAnswer
      }
    );

    return response.data;
  }

  /**
   * Создать talk в D-ID
   */
  async createDIdTalk(streamId: string, sessionId: string, text: string, voiceId?: string) {
    const response = await this.makeRequest(
      'POST',
      `/api/v1/d-id/streams/${streamId}/talks`,
      {
        session_id: sessionId,
        text: text,
        voice_id: voiceId || 'en-US-JennyNeural'
      }
    );

    return response.data;
  }

  /**
   * Закрыть стрим в D-ID
   */
  async closeDIdStream(streamId: string) {
    const response = await this.makeRequest(
      'DELETE',
      `/api/v1/d-id/streams/${streamId}`
    );

    return response.success;
  }

  /**
   * Отправить ICE кандидата
   */
  async submitDIdIceCandidate(streamId: string, sessionId: string, candidate: string, sdpMid?: string, sdpMLineIndex?: number) {
    const response = await this.makeRequest(
      'POST',
      `/api/v1/d-id/streams/${streamId}/ice-candidate`,
      {
        session_id: sessionId,
        candidate: candidate,
        sdp_mid: sdpMid,
        sdp_mline_index: sdpMLineIndex
      }
    );

    return response.success;
  }

  // ===== Health Check =====

  /**
   * Проверить здоровье API
   */
  async healthCheck() {
    const response = await this.makeRequest(
      'GET',
      '/api/v1/health'
    );

    return response.data;
  }

  // ===== Voices API =====

  /**
   * Получить список голосов
   */
  async getVoices() {
    const response = await this.makeRequest(
      'GET',
      '/api/v1/voices'
    );

    return response.data;
  }

  // ===== Storage API =====

  /**
   * Загрузить файл в хранилище
   */
  async uploadFile(file: File, type: 'image' | 'audio' = 'image') {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.makeRequest(
      'POST',
      `/api/v1/storage/upload/${type}`,
      formData
    );

    return response.data;
  }

  // ===== Tasks API =====

  /**
   * Создать задачу
   */
  async createTask(request: any) {
    const response = await this.makeRequest(
      'POST',
      '/api/v1/tasks',
      request
    );

    return response.data;
  }

  /**
   * Получить статус задачи
   */
  async getTaskStatus(taskId: string) {
    const response = await this.makeRequest(
      'GET',
      `/api/v1/tasks/${taskId}`
    );

    return response.data;
  }

  /**
   * Получить список задач
   */
  async getTasks(limit: number = 100, offset: number = 0) {
    const response = await this.makeRequest(
      'GET',
      `/api/v1/tasks?limit=${limit}&offset=${offset}`
    );

    return response.data;
  }
}

// Экспортируем экземпляр по умолчанию
export const apiService = new ApiService();
