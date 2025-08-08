import { useState, useEffect } from 'react';
import { FALLBACK_VOICES } from '../constants';

export const useVoices = () => {
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [voicesError, setVoicesError] = useState(null);

  const fetchVoices = async () => {
      try {
        setLoadingVoices(true);
        setVoicesError(null);
        
        console.log('🔄 Загружаю голоса из API...');
        console.log('📡 URL:', '/api/v1/voices');
        
        const response = await fetch('/api/v1/voices');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        console.log('📦 Data type:', typeof data);
        console.log('📦 Is array:', Array.isArray(data));
        console.log('📦 Has success:', data && typeof data === 'object' && 'success' in data);
        console.log('📦 Has voices:', data && typeof data === 'object' && 'voices' in data);
        
        // API возвращает массив голосов напрямую
        if (Array.isArray(data)) {
          console.log(`✅ Загружено ${data.length} голосов (прямой массив)`);
          setVoices(data);
        } else if (data.success && data.voices && Array.isArray(data.voices)) {
          // Fallback для старого формата
          console.log(`✅ Загружено ${data.voices.length} голосов (формат success/voices)`);
          setVoices(data.voices);
        } else {
          console.error('❌ Неверный формат ответа:', data);
          throw new Error('Invalid response format - expected array of voices or {success, voices}');
        }
      } catch (error) {
        console.error('❌ Ошибка при загрузке голосов:', error);
        console.error('❌ Error stack:', error.stack);
        setVoicesError('Не удалось загрузить список голосов');
        
        // Fallback к базовым голосам в случае ошибки
        console.log('🔄 Использую fallback голоса');
        setVoices(FALLBACK_VOICES);
      } finally {
        setLoadingVoices(false);
        console.log('🏁 Загрузка голосов завершена');
      }
    };

  useEffect(() => {
    fetchVoices();
  }, []);

  const retryFetchVoices = () => {
    fetchVoices();
  };

  return {
    voices,
    loadingVoices,
    voicesError,
    retryFetchVoices
  };
};
