import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useElevenLabs = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioData, setAudioData] = useState(null);

  // Text-to-Speech
  const textToSpeech = useCallback(async (text, voiceId, settings = null) => {
    try {
      setIsProcessing(true);
      setError(null);
      setAudioData(null);

      console.log('🔄 Преобразование текста в речь...', { text, voiceId });
      
      const response = await apiService.textToSpeech(text, voiceId, settings);
      
      if (response.success) {
        setAudioData(response.audio_data);
        console.log('✅ Текст успешно преобразован в речь');
        return response;
      } else {
        throw new Error(response.message || 'Ошибка преобразования текста в речь');
      }
    } catch (error) {
      console.error('❌ Ошибка TTS:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Speech-to-Speech
  const speechToSpeech = useCallback(async (audioFile, voiceId, settings = null) => {
    try {
      setIsProcessing(true);
      setError(null);
      setAudioData(null);

      console.log('🔄 Преобразование речи в речь...', { voiceId });
      
      const response = await apiService.speechToSpeech(audioFile, voiceId, settings);
      
      if (response.success) {
        setAudioData(response.audio_data);
        console.log('✅ Речь успешно преобразована');
        return response;
      } else {
        throw new Error(response.message || 'Ошибка преобразования речи в речь');
      }
    } catch (error) {
      console.error('❌ Ошибка STS:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Voice Preview
  const playVoice = useCallback(async (voiceId, previewText = "Привет! Это пример голоса.") => {
    try {
      setIsProcessing(true);
      setError(null);
      setAudioData(null);

      console.log('🔄 Воспроизведение голоса...', { voiceId, previewText });
      
      const response = await apiService.playVoice(voiceId, previewText);
      
      if (response.success) {
        setAudioData(response.audio_data);
        console.log('✅ Голос успешно воспроизведен');
        return response;
      } else {
        throw new Error(response.message || 'Ошибка воспроизведения голоса');
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения голоса:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Voice Validation
  const validateVoice = useCallback(async (voiceId) => {
    try {
      setError(null);

      console.log('🔄 Валидация голоса...', { voiceId });
      
      const response = await apiService.validateVoice(voiceId);
      
      if (response.success) {
        console.log('✅ Голос валиден:', response.valid);
        return response;
      } else {
        throw new Error(response.error || 'Ошибка валидации голоса');
      }
    } catch (error) {
      console.error('❌ Ошибка валидации голоса:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Get Voice Details
  const getVoice = useCallback(async (voiceId) => {
    try {
      setError(null);

      console.log('🔄 Получение информации о голосе...', { voiceId });
      
      const response = await apiService.getVoice(voiceId);
      
      if (response.success) {
        console.log('✅ Информация о голосе получена:', response.voice);
        return response;
      } else {
        throw new Error(response.error || 'Ошибка получения информации о голосе');
      }
    } catch (error) {
      console.error('❌ Ошибка получения информации о голосе:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Test Authentication
  const testAuth = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('🔄 Тестирование аутентификации ElevenLabs...');
      
      const response = await apiService.testElevenLabsAuth();
      
      console.log('📡 Ответ от testElevenLabsAuth:', response);
      
      if (response.success) {
        console.log('✅ Аутентификация ElevenLabs успешна');
        return response;
      } else {
        console.error('❌ Аутентификация ElevenLabs неуспешна:', response);
        throw new Error(response.message || response.error || 'Ошибка аутентификации ElevenLabs');
      }
    } catch (error) {
      console.error('❌ Ошибка аутентификации ElevenLabs:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Generate Video
  const generateVideo = useCallback(async (imageFile, audioFile, voiceId = null, settings = null) => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('🔄 Генерация видео...', { voiceId });
      
      const response = await apiService.generateVideo(imageFile, audioFile, voiceId, settings);
      
      if (response.success) {
        console.log('✅ Задача генерации видео создана:', response.task_id);
        return response;
      } else {
        throw new Error(response.message || 'Ошибка генерации видео');
      }
    } catch (error) {
      console.error('❌ Ошибка генерации видео:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get Task Status
  const getTaskStatus = useCallback(async (taskId) => {
    try {
      setError(null);

      console.log('🔄 Получение статуса задачи...', { taskId });
      
      const response = await apiService.getTaskStatus(taskId);
      
      if (response.success) {
        console.log('✅ Статус задачи получен:', response.data);
        return response;
      } else {
        throw new Error(response.message || 'Ошибка получения статуса задачи');
      }
    } catch (error) {
      console.error('❌ Ошибка получения статуса задачи:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Play audio data
  const playAudioData = useCallback(async (audioBase64, format = 'mp3') => {
    try {
      console.log('🔊 Воспроизведение аудио...', { format, dataLength: audioBase64?.length || 0 });

      if (!audioBase64) {
        throw new Error('Аудио данные отсутствуют');
      }

      // Remove any potential data URL prefix
      let cleanBase64 = audioBase64;
      if (audioBase64.includes(',')) {
        cleanBase64 = audioBase64.split(',')[1];
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error('Неверный формат base64 данных');
      }

      // Convert base64 to blob with proper error handling
      let byteArray;
      try {
        const byteCharacters = atob(cleanBase64);
        byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
      } catch (decodeError) {
        console.error('Ошибка декодирования base64:', decodeError);
        throw new Error('Ошибка декодирования аудио данных');
      }

      // Validate audio data
      if (byteArray.length === 0) {
        throw new Error('Аудио данные пусты');
      }

      // Create blob with proper MIME type
      const mimeType = `audio/${format}`;
      const blob = new Blob([byteArray], { type: mimeType });

      // Validate blob
      if (blob.size === 0) {
        throw new Error('Созданный аудио файл пуст');
      }

      // Create audio element and play
      const audio = new Audio(URL.createObjectURL(blob));
      
      // Add event listeners for better error handling
      audio.addEventListener('error', (e) => {
        console.error('Ошибка воспроизведения аудио:', e);
      });

      audio.addEventListener('loadstart', () => {
        console.log('🎵 Начало загрузки аудио');
      });

      audio.addEventListener('canplay', () => {
        console.log('✅ Аудио готово к воспроизведению');
      });

      // Play audio with proper error handling for autoplay restrictions
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('🔊 Воспроизведение аудио начато');
        }
      } catch (playError) {
        console.warn('⚠️ Автозапуск аудио заблокирован браузером:', playError.message);
        
        // Show user-friendly message about autoplay restriction
        const errorMessage = 'Браузер заблокировал автозапуск аудио. Нажмите на кнопку воспроизведения еще раз для прослушивания.';
        console.log('💡 Подсказка:', errorMessage);
        
        // Don't throw error, just log it as a warning
        // The user can manually trigger playback again
        return { 
          success: false, 
          message: errorMessage, 
          audio: audio,
          canRetry: true 
        };
      }
      
      return { 
        success: true, 
        message: 'Аудио воспроизводится', 
        audio: audio 
      };
    } catch (error) {
      console.error('❌ Ошибка воспроизведения аудио:', error);
      setError(error.message);
      throw error;
    }
  }, [setError]);

  // Clear state
  const clearState = useCallback(() => {
    setError(null);
    setAudioData(null);
  }, []);

  return {
    // State
    isProcessing,
    error,
    audioData,
    
    // Functions
    textToSpeech,
    speechToSpeech,
    playVoice,
    validateVoice,
    getVoice,
    testAuth,
    generateVideo,
    getTaskStatus,
    playAudioData,
    clearState
  };
};
