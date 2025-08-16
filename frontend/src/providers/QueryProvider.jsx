import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Создаем QueryClient с настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Время жизни кэша по умолчанию
      staleTime: 5 * 60 * 1000, // 5 минут
      
      // Время жизни кэша в памяти
      gcTime: 10 * 60 * 1000, // 10 минут (было cacheTime)
      
      // Количество повторных попыток
      retry: (failureCount, error) => {
        // Не повторяем для ошибок 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      
      // Задержка между повторными попытками
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Обновление при фокусе окна
      refetchOnWindowFocus: false,
      
      // Обновление при переподключении
      refetchOnReconnect: true,
    },
    mutations: {
      // Количество повторных попыток для мутаций
      retry: 1,
      
      // Задержка между повторными попытками
      retryDelay: 1000,
    },
  },
});

// Компонент провайдера
export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools для разработки */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
