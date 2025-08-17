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
  createTalk: (request: DIdTalkRequest) => Promise<DIdTalkCreateResponse>;
  createTalkWithText: (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ) => Promise<DIdTalkCreateResponse>;
  createTalkWithAudio: (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ) => Promise<DIdTalkCreateResponse>;
  createTalkWithFiles: (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean }
  ) => Promise<DIdTalkCreateResponse>;
  
  // Мониторинг
  getTalkStatus: (talkId: string) => Promise<DIdTalkStatusResponse>;
  monitorTalkStatus: (talkId: string) => Promise<DIdTalkStatusResponse>;
  cancelTalk: (talkId: string) => Promise<void>;
  
  // Комбинированные методы
  createAndMonitorTalkWithText: (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ) => Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }>;
  createAndMonitorTalkWithAudio: (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ) => Promise<{ createResponse: DIdTalkCreateResponse; finalStatus: DIdTalkStatusResponse }>;
  createAndMonitorTalkWithFiles: (
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

  const createTalk = useCallback(async (request: DIdTalkRequest): Promise<DIdTalkCreateResponse> => {
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

  const createTalkWithText = useCallback(async (
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

  const createTalkWithAudio = useCallback(async (
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

  const createTalkWithFiles = useCallback(async (
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

  const getTalkStatus = useCallback(async (talkId: string): Promise<DIdTalkStatusResponse> => {
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

  const monitorTalkStatus = useCallback(async (talkId: string): Promise<DIdTalkStatusResponse> => {
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

  const cancelTalk = useCallback(async (talkId: string): Promise<void> => {
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

  const createAndMonitorTalkWithText = useCallback(async (
    sourceUrl: string, 
    text: string, 
    options?: { voiceId?: string; driverUrl?: string; webhook?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithText(sourceUrl, text, {
        voiceId: options?.voiceId,
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options.maxAttempts,
        intervalMs: options.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      options.onSuccess?.(result.finalStatus);
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate, options]);

  const createAndMonitorTalkWithAudio = useCallback(async (
    sourceUrl: string, 
    audioUrl: string, 
    options?: { driverUrl?: string; webhook?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithAudio(sourceUrl, audioUrl, {
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options.maxAttempts,
        intervalMs: options.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      options.onSuccess?.(result.finalStatus);
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate, options]);

  const createAndMonitorTalkWithFiles = useCallback(async (
    imageFile: File, 
    audioFile: File, 
    options?: { driverUrl?: string; webhook?: string; stitch?: boolean }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dIdVideoTalksService.createAndMonitorVideoTalkWithFiles(imageFile, audioFile, {
        driverUrl: options?.driverUrl,
        webhook: options?.webhook,
        stitch: options?.stitch,
        onStatusUpdate: handleStatusUpdate,
        maxAttempts: options.maxAttempts,
        intervalMs: options.intervalMs
      });
      
      setCurrentTalkId(result.createResponse.data.id);
      setLastStatusResponse(result.finalStatus);
      setVideoUrl(result.finalStatus.data?.result_url || null);
      options.onSuccess?.(result.finalStatus);
      
      return result;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleStatusUpdate, options]);

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
    createTalk,
    createTalkWithText,
    createTalkWithAudio,
    createTalkWithFiles,
    
    // Мониторинг
    getTalkStatus,
    monitorTalkStatus,
    cancelTalk,
    
    // Комбинированные методы
    createAndMonitorTalkWithText,
    createAndMonitorTalkWithAudio,
    createAndMonitorTalkWithFiles,
    
    // Утилиты
    reset,
    isCompleted,
    isFailed
  };
}
