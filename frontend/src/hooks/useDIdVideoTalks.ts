import { useState, useCallback } from 'react';
import { dIdVideoTalksService } from '../services/dIdVideoTalksService';
import { 
  DIdTalkRequest, 
  DIdTalkCreateResponse, 
  DIdTalkStatusResponse 
} from '../types';

export interface UseDIdVideoTalksOptions {
  onStatusUpdate?: (status: string, data: any) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: DIdTalkStatusResponse) => void;
  maxAttempts?: number;
  intervalMs?: number;
}

export interface UseDIdVideoTalksReturn {
  // Состояние
  isLoading: boolean;
  isCreating: boolean;
  isMonitoring: boolean;
  error: string | null;
  currentTalkId: string | null;
  currentStatus: string | null;
  videoUrl: string | null;
  
  // Методы
  createVideoTalk: (request: DIdTalkRequest) => Promise<DIdTalkCreateResponse>;
  createVideoTalkWithText: (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ) => Promise<DIdTalkCreateResponse>;
  createVideoTalkWithAudio: (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ) => Promise<DIdTalkCreateResponse>;
  createVideoTalkWithFiles: (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean }
  ) => Promise<DIdTalkCreateResponse>;
  
  // Мониторинг
  getVideoTalkStatus: (talkId: string) => Promise<DIdTalkStatusResponse>;
  monitorVideoTalkStatus: (talkId: string) => Promise<DIdTalkStatusResponse>;
  cancelVideoTalk: (talkId: string) => Promise<void>;
  
  // Комбинированные методы
  createAndMonitorVideoTalkWithText: (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ) => Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }>;
  createAndMonitorVideoTalkWithAudio: (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ) => Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }>;
  createAndMonitorVideoTalkWithFiles: (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean }
  ) => Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }>;
  
  // Утилиты
  reset: () => void;
  isCompleted: boolean;
  isFailed: boolean;
}

export function useDIdVideoTalks(options: UseDIdVideoTalksOptions = {}): UseDIdVideoTalksReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTalkId, setCurrentTalkId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [lastStatusResponse, setLastStatusResponse] = useState<DIdTalkStatusResponse | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error('D-ID Talks error:', err);
    setError(err.message);
    options.onError?.(err);
  }, [options]);

  const handleStatusUpdate = useCallback((status: string, data: any) => {
    setCurrentStatus(status);
    setVideoUrl(data?.result_url || null);
    options.onStatusUpdate?.(status, data);
  }, [options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsCreating(false);
    setIsMonitoring(false);
    setError(null);
    setCurrentTalkId(null);
    setCurrentStatus(null);
    setVideoUrl(null);
    setLastStatusResponse(null);
  }, []);

  const createVideoTalk = useCallback(async (request: DIdTalkRequest): Promise<DIdTalkCreateResponse> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await dIdVideoTalksService.createVideoTalk(request);
      setCurrentTalkId(response.data.id);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [handleError]);

  const createVideoTalkWithText = useCallback(async (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ): Promise<DIdTalkCreateResponse> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await dIdVideoTalksService.createVideoTalkWithText(sourceUrl, text, options);
      setCurrentTalkId(response.data.id);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [handleError]);

  const createVideoTalkWithAudio = useCallback(async (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ): Promise<DIdTalkCreateResponse> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await dIdVideoTalksService.createVideoTalkWithAudio(sourceUrl, audioUrl, options);
      setCurrentTalkId(response.data.id);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [handleError]);

  const createVideoTalkWithFiles = useCallback(async (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean }
  ): Promise<DIdTalkCreateResponse> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await dIdVideoTalksService.createVideoTalkWithFiles(imageFile, audioFile, options);
      setCurrentTalkId(response.data.id);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [handleError]);

  const getVideoTalkStatus = useCallback(async (talkId: string): Promise<DIdTalkStatusResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dIdVideoTalksService.getVideoTalkStatus(talkId);
      setLastStatusResponse(response);
      handleStatusUpdate(response.data.status, response.data);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate]);

  const monitorVideoTalkStatus = useCallback(async (talkId: string): Promise<DIdTalkStatusResponse> => {
    try {
      setIsMonitoring(true);
      setError(null);
      
      const response = await dIdVideoTalksService.monitorVideoTalkStatus(talkId, {
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options.maxAttempts,
        intervalMs: options.intervalMs
      });
      
      setLastStatusResponse(response);
      setVideoUrl(response.data?.result_url || null);
      options.onSuccess?.(response);
      
      return response;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsMonitoring(false);
    }
  }, [handleError, handleStatusUpdate, options]);

  const cancelVideoTalk = useCallback(async (talkId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await dIdVideoTalksService.cancelVideoTalk(talkId);
      
      if (currentTalkId === talkId) {
        setCurrentTalkId(null);
        setCurrentStatus('cancelled');
      }
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, currentTalkId]);

  const createAndMonitorVideoTalkWithText = useCallback(async (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string; maxAttempts?: number; intervalMs?: number }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithText(sourceUrl, text, {
        voiceId: options?.voiceId,
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options?.maxAttempts,
        intervalMs: options?.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      options?.onSuccess?.(result.finalStatus);
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate]);

  const createAndMonitorVideoTalkWithAudio = useCallback(async (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string; maxAttempts?: number; intervalMs?: number }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithAudio(sourceUrl, audioUrl, {
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options?.maxAttempts,
        intervalMs: options?.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      
      // Вызываем onSuccess callback с правильной структурой
      if (options?.onSuccess) {
        console.log('🎭 Calling onSuccess callback with finalStatus:', result.finalStatus);
        console.log('🎭 Final status data:', result.finalStatus.data);
        console.log('🎭 Result URL in finalStatus:', result.finalStatus.data?.result_url);
        options.onSuccess(result.finalStatus);
      }
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate]);

  const createAndMonitorVideoTalkWithFiles = useCallback(async (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean; maxAttempts?: number; intervalMs?: number }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithFiles(imageFile, audioFile, {
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        stitch: options?.stitch,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options?.maxAttempts,
        intervalMs: options?.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      options?.onSuccess?.(result.finalStatus);
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate]);

  const isCompleted = lastStatusResponse ? dIdVideoTalksService.isVideoTalkCompleted(lastStatusResponse) : false;
  const isFailed = lastStatusResponse ? dIdVideoTalksService.isVideoTalkFailed(lastStatusResponse) : false;

  return {
    // Состояние
    isLoading,
    isCreating,
    isMonitoring,
    error,
    currentTalkId,
    currentStatus,
    videoUrl,
    
    // Методы
    createVideoTalk,
    createVideoTalkWithText,
    createVideoTalkWithAudio,
    createVideoTalkWithFiles,
    
    // Мониторинг
    getVideoTalkStatus,
    monitorVideoTalkStatus,
    cancelVideoTalk,
    
    // Комбинированные методы
    createAndMonitorVideoTalkWithText,
    createAndMonitorVideoTalkWithAudio,
    createAndMonitorVideoTalkWithFiles,
    
    // Утилиты
    reset,
    isCompleted,
    isFailed
  };
}
