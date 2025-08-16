import { useState, useCallback } from 'react';

export const useVideoState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const handleVideoError = useCallback((error) => {
    console.error('❌ Video element error:', error);
    setVideoError('Ошибка воспроизведения видео');
    setIsLoading(false);
  }, []);

  const clearVideoError = useCallback(() => {
    setVideoError(null);
  }, []);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  return {
    isLoading,
    videoError,
    handleVideoError,
    clearVideoError,
    setLoading
  };
};
