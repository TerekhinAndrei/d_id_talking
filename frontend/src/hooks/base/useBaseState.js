import { useState, useCallback } from 'react';
import { Logger } from '../../utils/Logger.js';

/**
 * Базовый хук для управления состоянием
 * Устраняет дубликаты состояний в различных хуках
 */
export const useBaseState = (hookName = 'useBaseState') => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setProcessing = useCallback((processing) => {
    Logger.hook(hookName, `setProcessing: ${processing}`);
    setIsProcessing(processing);
    if (processing) {
      setError(null);
      setIsSuccess(false);
    }
  }, [hookName]);

  const setErrorState = useCallback((error) => {
    Logger.hook(hookName, 'setError', error);
    setError(error);
    setIsProcessing(false);
    setIsLoading(false);
    setIsSuccess(false);
  }, [hookName]);

  const setLoading = useCallback((loading) => {
    Logger.hook(hookName, `setLoading: ${loading}`);
    setIsLoading(loading);
    if (loading) {
      setError(null);
      setIsSuccess(false);
    }
  }, [hookName]);

  const setSuccess = useCallback((success) => {
    Logger.hook(hookName, `setSuccess: ${success}`);
    setIsSuccess(success);
    if (success) {
      setError(null);
      setIsProcessing(false);
      setIsLoading(false);
    }
  }, [hookName]);

  const resetState = useCallback(() => {
    Logger.hook(hookName, 'resetState');
    setIsProcessing(false);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  }, [hookName]);

  const handleAsyncOperation = useCallback(async (operation, operationName = 'operation') => {
    try {
      Logger.hook(hookName, `Starting ${operationName}`);
      setProcessing(true);
      setError(null);
      
      const result = await operation();
      
      Logger.hook(hookName, `Completed ${operationName}`, result);
      setSuccess(true);
      return result;
    } catch (error) {
      Logger.hook(hookName, `Failed ${operationName}`, error);
      setErrorState(error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [hookName, setProcessing, setErrorState, setSuccess]);

  return {
    // Состояния
    isProcessing,
    error,
    isLoading,
    isSuccess,
    
    // Сеттеры
    setProcessing,
    setError: setErrorState,
    setLoading,
    setSuccess,
    resetState,
    
    // Утилиты
    handleAsyncOperation
  };
};

/**
 * Хук для управления состоянием с дополнительными состояниями
 */
export const useExtendedState = (hookName = 'useExtendedState') => {
  const baseState = useBaseState(hookName);
  const [data, setData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setDataState = useCallback((newData) => {
    Logger.hook(hookName, 'setData', newData);
    setData(newData);
    if (newData !== null) {
      setIsInitialized(true);
    }
  }, [hookName]);

  const resetExtendedState = useCallback(() => {
    Logger.hook(hookName, 'resetExtendedState');
    baseState.resetState();
    setData(null);
    setIsInitialized(false);
  }, [hookName, baseState]);

  return {
    ...baseState,
    data,
    isInitialized,
    setData: setDataState,
    resetState: resetExtendedState
  };
};

/**
 * Хук для управления состоянием с кэшированием
 */
export const useCachedState = (hookName = 'useCachedState') => {
  const extendedState = useExtendedState(hookName);
  const [cache, setCache] = useState(new Map());
  const [cacheTimestamp, setCacheTimestamp] = useState(null);

  const setCacheData = useCallback((key, data, ttl = 5 * 60 * 1000) => { // 5 минут по умолчанию
    Logger.hook(hookName, `setCacheData: ${key}`);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    setCache(prev => new Map(prev).set(key, cacheEntry));
  }, [hookName]);

  const getCacheData = useCallback((key) => {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      Logger.hook(hookName, `Cache expired: ${key}`);
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    Logger.hook(hookName, `Cache hit: ${key}`);
    return entry.data;
  }, [cache, hookName]);

  const clearCache = useCallback(() => {
    Logger.hook(hookName, 'clearCache');
    setCache(new Map());
    setCacheTimestamp(null);
  }, [hookName]);

  return {
    ...extendedState,
    cache,
    cacheTimestamp,
    setCacheData,
    getCacheData,
    clearCache
  };
};
