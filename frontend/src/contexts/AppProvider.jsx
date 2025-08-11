import React from 'react';
import { StreamingProvider, useStreamingContext } from './StreamingContext.jsx';

/**
 * Композитный провайдер для всего приложения
 * Объединяет все контексты в один провайдер
 */
export const AppProvider = ({ children }) => {
  return (
    <StreamingProvider>
      {children}
    </StreamingProvider>
  );
};

/**
 * Хук для получения всех контекстов приложения
 */
export const useAppContext = () => {
  // В будущем здесь можно добавить другие контексты
  return {
    streaming: useStreamingContext()
  };
};
