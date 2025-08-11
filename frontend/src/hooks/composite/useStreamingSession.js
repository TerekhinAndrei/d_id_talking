import { useCallback, useMemo } from 'react';
import { useStreamingManager } from '../streaming/useStreamingManager.js';
import { useVoiceManager } from '../voice/useVoiceManager.js';

/**
 * Композитный хук для управления всей сессией стриминга
 * Координирует работу стриминга, голосов и аудио
 */
export const useStreamingSession = (config = {}) => {
  const {
    streamingType = 'did',
    voiceType = 'elevenlabs',
    autoConnect = true
  } = config;

  // Инициализируем менеджеры
  const streamingManager = useStreamingManager(streamingType);
  const voiceManager = useVoiceManager(voiceType);

  // Создание и запуск полной сессии
  const startSession = useCallback(async (sessionConfig) => {
    const {
      imageUrl,
      voiceId,
      description = 'Streaming session',
      streamConfig = null
    } = sessionConfig;

    try {
      console.log('🚀 Starting streaming session:', { imageUrl, voiceId });

      // Шаг 1: Создаем стрим
      const streamResult = await streamingManager.createStream({
        imageUrl,
        description,
        config: streamConfig
      });

      if (!streamResult.success) {
        throw new Error('Failed to create stream');
      }

      // Шаг 2: Запускаем стрим
      const startResult = await streamingManager.startStream(
        streamResult.stream_id,
        streamResult.session_id,
        streamResult.sdp_offer,
        streamResult.ice_servers
      );

      if (!startResult.success) {
        throw new Error('Failed to start stream');
      }

      // Шаг 3: Выбираем голос если передан
      if (voiceId) {
        voiceManager.selectVoice(voiceId);
      }

      console.log('✅ Streaming session started successfully');
      
      return {
        success: true,
        streamId: streamResult.stream_id,
        sessionId: streamResult.session_id,
        voiceId: voiceId || voiceManager.state.selectedVoice
      };
    } catch (error) {
      console.error('❌ Error starting streaming session:', error);
      throw error;
    }
  }, [streamingManager, voiceManager]);

  // Создание talk с текстом
  const createTalkWithText = useCallback(async (text, voiceId = null) => {
    try {
      const targetVoiceId = voiceId || voiceManager.state.selectedVoice;
      
      if (!targetVoiceId) {
        throw new Error('No voice selected');
      }

      if (!streamingManager.state.streamId || !streamingManager.state.sessionId) {
        throw new Error('No active stream');
      }

      const script = {
        type: 'text',
        input: text,
        provider: {
          type: voiceType,
          voice_id: targetVoiceId
        }
      };

      const result = await streamingManager.createTalk(
        streamingManager.state.streamId,
        streamingManager.state.sessionId,
        script
      );

      return result;
    } catch (error) {
      console.error('Error creating talk with text:', error);
      throw error;
    }
  }, [streamingManager, voiceManager, voiceType]);

  // Создание talk с аудио
  const createTalkWithAudio = useCallback(async (audioUrl, voiceId = null) => {
    try {
      const targetVoiceId = voiceId || voiceManager.state.selectedVoice;
      
      if (!targetVoiceId) {
        throw new Error('No voice selected');
      }

      if (!streamingManager.state.streamId || !streamingManager.state.sessionId) {
        throw new Error('No active stream');
      }

      const result = await streamingManager.createTalkAudio(
        streamingManager.state.streamId,
        streamingManager.state.sessionId,
        audioUrl,
        targetVoiceId
      );

      return result;
    } catch (error) {
      console.error('Error creating talk with audio:', error);
      throw error;
    }
  }, [streamingManager, voiceManager]);

  // Закрытие сессии
  const closeSession = useCallback(async () => {
    try {
      console.log('🔚 Closing streaming session');
      
      // Закрываем стрим
      await streamingManager.closeStream();
      
      // Очищаем состояние голосов
      voiceManager.clearState();
      
      console.log('✅ Streaming session closed');
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }, [streamingManager, voiceManager]);

  // Получение статуса сессии
  const getSessionStatus = useCallback(() => {
    return {
      stream: {
        isConnected: streamingManager.state.isConnected,
        isActive: streamingManager.state.isActive,
        status: streamingManager.state.status,
        streamId: streamingManager.state.streamId,
        sessionId: streamingManager.state.sessionId
      },
      voice: {
        selectedVoice: voiceManager.state.selectedVoice,
        selectedVoiceInfo: voiceManager.selectedVoiceInfo,
        hasVoices: voiceManager.hasVoices,
        isLoading: voiceManager.isLoading
      },
      errors: {
        streamError: streamingManager.state.error,
        voiceError: voiceManager.state.error
      }
    };
  }, [streamingManager, voiceManager]);

  // Автоматическое подключение при монтировании
  useMemo(() => {
    if (autoConnect && !streamingManager.state.isConnected) {
      // Автоматически загружаем голоса
      voiceManager.fetchVoices().catch(console.error);
    }
  }, [autoConnect, streamingManager.state.isConnected, voiceManager]);

  return {
    // Состояние
    streaming: streamingManager.state,
    voice: voiceManager.state,
    
    // Методы стриминга
    createStream: streamingManager.createStream,
    startStream: streamingManager.startStream,
    closeStream: streamingManager.closeStream,
    
    // Методы голосов
    fetchVoices: voiceManager.fetchVoices,
    selectVoice: voiceManager.selectVoice,
    playVoice: voiceManager.playVoice,
    generateTTS: voiceManager.generateTTS,
    
    // Композитные методы
    startSession,
    createTalkWithText,
    createTalkWithAudio,
    closeSession,
    getSessionStatus,
    
    // Утилиты
    clearErrors: () => {
      streamingManager.clearError();
      voiceManager.clearError();
    },
    
    // Вычисляемые свойства
    isSessionReady: streamingManager.state.isConnected && voiceManager.hasVoices,
    canCreateTalk: streamingManager.state.isConnected && voiceManager.state.selectedVoice,
    hasErrors: !!(streamingManager.state.error || voiceManager.state.error),
    isLoading: streamingManager.state.isCreating || voiceManager.isLoading
  };
};
