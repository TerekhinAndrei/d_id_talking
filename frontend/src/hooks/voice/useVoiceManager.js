import { useState, useCallback, useReducer, useMemo, useRef } from 'react';
import { ServiceFactory } from '../../core/factories/ServiceFactory.js';

// Reducer для управления состоянием голосов
const voiceReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_VOICES_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'FETCH_VOICES_SUCCESS':
      return {
        ...state,
        loading: false,
        voices: action.payload,
        error: null
      };
    
    case 'FETCH_VOICES_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'SELECT_VOICE':
      return {
        ...state,
        selectedVoice: action.payload
      };
    
    case 'PLAY_VOICE_START':
      return {
        ...state,
        isPlaying: true,
        isProcessing: true,
        error: null
      };
    
    case 'PLAY_VOICE_SUCCESS':
      return {
        ...state,
        isPlaying: false,
        isProcessing: false,
        audioData: action.payload,
        error: null
      };
    
    case 'PLAY_VOICE_ERROR':
      return {
        ...state,
        isPlaying: false,
        isProcessing: false,
        error: action.payload
      };
    
    case 'GENERATE_TTS_START':
      return {
        ...state,
        isProcessing: true,
        error: null
      };
    
    case 'GENERATE_TTS_SUCCESS':
      return {
        ...state,
        isProcessing: false,
        lastGeneratedAudio: action.payload,
        error: null
      };
    
    case 'GENERATE_TTS_ERROR':
      return {
        ...state,
        isProcessing: false,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'CLEAR_STATE':
      return {
        ...state,
        isPlaying: false,
        isProcessing: false,
        audioData: null,
        lastGeneratedAudio: null,
        error: null
      };
    
    default:
      return state;
  }
};

// Начальное состояние
const initialState = {
  voices: [],
  selectedVoice: null,
  loading: false,
  error: null,
  isPlaying: false,
  isProcessing: false,
  audioData: null,
  lastGeneratedAudio: null
};

/**
 * Хук для управления голосами
 * @param {'elevenlabs'|'microsoft'|'custom'} serviceType - Тип сервиса голосов
 * @returns {Object} Объект с состоянием и методами управления голосами
 */
export const useVoiceManager = (serviceType = 'elevenlabs') => {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const voiceServiceRef = useRef(null);

  // Создаем сервис голосов
  const voiceService = useMemo(async () => {
    if (!voiceServiceRef.current) {
      try {
        // Создаем API клиент
        const apiClient = await ServiceFactory.createApiClient('fetch', '/api/v1');
        // Создаем сервис голосов
        voiceServiceRef.current = await ServiceFactory.createVoiceService(serviceType, apiClient);
      } catch (error) {
        console.error('Error creating voice service:', error);
        dispatch({ type: 'FETCH_VOICES_ERROR', payload: error.message });
      }
    }
    return voiceServiceRef.current;
  }, [serviceType]);

  // Получение списка голосов
  const fetchVoices = useCallback(async () => {
    try {
      dispatch({ type: 'FETCH_VOICES_START' });
      
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      const voices = await service.getVoices();
      dispatch({ type: 'FETCH_VOICES_SUCCESS', payload: voices });
      
      return voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      dispatch({ type: 'FETCH_VOICES_ERROR', payload: error.message });
      throw error;
    }
  }, [voiceService]);

  // Выбор голоса
  const selectVoice = useCallback((voiceId) => {
    dispatch({ type: 'SELECT_VOICE', payload: voiceId });
  }, []);

  // Воспроизведение голоса
  const playVoice = useCallback(async (voiceId, previewText = "Привет! Это пример голоса.") => {
    try {
      dispatch({ type: 'PLAY_VOICE_START' });
      
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      const result = await service.playVoice(voiceId, previewText);
      
      if (result.success) {
        dispatch({ type: 'PLAY_VOICE_SUCCESS', payload: result });
        return result;
      } else {
        throw new Error(result.error || 'Failed to play voice');
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      dispatch({ type: 'PLAY_VOICE_ERROR', payload: error.message });
      throw error;
    }
  }, [voiceService]);

  // Генерация TTS
  const generateTTS = useCallback(async (text, voiceId, settings = null) => {
    try {
      dispatch({ type: 'GENERATE_TTS_START' });
      
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      const result = await service.textToSpeech(text, voiceId, settings);
      
      if (result.success) {
        dispatch({ type: 'GENERATE_TTS_SUCCESS', payload: result });
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate TTS');
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      dispatch({ type: 'GENERATE_TTS_ERROR', payload: error.message });
      throw error;
    }
  }, [voiceService]);

  // Генерация STS
  const generateSTS = useCallback(async (audioFile, voiceId, settings = null) => {
    try {
      dispatch({ type: 'GENERATE_TTS_START' });
      
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      const result = await service.speechToSpeech(audioFile, voiceId, settings);
      
      if (result.success) {
        dispatch({ type: 'GENERATE_TTS_SUCCESS', payload: result });
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate STS');
      }
    } catch (error) {
      console.error('Error generating STS:', error);
      dispatch({ type: 'GENERATE_TTS_ERROR', payload: error.message });
      throw error;
    }
  }, [voiceService]);

  // Валидация голоса
  const validateVoice = useCallback(async (voiceId) => {
    try {
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      return await service.validateVoice(voiceId);
    } catch (error) {
      console.error('Error validating voice:', error);
      return false;
    }
  }, [voiceService]);

  // Тестирование аутентификации
  const testAuth = useCallback(async () => {
    try {
      const service = await voiceService;
      if (!service) {
        throw new Error('Voice service not available');
      }

      return await service.testAuth();
    } catch (error) {
      console.error('Error testing auth:', error);
      return { success: false, error: error.message };
    }
  }, [voiceService]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Очистка состояния
  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  // Получение информации о голосе
  const getVoiceInfo = useCallback((voiceId) => {
    return state.voices.find(voice => voice.voice_id === voiceId);
  }, [state.voices]);

  return {
    // Состояние
    state,
    
    // Методы
    fetchVoices,
    selectVoice,
    playVoice,
    generateTTS,
    generateSTS,
    validateVoice,
    testAuth,
    clearError,
    clearState,
    getVoiceInfo,
    
    // Вычисляемые свойства
    selectedVoiceInfo: state.selectedVoice ? getVoiceInfo(state.selectedVoice) : null,
    hasVoices: state.voices.length > 0,
    isLoading: state.loading || state.isProcessing
  };
};
