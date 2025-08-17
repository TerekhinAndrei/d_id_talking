import { 
  ApiResponse, 
  DIdStreamResponse, 
  DIdTalkResponse, 
  DIdIceCandidateResponse,
  DIdTalkRequest,
  DIdTalkCreateResponse,
  DIdTalkStatusResponse,
  DIdWebhookPayload
} from '../../types';

/**
 * Общий сервис для работы с API бэкенда
 */
export class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Используем относительные пути для API через Vite proxy
    this.baseUrl = '';
    this.timeout = 30000;
  }

  /**
   * Универсальный метод для выполнения HTTP запросов
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      console.log(`🌐 Making request to: ${url}`);
      console.log(`📋 Request options:`, {
        method: finalOptions.method,
        headers: finalOptions.headers,
        body: finalOptions.body
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Response data:`, result);
      return result;
    } catch (error) {
      console.error(`API request failed: ${options.method || 'GET'} ${endpoint} –`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/api/v1/health');
  }

  // D-ID File uploads
  async uploadImageToDId(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest<ApiResponse>('/api/v1/d-id-files/upload/image', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadAudioToDId(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest<ApiResponse>('/api/v1/d-id-files/upload/audio', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // D-ID Streaming
  async createDIdStream(imageUrl: string): Promise<DIdStreamResponse> {
    return this.makeRequest<DIdStreamResponse>('/api/v1/streaming/start', {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl,
        presenter_id: undefined // Опциональное поле
      }),
    });
  }

  async startDIdStream(streamId: string, sessionId: string, sdpAnswer: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/api/v1/streaming/${streamId}/sdp`, {
      method: 'POST',
      body: JSON.stringify({
        sdp_answer: sdpAnswer,
        session_id: sessionId
      }),
    });
  }

  async submitDIdIceCandidate(
    streamId: string,
    sessionId: string,
    candidate: string,
    sdpMid: string | null,
    sdpMLineIndex: number | null
  ): Promise<DIdIceCandidateResponse> {
    return this.makeRequest<DIdIceCandidateResponse>(`/api/v1/streaming/${streamId}/ice`, {
      method: 'POST',
      body: JSON.stringify({
        candidate: candidate,
        sdp_mid: sdpMid,
        sdp_mline_index: sdpMLineIndex,
        session_id: sessionId
      }),
    });
  }

  async createDIdStreamTalk(
    streamId: string,
    sessionId: string,
    textScript: any
  ): Promise<DIdTalkResponse> {
    return this.makeRequest<DIdTalkResponse>(`/api/v1/streaming/${streamId}/talk`, {
      method: 'POST',
      body: JSON.stringify({
        text: textScript.input,
        voice_id: textScript.provider?.voice_id || 'en-US-JennyNeural',
        session_id: sessionId
      }),
    });
  }

  async createDIdStreamTalkAudio(
    streamId: string,
    sessionId: string,
    audioUrl: string,
    voiceId: string = 'en-US-JennyNeural'
  ): Promise<DIdTalkResponse> {
    return this.makeRequest<DIdTalkResponse>(`/api/v1/streaming/${streamId}/talk-audio`, {
      method: 'POST',
      body: JSON.stringify({
        text: audioUrl, // In this endpoint, text field contains audio URL
        voice_id: voiceId,
        session_id: sessionId
      }),
    });
  }

  async closeDIdStream(streamId: string, sessionId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/api/v1/streaming/${streamId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        session_id: sessionId
      }),
    });
  }

  // Voices
  async getVoices(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/api/v1/voices');
  }

  // Storage
  async uploadFile(file: File, type: 'image' | 'audio' = 'image'): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest<ApiResponse>(`/api/v1/storage/upload/${type}`, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Tasks
  async getTasks(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/api/v1/tasks');
  }

  async getTaskStatus(taskId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/api/v1/tasks/${taskId}`);
  }

  // ===== D-ID VIDEO TALKS API (Video Generation) =====

  /**
   * Создание видео talk с произвольным script
   */
  async createDIdVideoTalk(request: DIdTalkRequest): Promise<DIdTalkCreateResponse> {
    return this.makeRequest<DIdTalkCreateResponse>('/api/v1/d-id-talks/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Создание видео talk с текстом
   */
  async createDIdVideoTalkWithText(
    sourceUrl: string,
    text: string,
    voiceId?: string,
    driverUrl?: string,
    webhook?: string
  ): Promise<DIdTalkCreateResponse> {
    const params = new URLSearchParams({
      source_url: sourceUrl,
      text: text,
    });

    if (voiceId) params.append('voice_id', voiceId);
    if (driverUrl) params.append('driver_url', driverUrl);
    if (webhook) params.append('webhook', webhook);

    return this.makeRequest<DIdTalkCreateResponse>(`/api/v1/d-id-talks/create-with-text?${params.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Создание видео talk с аудио
   */
  async createDIdVideoTalkWithAudio(
    sourceUrl: string,
    audioUrl: string,
    driverUrl?: string,
    webhook?: string
  ): Promise<DIdTalkCreateResponse> {
    const params = new URLSearchParams({
      source_url: sourceUrl,
      audio_url: audioUrl,
    });

    if (driverUrl) params.append('driver_url', driverUrl);
    if (webhook) params.append('webhook', webhook);

    return this.makeRequest<DIdTalkCreateResponse>(`/api/v1/d-id-talks/create-with-audio?${params.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Получение статуса видео talk
   */
  async getDIdVideoTalkStatus(talkId: string): Promise<DIdTalkStatusResponse> {
    console.log('📊 Getting D-ID video talk status for:', talkId);
    const response = await this.makeRequest<DIdTalkStatusResponse>(`/api/v1/d-id-talks/${talkId}/status`);
    console.log('📊 Status response:', response);
    console.log('📊 Status data:', response.data);
    console.log('📊 Result URL in status:', response.data?.result_url);
    return response;
  }

  /**
   * Отмена видео talk
   */
  async cancelDIdVideoTalk(talkId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/api/v1/d-id-talks/${talkId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Обработка webhook от D-ID для видео talks
   */
  async processDIdVideoWebhook(payload: DIdWebhookPayload): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/api/v1/d-id-talks/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Создание видео talk с загруженными файлами
   */
  async createDIdVideoTalkWithFiles(
    imageFile: File,
    audioFile: File,
    config?: {
      driverUrl?: string;
      webhook?: string;
      stitch?: boolean;
    }
  ): Promise<DIdTalkCreateResponse> {
    // Сначала загружаем файлы
    const [imageUpload, audioUpload] = await Promise.all([
      this.uploadImageToDId(imageFile),
      this.uploadAudioToDId(audioFile)
    ]);

    if (!imageUpload.success || !audioUpload.success) {
      throw new Error('Failed to upload files to D-ID');
    }

    const imageUrl = imageUpload.data?.url;
    const audioUrl = audioUpload.data?.url;

    if (!imageUrl || !audioUrl) {
      throw new Error('Failed to get uploaded file URLs');
    }

    // Создаем видео talk с загруженными файлами
    const talkRequest: DIdTalkRequest = {
      source_url: imageUrl,
      script: {
        type: 'audio',
        audio_url: audioUrl
      },
      config: {
        stitch: config?.stitch ?? true,
        result_format: 'mp4'
      },
      driver_url: config?.driverUrl,
      webhook: config?.webhook
    };

    return this.createDIdVideoTalk(talkRequest);
  }

  /**
   * Мониторинг статуса видео talk с автоматическим опросом
   */
  async monitorDIdVideoTalkStatus(
    talkId: string,
    onStatusUpdate?: (status: string, data: any) => void,
    maxAttempts: number = 30,
    intervalMs: number = 10000
  ): Promise<DIdTalkStatusResponse> {
    let attempts = 0;
    console.log(`🔄 Starting monitoring for talk ${talkId}, max attempts: ${maxAttempts}, interval: ${intervalMs}ms`);

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Monitoring attempt ${attempts + 1}/${maxAttempts} for talk ${talkId}`);
        const response = await this.getDIdVideoTalkStatus(talkId);
        const status = response.data?.status;
        const resultUrl = response.data?.result_url;

        console.log(`📊 Talk ${talkId} status: ${status}, result_url: ${resultUrl}`);

        if (onStatusUpdate) {
          onStatusUpdate(status, response.data);
        }

        if (status === 'done' || status === 'completed') {
          console.log(`✅ Talk ${talkId} completed successfully with result_url: ${resultUrl}`);
          return response;
        }

        if (status === 'failed' || status === 'rejected') {
          console.error(`❌ Talk ${talkId} failed with status: ${status}`);
          throw new Error(`Video talk failed with status: ${status}`);
        }

        console.log(`⏳ Talk ${talkId} still processing (${status}), waiting ${intervalMs}ms before next check...`);
        // Ждем перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;

      } catch (error) {
        console.error(`Error monitoring video talk status (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    console.error(`⏰ Timeout waiting for talk ${talkId} completion after ${maxAttempts} attempts`);
    throw new Error(`Timeout waiting for video talk completion after ${maxAttempts} attempts`);
  }
}

// Экспортируем экземпляр по умолчанию
export const apiService = new ApiService();
