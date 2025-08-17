import { apiService } from './api/ApiService';
import { 
  DIdTalkRequest, 
  DIdTalkCreateResponse, 
  DIdTalkStatusResponse
} from '../types';

/**
 * Специализированный сервис для работы с D-ID Video Talks API (создание видео)
 */
export class DIdVideoTalksService {
  private static instance: DIdVideoTalksService;

  private constructor() {}

  static getInstance(): DIdVideoTalksService {
    if (!DIdVideoTalksService.instance) {
      DIdVideoTalksService.instance = new DIdVideoTalksService();
    }
    return DIdVideoTalksService.instance;
  }

  /**
   * Создание видео talk с произвольным script
   */
  async createVideoTalk(request: DIdTalkRequest): Promise<DIdTalkCreateResponse> {
    console.log('🎬 Creating D-ID video talk with custom script:', request);
    return apiService.createDIdVideoTalk(request);
  }

  /**
   * Создание видео talk с текстом
   */
  async createVideoTalkWithText(
    sourceUrl: string,
    text: string,
    options?: {
      voiceId?: string;
      driverUrl?: string;
      webhook?: string;
    }
  ): Promise<DIdTalkCreateResponse> {
    console.log('🎬 Creating D-ID video talk with text:', { sourceUrl, text, options });
    return apiService.createDIdVideoTalkWithText(
      sourceUrl,
      text,
      options?.voiceId,
      options?.driverUrl,
      options?.webhook
    );
  }

  /**
   * Создание видео talk с аудио
   */
  async createVideoTalkWithAudio(
    sourceUrl: string,
    audioUrl: string,
    options?: {
      driverUrl?: string;
      webhook?: string;
    }
  ): Promise<DIdTalkCreateResponse> {
    console.log('🎬 Creating D-ID video talk with audio:', { sourceUrl, audioUrl, options });
    return apiService.createDIdVideoTalkWithAudio(
      sourceUrl,
      audioUrl,
      options?.driverUrl,
      options?.webhook
    );
  }

  /**
   * Создание видео talk с файлами (автоматическая загрузка)
   */
  async createVideoTalkWithFiles(
    imageFile: File,
    audioFile: File,
    options?: {
      driverUrl?: string;
      webhook?: string;
      stitch?: boolean;
    }
  ): Promise<DIdTalkCreateResponse> {
    console.log('🎬 Creating D-ID video talk with files:', { 
      imageFile: imageFile.name, 
      audioFile: audioFile.name, 
      options 
    });
    return apiService.createDIdVideoTalkWithFiles(imageFile, audioFile, options);
  }

  /**
   * Получение статуса видео talk
   */
  async getVideoTalkStatus(talkId: string): Promise<DIdTalkStatusResponse> {
    console.log('📊 Getting D-ID video talk status:', talkId);
    return apiService.getDIdVideoTalkStatus(talkId);
  }

  /**
   * Отмена видео talk
   */
  async cancelVideoTalk(talkId: string): Promise<void> {
    console.log('❌ Cancelling D-ID video talk:', talkId);
    await apiService.cancelDIdVideoTalk(talkId);
  }

  /**
   * Мониторинг статуса видео talk с автоматическим опросом
   */
  async monitorVideoTalkStatus(
    talkId: string,
    options?: {
      onStatusUpdate?: (status: string, data: any) => void;
      maxAttempts?: number;
      intervalMs?: number;
    }
  ): Promise<DIdTalkStatusResponse> {
    console.log('👀 Starting D-ID video talk status monitoring:', talkId);
    return apiService.monitorDIdVideoTalkStatus(
      talkId,
      options?.onStatusUpdate,
      options?.maxAttempts,
      options?.intervalMs
    );
  }

  /**
   * Создание и мониторинг видео talk с текстом
   */
  async createAndMonitorVideoTalkWithText(
    sourceUrl: string,
    text: string,
    options?: {
      voiceId?: string;
      driverUrl?: string;
      webhook?: string;
      onStatusUpdate?: (status: string, data: any) => void;
      maxAttempts?: number;
      intervalMs?: number;
    }
  ): Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }> {
    console.log('🎬 Creating and monitoring D-ID video talk with text:', { sourceUrl, text, options });
    
    // Создаем видео talk
    const createResponse = await this.createVideoTalkWithText(sourceUrl, text, {
      voiceId: options?.voiceId,
      driverUrl: options?.driverUrl,
      webhook: options?.webhook
    });

    // Мониторим статус
    const finalStatus = await this.monitorVideoTalkStatus(createResponse.data.id, {
      onStatusUpdate: options?.onStatusUpdate,
      maxAttempts: options?.maxAttempts,
      intervalMs: options?.intervalMs
    });

    return { createResponse, finalStatus };
  }

  /**
   * Создание и мониторинг видео talk с аудио
   */
  async createAndMonitorVideoTalkWithAudio(
    sourceUrl: string,
    audioUrl: string,
    options?: {
      driverUrl?: string;
      webhook?: string;
      onStatusUpdate?: (status: string, data: any) => void;
      maxAttempts?: number;
      intervalMs?: number;
    }
  ): Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }> {
    console.log('🎬 Creating and monitoring D-ID video talk with audio:', { sourceUrl, audioUrl, options });
    
    // Создаем видео talk
    const createResponse = await this.createVideoTalkWithAudio(sourceUrl, audioUrl, {
      driverUrl: options?.driverUrl,
      webhook: options?.webhook
    });

    // Мониторим статус
    const finalStatus = await this.monitorVideoTalkStatus(createResponse.data.id, {
      onStatusUpdate: options?.onStatusUpdate,
      maxAttempts: options?.maxAttempts,
      intervalMs: options?.intervalMs
    });

    console.log('🎬 Final status from monitoring:', finalStatus);
    console.log('🎬 Final status data:', finalStatus.data);
    console.log('🎬 Result URL from monitoring:', finalStatus.data?.result_url);
    console.log('🎬 Full finalStatus object:', JSON.stringify(finalStatus, null, 2));

    return { createResponse, finalStatus };
  }

  /**
   * Создание и мониторинг видео talk с файлами
   */
  async createAndMonitorVideoTalkWithFiles(
    imageFile: File,
    audioFile: File,
    options?: {
      driverUrl?: string;
      webhook?: string;
      stitch?: boolean;
      onStatusUpdate?: (status: string, data: any) => void;
      maxAttempts?: number;
      intervalMs?: number;
    }
  ): Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }> {
    console.log('🎬 Creating and monitoring D-ID video talk with files:', { 
      imageFile: imageFile.name, 
      audioFile: audioFile.name, 
      options 
    });
    
    // Создаем видео talk
    const createResponse = await this.createVideoTalkWithFiles(imageFile, audioFile, {
      driverUrl: options?.driverUrl,
      webhook: options?.webhook,
      stitch: options?.stitch
    });

    // Мониторим статус
    const finalStatus = await this.monitorVideoTalkStatus(createResponse.data.id, {
      onStatusUpdate: options?.onStatusUpdate,
      maxAttempts: options?.maxAttempts,
      intervalMs: options?.intervalMs
    });

    return { createResponse, finalStatus };
  }

  /**
   * Получение URL для проигрывания видео
   */
  getVideoUrl(talkStatus: DIdTalkStatusResponse): string | null {
    return talkStatus.data?.result_url || null;
  }

  /**
   * Проверка, завершен ли видео talk
   */
  isVideoTalkCompleted(talkStatus: DIdTalkStatusResponse): boolean {
    return talkStatus.data?.status === 'done' || talkStatus.data?.status === 'completed';
  }

  /**
   * Проверка, завершился ли видео talk с ошибкой
   */
  isVideoTalkFailed(talkStatus: DIdTalkStatusResponse): boolean {
    return talkStatus.data?.status === 'failed' || talkStatus.data?.status === 'rejected';
  }

  /**
   * Получение информации о прогрессе видео talk
   */
  getVideoTalkProgress(talkStatus: DIdTalkStatusResponse): {
    status: string;
    duration?: number;
    metadata?: any;
  } {
    return {
      status: talkStatus.data?.status || 'unknown',
      duration: talkStatus.data?.duration,
      metadata: talkStatus.data?.metadata
    };
  }
}

// Экспортируем экземпляр по умолчанию
export const dIdVideoTalksService = DIdVideoTalksService.getInstance();
