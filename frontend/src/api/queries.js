import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// === QUERIES ===

// Получение голосов
export const useVoicesQuery = () => {
  return useQuery({
    queryKey: ['voices'],
    queryFn: async () => {
      const response = await apiService.getVoices();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch voices');
      }
      return response.voices || [];
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 3,
    retryDelay: 1000
  });
};

// Получение статуса стрима
export const useStreamStatusQuery = (streamId, enabled = false) => {
  return useQuery({
    queryKey: ['stream-status', streamId],
    queryFn: async () => {
      const response = await apiService.getStreamStatus(streamId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch stream status');
      }
      return response;
    },
    enabled: enabled && !!streamId,
    refetchInterval: enabled ? 5000 : false, // Обновляем каждые 5 секунд если включено
    retry: 2
  });
};

// === MUTATIONS ===

// Создание стрима
export const useCreateStreamMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ imageUrl, description }) => {
      const response = await apiService.createDIdStream(imageUrl, description);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create stream');
      }
      return response;
    },
    onSuccess: (data) => {
      // Инвалидируем кэш статуса стрима
      queryClient.invalidateQueries({ queryKey: ['stream-status', data.stream_id] });
    },
    onError: (error) => {
      console.error('❌ Create stream mutation error:', error);
    }
  });
};

// Запуск стрима
export const useStartStreamMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, sessionId, sdpAnswer }) => {
      const response = await apiService.startDIdStream(streamId, sessionId, sdpAnswer);
      if (!response.success) {
        throw new Error(response.error || 'Failed to start stream');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Инвалидируем кэш статуса стрима
      queryClient.invalidateQueries({ queryKey: ['stream-status', variables.streamId] });
    },
    onError: (error) => {
      console.error('❌ Start stream mutation error:', error);
    }
  });
};

// Отправка ICE кандидата
export const useSubmitIceCandidateMutation = () => {
  return useMutation({
    mutationFn: async ({ streamId, sessionId, candidate, sdpMid, sdpMLineIndex }) => {
      const response = await apiService.submitDIdIceCandidate(
        streamId,
        sessionId,
        candidate,
        sdpMid,
        sdpMLineIndex
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit ICE candidate');
      }
      return response;
    },
    onError: (error) => {
      console.error('❌ Submit ICE candidate mutation error:', error);
    }
  });
};

// Создание talk
export const useCreateTalkMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, sessionId, script }) => {
      const response = await apiService.createDIdTalk(streamId, sessionId, script);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create talk');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Инвалидируем кэш статуса стрима
      queryClient.invalidateQueries({ queryKey: ['stream-status', variables.streamId] });
    },
    onError: (error) => {
      console.error('❌ Create talk mutation error:', error);
    }
  });
};

// Создание talk с аудио
export const useCreateTalkAudioMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, sessionId, audioUrl, voiceId }) => {
      const response = await apiService.createDIdTalkAudio(streamId, sessionId, audioUrl, voiceId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create talk with audio');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Инвалидируем кэш статуса стрима
      queryClient.invalidateQueries({ queryKey: ['stream-status', variables.streamId] });
    },
    onError: (error) => {
      console.error('❌ Create talk audio mutation error:', error);
    }
  });
};

// Закрытие стрима
export const useCloseStreamMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, sessionId }) => {
      const response = await apiService.closeDIdStream(streamId, sessionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to close stream');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Удаляем кэш статуса стрима
      queryClient.removeQueries({ queryKey: ['stream-status', variables.streamId] });
    },
    onError: (error) => {
      console.error('❌ Close stream mutation error:', error);
    }
  });
};

// Загрузка изображения
export const useUploadImageMutation = () => {
  return useMutation({
    mutationFn: async (file) => {
      const response = await apiService.uploadImage(file);
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload image');
      }
      return response;
    },
    onError: (error) => {
      console.error('❌ Upload image mutation error:', error);
    }
  });
};

// === CUSTOM HOOKS ===

// Хук для работы с голосами
export const useVoices = () => {
  const {
    data: voices = [],
    isLoading: loadingVoices,
    error: voicesError,
    refetch: retryFetchVoices
  } = useVoicesQuery();

  return {
    voices,
    loadingVoices,
    voicesError: voicesError?.message,
    retryFetchVoices
  };
};

// Хук для работы со стримом
export const useStreamOperations = () => {
  const createStreamMutation = useCreateStreamMutation();
  const startStreamMutation = useStartStreamMutation();
  const submitIceCandidateMutation = useSubmitIceCandidateMutation();
  const createTalkMutation = useCreateTalkMutation();
  const createTalkAudioMutation = useCreateTalkAudioMutation();
  const closeStreamMutation = useCloseStreamMutation();

  return {
    createStream: createStreamMutation.mutateAsync,
    startStream: startStreamMutation.mutateAsync,
    submitIceCandidate: submitIceCandidateMutation.mutateAsync,
    createTalk: createTalkMutation.mutateAsync,
    createTalkAudio: createTalkAudioMutation.mutateAsync,
    closeStream: closeStreamMutation.mutateAsync,
    isLoading: createStreamMutation.isPending || startStreamMutation.isPending,
    error: createStreamMutation.error || startStreamMutation.error
  };
};
