import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Контекст для стриминга
const StreamingContext = createContext(null);

// Reducer для управления состоянием стриминга
const streamingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STREAM_STATE':
      return {
        ...state,
        stream: {
          ...state.stream,
          ...action.payload
        }
      };
    
    case 'SET_VOICE_STATE':
      return {
        ...state,
        voice: {
          ...state.voice,
          ...action.payload
        }
      };
    
    case 'SET_SESSION_STATE':
      return {
        ...state,
        session: {
          ...state.session,
          ...action.payload
        }
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
    
    case 'RESET_STATE':
      return {
        stream: {
          isConnected: false,
          isActive: false,
          streamId: null,
          sessionId: null,
          status: 'idle'
        },
        voice: {
          selectedVoice: null,
          voices: [],
          loading: false
        },
        session: {
          isReady: false,
          isCreating: false
        },
        error: null
      };
    
    default:
      return state;
  }
};

// Начальное состояние
const initialState = {
  stream: {
    isConnected: false,
    isActive: false,
    streamId: null,
    sessionId: null,
    status: 'idle'
  },
  voice: {
    selectedVoice: null,
    voices: [],
    loading: false
  },
  session: {
    isReady: false,
    isCreating: false
  },
  error: null
};

/**
 * Провайдер контекста стриминга
 */
export const StreamingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(streamingReducer, initialState);

  // Действия для управления состоянием
  const actions = useMemo(() => ({
    // Действия стрима
    setStreamState: (payload) => dispatch({ type: 'SET_STREAM_STATE', payload }),
    setVoiceState: (payload) => dispatch({ type: 'SET_VOICE_STATE', payload }),
    setSessionState: (payload) => dispatch({ type: 'SET_SESSION_STATE', payload }),
    
    // Действия ошибок
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    
    // Сброс состояния
    resetState: () => dispatch({ type: 'RESET_STATE' }),
    
    // Удобные действия
    setStreamConnected: (isConnected) => 
      dispatch({ type: 'SET_STREAM_STATE', payload: { isConnected } }),
    
    setStreamActive: (isActive) => 
      dispatch({ type: 'SET_STREAM_STATE', payload: { isActive } }),
    
    setStreamId: (streamId) => 
      dispatch({ type: 'SET_STREAM_STATE', payload: { streamId } }),
    
    setSessionId: (sessionId) => 
      dispatch({ type: 'SET_STREAM_STATE', payload: { sessionId } }),
    
    setStreamStatus: (status) => 
      dispatch({ type: 'SET_STREAM_STATE', payload: { status } }),
    
    setSelectedVoice: (selectedVoice) => 
      dispatch({ type: 'SET_VOICE_STATE', payload: { selectedVoice } }),
    
    setVoices: (voices) => 
      dispatch({ type: 'SET_VOICE_STATE', payload: { voices } }),
    
    setVoiceLoading: (loading) => 
      dispatch({ type: 'SET_VOICE_STATE', payload: { loading } }),
    
    setSessionReady: (isReady) => 
      dispatch({ type: 'SET_SESSION_STATE', payload: { isReady } }),
    
    setSessionCreating: (isCreating) => 
      dispatch({ type: 'SET_SESSION_STATE', payload: { isCreating } })
  }), []);

  // Вычисляемые свойства
  const computed = useMemo(() => ({
    // Статус стрима
    isStreamConnected: state.stream.isConnected,
    isStreamActive: state.stream.isActive,
    hasStreamId: !!state.stream.streamId,
    hasSessionId: !!state.stream.sessionId,
    
    // Статус голоса
    hasSelectedVoice: !!state.voice.selectedVoice,
    hasVoices: state.voice.voices.length > 0,
    isVoiceLoading: state.voice.loading,
    
    // Статус сессии
    isSessionReady: state.session.isReady,
    isSessionCreating: state.session.isCreating,
    
    // Общие статусы
    canStartStream: !state.session.isCreating && state.voice.hasVoices,
    canCreateTalk: state.stream.isConnected && state.voice.hasSelectedVoice,
    hasError: !!state.error,
    
    // Полный статус
    status: {
      stream: state.stream.status,
      voice: state.voice.loading ? 'loading' : state.voice.hasVoices ? 'ready' : 'idle',
      session: state.session.isCreating ? 'creating' : state.session.isReady ? 'ready' : 'idle'
    }
  }), [state]);

  const value = useMemo(() => ({
    state,
    actions,
    computed
  }), [state, actions, computed]);

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
};

/**
 * Хук для использования контекста стриминга
 */
export const useStreamingContext = () => {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreamingContext must be used within a StreamingProvider');
  }
  return context;
};

/**
 * Хук для получения только состояния
 */
export const useStreamingState = () => {
  const { state } = useStreamingContext();
  return state;
};

/**
 * Хук для получения только действий
 */
export const useStreamingActions = () => {
  const { actions } = useStreamingContext();
  return actions;
};

/**
 * Хук для получения только вычисляемых свойств
 */
export const useStreamingComputed = () => {
  const { computed } = useStreamingContext();
  return computed;
};
