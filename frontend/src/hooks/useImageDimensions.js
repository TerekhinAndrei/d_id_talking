import { useState, useEffect } from 'react';

export const useImageDimensions = (imageUrl) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setDimensions({ width: 0, height: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new Image();
    
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      setDimensions(dimensions);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError('Не удалось загрузить изображение для получения размеров');
      setIsLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return { dimensions, isLoading, error };
};
