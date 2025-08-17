import { useState, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useDIdVideoTalks } from '../useDIdVideoTalks';

// URL для аудио тишины
const SILENCE_AUDIO_URL = 'https://res.cloudinary.com/daeoqig4w/video/upload/v1755390577/10-seconds-of-silence-made-with-Voicemod_smj5fh.mp3';

export interface UseAvatarCreationOptions {
  onAvatarCreated?: (videoUrl: string) => void;
  onError?: (error: Error) => void;
  onStatusUpdate?: (status: string, data: any) => void;
}

export interface UseAvatarCreationReturn {
  // Состояние
  isCreating: boolean;
  error: string | null;
  currentStatus: string | null;
  
  // Методы
  createAvatar: (imageFile: File) => Promise<string>;
  createAvatarFromUrl: (imageUrl: string) => Promise<string>;
  
  // Утилиты
  reset: () => void;
  isCompleted: boolean;
  isFailed: boolean;
}

export function useAvatarCreation(options: UseAvatarCreationOptions = {}): UseAvatarCreationReturn {
  const { 
    setAvatarImageUrl, 
    setDefaultVideoUrl, 
    setIsLoading, 
    setError: setContextError 
  } = useAppContext();

  const {
    createAndMonitorVideoTalkWithAudio,
    isLoading: isDIdLoading,
    error: dIdError,
    currentStatus,
    reset: resetDId,
    isCompleted,
    isFailed
  } = useDIdVideoTalks({
    onStatusUpdate: options.onStatusUpdate,
    onError: options.onError,
    onSuccess: (result) => {
      console.log('🎭 onSuccess callback called with result:', result);
      console.log('🎭 Result data:', result.data);
      console.log('🎭 Result URL in callback:', result.data?.result_url);
      console.log('🎭 Full result object:', JSON.stringify(result, null, 2));
      
      if (result.data?.result_url) {
        console.log('🎬 Setting video URL in context from onSuccess:', result.data.result_url);
        // Устанавливаем новое видео в контекст
        setDefaultVideoUrl(result.data.result_url);
        options.onAvatarCreated?.(result.data.result_url);
        console.log('🎬 defaultVideoUrl should be updated now');
      } else {
        console.warn('🎭 No result_url in onSuccess callback');
        console.warn('🎭 Result keys:', Object.keys(result));
        console.warn('🎭 Result data keys:', result.data ? Object.keys(result.data) : 'data is null/undefined');
      }
    }
  });

  const [isCreating, setIsCreating] = useState(false);

  // Обработка ошибок
  const handleError = useCallback((error: Error) => {
    console.error('Avatar creation error:', error);
    setContextError(error.message);
    options.onError?.(error);
  }, [setContextError, options]);

  // Создание аватара из файла
  const createAvatar = useCallback(async (imageFile: File): Promise<string> => {
    try {
      setIsCreating(true);
      setIsLoading(true);
      setContextError(null);

      // 1. Создаем URL для изображения для предварительного просмотра
      const imageUrl = URL.createObjectURL(imageFile);
      
      // 2. Устанавливаем avatarImageUrl в контексте для предварительного просмотра
      setAvatarImageUrl(imageUrl);

      console.log('🎭 Creating avatar with image:', imageFile.name);

                        // 3. Загружаем изображение на D-ID сервер
                  console.log('📤 Uploading image to D-ID...');
                  const apiService = new (await import('../../services/api/ApiService')).ApiService();
                  
                  // Очищаем имя файла для D-ID API (только a-z, A-Z, 0-9, ., _, -)
                  const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                  const cleanFile = new File([imageFile], cleanFileName, { type: imageFile.type });
                  
                  console.log('📤 Original filename:', imageFile.name);
                  console.log('📤 Clean filename:', cleanFileName);
                  
                  const uploadResponse = await apiService.uploadImageToDId(cleanFile);
      
      if (!uploadResponse.success || !uploadResponse.data?.url) {
        throw new Error('Failed to upload image to D-ID: ' + (uploadResponse.message || 'Unknown error'));
      }
      
      const dIdImageUrl = uploadResponse.data.url;
      console.log('✅ Image uploaded to D-ID:', dIdImageUrl);

      // 4. Вызываем createDIdVideoTalkWithAudio с загруженным изображением и аудио тишины
      const { finalStatus } = await createAndMonitorVideoTalkWithAudio(
        dIdImageUrl,
        SILENCE_AUDIO_URL,
        {
          onSuccess: (result) => {
            console.log('🎭 onSuccess callback called from createAndMonitorVideoTalkWithAudio:', result);
            if (result.data?.result_url) {
              console.log('🎬 Setting video URL in context from direct call:', result.data.result_url);
              setDefaultVideoUrl(result.data.result_url);
              options.onAvatarCreated?.(result.data.result_url);
            }
          }
        }
      );

      console.log('🎭 Final status received:', finalStatus);
      console.log('🎭 Final status data:', finalStatus.data);
      console.log('🎭 Result URL:', finalStatus.data?.result_url);
      console.log('🎭 Full finalStatus object:', JSON.stringify(finalStatus, null, 2));

      if (!finalStatus.data?.result_url) {
        console.error('🎭 No result_url found in finalStatus:', finalStatus);
        console.error('🎭 Final status keys:', Object.keys(finalStatus));
        console.error('🎭 Final status data keys:', finalStatus.data ? Object.keys(finalStatus.data) : 'data is null/undefined');
        throw new Error('Failed to create avatar: no video URL received');
      }

      // 5. Устанавливаем defaultVideoUrl и перезапускаем видеоплеер
      console.log('🎬 Setting defaultVideoUrl in context:', finalStatus.data.result_url);
      setDefaultVideoUrl(finalStatus.data.result_url);
      
      console.log('✅ Avatar created successfully:', finalStatus.data.result_url);
      console.log('🎬 Video URL for player:', finalStatus.data.result_url);
      
      // Проверяем, что URL действительно установлен
      setTimeout(() => {
        console.log('🎬 Checking if defaultVideoUrl was set correctly...');
      }, 100);
      
      return finalStatus.data.result_url;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      handleError(new Error(errorMessage));
      throw error;
    } finally {
      setIsCreating(false);
      setIsLoading(false);
    }
  }, [
    setIsCreating,
    setIsLoading,
    setContextError,
    setAvatarImageUrl,
    setDefaultVideoUrl,
    createAndMonitorVideoTalkWithAudio,
    handleError
  ]);

  // Создание аватара из URL
  const createAvatarFromUrl = useCallback(async (imageUrl: string): Promise<string> => {
    try {
      setIsCreating(true);
      setIsLoading(true);
      setContextError(null);

      // 1. Устанавливаем avatarImageUrl в контексте
      setAvatarImageUrl(imageUrl);

      console.log('🎭 Creating avatar with image URL:', imageUrl);

      // 2. Вызываем createDIdVideoTalkWithAudio с изображением и аудио тишины
      const { finalStatus } = await createAndMonitorVideoTalkWithAudio(
        imageUrl,
        SILENCE_AUDIO_URL
      );

      console.log('🎭 Final status received:', finalStatus);
      console.log('🎭 Final status data:', finalStatus.data);
      console.log('🎭 Result URL:', finalStatus.data?.result_url);

      if (!finalStatus.data?.result_url) {
        console.error('🎭 No result_url found in finalStatus:', finalStatus);
        throw new Error('Failed to create avatar: no video URL received');
      }

      // 3. Устанавливаем defaultVideoUrl и перезапускаем видеоплеер
      setDefaultVideoUrl(finalStatus.data.result_url);
      
      console.log('✅ Avatar created successfully:', finalStatus.data.result_url);
      
      return finalStatus.data.result_url;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      handleError(new Error(errorMessage));
      throw error;
    } finally {
      setIsCreating(false);
      setIsLoading(false);
    }
  }, [
    setIsCreating,
    setIsLoading,
    setContextError,
    setAvatarImageUrl,
    setDefaultVideoUrl,
    createAndMonitorVideoTalkWithAudio,
    handleError
  ]);

  // Сброс состояния
  const reset = useCallback(() => {
    setIsCreating(false);
    resetDId();
  }, [resetDId]);

  return {
    isCreating: isCreating || isDIdLoading,
    error: dIdError,
    currentStatus,
    createAvatar,
    createAvatarFromUrl,
    reset,
    isCompleted,
    isFailed
  };
}
