import React, { createContext, useContext, useState, ReactNode } from 'react';
import WaitingVideo from '../assets/Waiting.mp4';

// Типы для контекста
interface AppState {
  avatarImage: File | null;
  avatarImageUrl: string | null;
  defaultVideoUrl: string;
  isLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setAvatarImage: (file: File | null) => void;
  setAvatarImageUrl: (url: string | null) => void;
  setDefaultVideoUrl: (url: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetState: () => void;
}

// Создаем контекст
const AppContext = createContext<AppContextType | undefined>(undefined);

// Начальное состояние
const initialState: AppState = {
  avatarImage: null,
  avatarImageUrl: null,
  defaultVideoUrl: WaitingVideo,
  isLoading: false,
  error: null,
};

// Провайдер контекста
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Функции для обновления состояния
  const setAvatarImage = (file: File | null) => {
    setState(prev => ({ ...prev, avatarImage: file }));
  };

  const setAvatarImageUrl = (url: string | null) => {
    setState(prev => ({ ...prev, avatarImageUrl: url }));
  };

  const setDefaultVideoUrl = (url: string) => {
    console.log('🎬 setDefaultVideoUrl called with:', url);
    setState(prev => {
      console.log('🎬 Previous defaultVideoUrl:', prev.defaultVideoUrl);
      console.log('🎬 New defaultVideoUrl:', url);
      return { ...prev, defaultVideoUrl: url };
    });
  };

  const setIsLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const resetState = () => {
    setState(initialState);
  };

  // Значение контекста
  const contextValue: AppContextType = {
    ...state,
    setAvatarImage,
    setAvatarImageUrl,
    setDefaultVideoUrl,
    setIsLoading,
    setError,
    clearError,
    resetState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Хук для использования контекста
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Хуки для отдельных частей состояния
export const useAvatarImage = () => {
  const { avatarImage, avatarImageUrl, setAvatarImage, setAvatarImageUrl } = useAppContext();
  return { avatarImage, avatarImageUrl, setAvatarImage, setAvatarImageUrl };
};

export const useDefaultVideo = () => {
  const { defaultVideoUrl, setDefaultVideoUrl } = useAppContext();
  return { defaultVideoUrl, setDefaultVideoUrl };
};

export const useLoading = () => {
  const { isLoading, setIsLoading } = useAppContext();
  return { isLoading, setIsLoading };
};

export const useError = () => {
  const { error, setError, clearError } = useAppContext();
  return { error, setError, clearError };
};
