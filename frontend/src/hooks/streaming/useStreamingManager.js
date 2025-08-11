import { useState, useCallback, useReducer, useMemo, useRef } from 'react';
import { ServiceFactory } from '../../core/factories/ServiceFactory.js';
import { WebRtcManager } from '../../services/webrtc/WebRtcManager.js';

// Reducer для управления состоянием стриминга
const streamingReducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_STREAM_START':
      return {
        ...state,
        isCreating: true,
        status: 'creating',
        error: null
      };
    
    case 'CREATE_STREAM_SUCCESS':
      return {
        ...state,
        isCreating: false,
        status: 'created',
        streamId: action.payload.stream_id,
        sessionId: action.payload.session_id,
        sdpOffer: action.payload.sdp_offer,
        iceServers: action.payload.ice_servers,
        error: null
      };
    
    case 'CREATE_STREAM_ERROR':
      return {
        ...state,
        isCreating: false,
        status: 'error',
        error: action.payload.message
      };
    
    case 'START_STREAM_START':
      return {
        ...state,
        status: 'connecting',
        error: null
      };
    
    case 'START_STREAM_SUCCESS':
      return {
        ...state,
        status: 'connected',
        isConnected: true,
        isActive: true,
        error: null
      };
    
    case 'START_STREAM_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload.message
      };
    
    case 'SET_VIDEO_STREAM':
      return {
        ...state,
        videoStream: action.payload
      };
    
    case 'SET_AUDIO_STREAM':
      return {
        ...state,
        audioStream: action.payload
      };
    
    case 'CLOSE_STREAM':
      return {
        ...state,
        isCreating: false,
        isConnected: false,
        isActive: false,
        streamId: null,
        sessionId: null,
        sdpOffer: null,
        iceServers: null,
        peerConnection: null,
        audioStream: null,
        videoStream: null,
        error: null,
        status: 'idle'
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Начальное состояние
const initialState = {
  isCreating: false,
  isConnected: false,
  isActive: false,
  streamId: null,
  sessionId: null,
  sdpOffer: null,
  iceServers: null,
  peerConnection: null,
  audioStream: null,
  videoStream: null,
  error: null,
  status: 'idle'
};

/**
 * Хук для управления стримингом
 * @param {'did'|'custom'} serviceType - Тип сервиса стриминга
 * @returns {Object} Объект с состоянием и методами управления стримингом
 */
export const useStreamingManager = (serviceType = 'did') => {
  const [state, dispatch] = useReducer(streamingReducer, initialState);
  const streamingServiceRef = useRef(null);
  const webRtcManagerRef = useRef(null);

  // Создаем сервис стриминга
  const streamingService = useMemo(async () => {
    if (!streamingServiceRef.current) {
      try {
        // Создаем API клиент
        const apiClient = await ServiceFactory.createApiClient('fetch', '/api/v1');
        // Создаем сервис стриминга
        streamingServiceRef.current = await ServiceFactory.createStreamingService(serviceType, apiClient);
      } catch (error) {
        console.error('Error creating streaming service:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
    return streamingServiceRef.current;
  }, [serviceType]);

  // Создание стрима
  const createStream = useCallback(async (config) => {
    try {
      dispatch({ type: 'CREATE_STREAM_START' });
      
      const service = await streamingService;
      if (!service) {
        throw new Error('Streaming service not available');
      }

      const result = await service.createStream(config);
      
      if (result.success) {
        dispatch({ type: 'CREATE_STREAM_SUCCESS', payload: result });
        return result;
      } else {
        throw new Error(result.error || 'Failed to create stream');
      }
    } catch (error) {
      console.error('Error creating stream:', error);
      dispatch({ type: 'CREATE_STREAM_ERROR', payload: error });
      throw error;
    }
  }, [streamingService]);

  // Запуск стрима
  const startStream = useCallback(async (streamId, sessionId, sdpOffer, iceServers) => {
    try {
      dispatch({ type: 'START_STREAM_START' });
      
      const service = await streamingService;
      if (!service) {
        throw new Error('Streaming service not available');
      }

      // Создаем WebRTC менеджер
      webRtcManagerRef.current = new WebRtcManager(iceServers, {
        onIceCandidate: async (candidate) => {
          try {
            await service.submitIceCandidate(
              streamId,
              sessionId,
              candidate.candidate,
              candidate.sdpMid,
              candidate.sdpMLineIndex
            );
          } catch (error) {
            console.warn('Error submitting ICE candidate:', error);
          }
        },
        onIceConnectionStateChange: (state) => {
          console.log('ICE connection state:', state);
          if (state === 'connected') {
            dispatch({ type: 'START_STREAM_SUCCESS' });
          }
        },
        onTrack: (event) => {
          if (event.streams[0]) {
            dispatch({ type: 'SET_VIDEO_STREAM', payload: event.streams[0] });
          }
        }
      });

      // Инициализируем WebRTC соединение
      const peerConnection = webRtcManagerRef.current.initialize();
      
      // Устанавливаем удаленное предложение
      await webRtcManagerRef.current.setRemoteOffer(sdpOffer);
      
      // Создаем ответ
      const answer = await webRtcManagerRef.current.createAnswerAndSetLocal();
      
      // Отправляем SDP ответ
      const result = await service.startStream(streamId, sessionId, answer.sdp);
      
      if (result.success) {
        dispatch({ type: 'START_STREAM_SUCCESS' });
        return result;
      } else {
        throw new Error(result.error || 'Failed to start stream');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      dispatch({ type: 'START_STREAM_ERROR', payload: error });
      throw error;
    }
  }, [streamingService]);

  // Создание talk стрима
  const createTalk = useCallback(async (streamId, sessionId, script) => {
    try {
      const service = await streamingService;
      if (!service) {
        throw new Error('Streaming service not available');
      }

      const result = await service.createTalk(streamId, sessionId, script);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create talk');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating talk:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [streamingService]);

  // Создание talk стрима с аудио
  const createTalkAudio = useCallback(async (streamId, sessionId, audioUrl, voiceId) => {
    try {
      const service = await streamingService;
      if (!service) {
        throw new Error('Streaming service not available');
      }

      const result = await service.createTalkAudio(streamId, sessionId, audioUrl, voiceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create talk with audio');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating talk with audio:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [streamingService]);

  // Закрытие стрима
  const closeStream = useCallback(async () => {
    try {
      const service = await streamingService;
      if (!service) {
        throw new Error('Streaming service not available');
      }

      // Закрываем WebRTC соединение
      if (webRtcManagerRef.current) {
        webRtcManagerRef.current.close();
        webRtcManagerRef.current = null;
      }

      // Закрываем стрим на сервере
      if (state.streamId && state.sessionId) {
        await service.closeStream(state.streamId, state.sessionId);
      }

      dispatch({ type: 'CLOSE_STREAM' });
    } catch (error) {
      console.error('Error closing stream:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [streamingService, state.streamId, state.sessionId]);

  // Получение статуса стрима
  const getStreamStatus = useCallback(async () => {
    try {
      const service = await streamingService;
      if (!service || !state.streamId) {
        return null;
      }

      const result = await service.getStreamStatus(state.streamId);
      return result;
    } catch (error) {
      console.error('Error getting stream status:', error);
      return null;
    }
  }, [streamingService, state.streamId]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Сброс состояния
  const resetState = useCallback(() => {
    if (webRtcManagerRef.current) {
      webRtcManagerRef.current.close();
      webRtcManagerRef.current = null;
    }
    dispatch({ type: 'CLOSE_STREAM' });
  }, []);

  return {
    // Состояние
    state,
    
    // Методы
    createStream,
    startStream,
    createTalk,
    createTalkAudio,
    closeStream,
    getStreamStatus,
    clearError,
    resetState,
    
    // WebRTC менеджер
    webRtcManager: webRtcManagerRef.current
  };
};
