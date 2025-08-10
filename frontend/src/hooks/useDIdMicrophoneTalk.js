import { useState, useCallback, useEffect, useRef } from 'react';
import { useMicrophoneToCloudinary } from './useMicrophoneToCloudinary';
import { apiService } from '../services/api';

export const useDIdMicrophoneTalk = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  }, []);

  // Состояние для хранения текущего голоса
  const [currentVoiceId, setCurrentVoiceId] = useState(null);

  // Очередь файлов для отправки в D-ID
  const [didUploadQueue, setDidUploadQueue] = useState([]);
  const [isSendingToDid, setIsSendingToDid] = useState(false);

  // Состояние для интервала проигрывания тишины
  const [silenceIntervalId, setSilenceIntervalId] = useState(null);
  const [isPlayingSilence, setIsPlayingSilence] = useState(false);

  // Refs для хранения актуальных параметров
  const currentParamsRef = useRef({
    streamId: null,
    sessionId: null,
    voiceId: null
  });

  // URL файла с тишиной
  const SILENCE_AUDIO_URL = 'https://res.cloudinary.com/daeoqig4w/video/upload/v1754845533/1-second-of-silence_uyj5kd.mp3';

  // Функция для проигрывания файла с тишиной
  const playSilenceAudio = useCallback(async () => {
    const { streamId, sessionId, voiceId } = currentParamsRef.current;
    
    if (!streamId || !sessionId || !voiceId) {
      addLog('❌ Недостаточно параметров для проигрывания тишины', 'warning');
      return;
    }

    try {
      addLog('🔇 Проигрываем файл с тишиной...', 'info');
      
      const response = await apiService.createDIdTalkAudio(
        streamId,
        sessionId,
        SILENCE_AUDIO_URL,
        voiceId
      );

      if (response.success) {
        addLog('✅ Файл с тишиной отправлен в D-ID', 'success');
      } else {
        addLog(`⚠️ Ошибка отправки файла с тишиной: ${response.error}`, 'warning');
      }
    } catch (error) {
      addLog(`❌ Ошибка проигрывания тишины: ${error.message}`, 'error');
    }
  }, [addLog]);

  // Функция для запуска интервала проигрывания тишины
  const startSilenceInterval = useCallback(() => {
    if (silenceIntervalId) {
      clearInterval(silenceIntervalId);
    }
    
    addLog('🔇 Запускаем интервал проигрывания тишины (каждую секунду)', 'info');
    setIsPlayingSilence(true);
    
    const intervalId = setInterval(() => {
      playSilenceAudio();
    }, 1000);
    
    setSilenceIntervalId(intervalId);
  }, [silenceIntervalId, playSilenceAudio, addLog]);

  // Функция для остановки интервала проигрывания тишины
  const stopSilenceInterval = useCallback(() => {
    if (silenceIntervalId) {
      clearInterval(silenceIntervalId);
      setSilenceIntervalId(null);
      setIsPlayingSilence(false);
      addLog('🔇 Останавливаем интервал проигрывания тишины', 'info');
    }
  }, [silenceIntervalId, addLog]);

  // Добавление файла в очередь D-ID
  const addToDidQueue = useCallback((cloudinaryUrl) => {
    console.log('🔄 addToDidQueue вызван с URL:', cloudinaryUrl);
    addLog(`🔄 Вызывается addToDidQueue с URL: ${cloudinaryUrl}`, 'info');
    
    setDidUploadQueue(prev => {
      const newQueue = [...prev, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: cloudinaryUrl,
        timestamp: new Date()
      }];
      
      console.log('📥 Файл добавлен в очередь D-ID, новый размер:', newQueue.length);
      addLog(`📥 Добавлен в очередь D-ID: ${cloudinaryUrl}`, 'info');
      addLog(`📊 Размер очереди D-ID: ${newQueue.length}`, 'info');
      
      return newQueue;
    });
  }, [addLog]);

  // Callback для onAudioUploaded с использованием ref
  const onAudioUploaded = useCallback((cloudinaryUrl) => {
    console.log('🎤 onAudioUploaded callback вызван с URL:', cloudinaryUrl);
    addLog(`✅ Аудио загружено в Cloudinary: ${cloudinaryUrl}`, 'success');
    
    // Получаем актуальные значения из ref
    const { streamId, sessionId, voiceId } = currentParamsRef.current;
    
    console.log('🎤 Параметры из ref:', { streamId, sessionId, voiceId });
    addLog(`🔍 Проверяем параметры для D-ID:`, 'info');
    addLog(`   Stream ID: ${streamId}`, 'info');
    addLog(`   Session ID: ${sessionId}`, 'info');
    addLog(`   Voice ID: ${voiceId}`, 'info');
    
    // Добавляем файл в очередь для отправки в D-ID
    console.log('🎤 Проверяем условие:', {
      streamId: !!streamId,
      sessionId: !!sessionId,
      voiceId: !!voiceId,
      allValid: !!(streamId && sessionId && voiceId)
    });
    
    if (streamId && sessionId && voiceId) {
      console.log('✅ Условие выполнено, добавляем в очередь');
      addLog(`📥 Добавляем файл в очередь D-ID...`, 'info');
      addToDidQueue(cloudinaryUrl);
    } else {
      console.log('❌ Условие не выполнено');
      addLog(`❌ Недостаточно параметров для добавления в очередь D-ID`, 'error');
      addLog(`⏳ Параметры еще не установлены, файл будет пропущен`, 'warning');
    }
  }, [addToDidQueue, addLog]);

  // Используем хук микрофона
  const {
    isRecording,
    isProcessing: isMicProcessing,
    isUploading,
    streamStats,
    audioChunks,
    processedChunks,
    uploadedFiles,
    error: micError,
    startRecording: startMicRecording,
    stopRecording: stopMicRecording
  } = useMicrophoneToCloudinary({
    onAudioUploaded
  });

  // useEffect для реактивной обработки очереди и управления тишиной
  useEffect(() => {
    console.log('🔍 useEffect проверяет очередь:', {
      queueLength: didUploadQueue.length,
      isSendingToDid,
      hasQueue: didUploadQueue.length > 0,
      canProcess: didUploadQueue.length > 0 && !isSendingToDid,
      isPlayingSilence
    });
    
    addLog(`🔍 useEffect проверяет очередь: ${didUploadQueue.length} файлов, isSendingToDid: ${isSendingToDid}`, 'info');
    
    // Проверяем, что есть файлы в очереди и обработка не запущена
    if (didUploadQueue.length > 0 && !isSendingToDid) {
      // Останавливаем интервал тишины, если он запущен
      if (isPlayingSilence) {
        stopSilenceInterval();
      }
      
      // Получаем актуальные значения состояния
      const streamId = currentStreamId;
      const sessionId = currentSessionId;
      const voiceId = currentVoiceId;
      
      if (!streamId || !sessionId || !voiceId) {
        addLog('❌ Отсутствуют необходимые параметры для отправки в D-ID', 'error');
        return;
      }
      
      // Устанавливаем блокировку
      setIsSendingToDid(true);
      addLog('🎬 Начинаем обработку очереди D-ID...', 'info');
      
      // Берем первый файл из очереди
      const file = didUploadQueue[0];
      
      // Асинхронно обрабатываем файл
      const processFile = async () => {
        let isRetryNeeded = false;
        
        try {
          console.log('🎬 processFile - параметры отправки:', {
            streamId,
            sessionId,
            fileUrl: file.url,
            voiceId
          });
          
          addLog(`🎬 Отправляем файл в D-ID: ${file.url}`, 'info');
          addLog(`🎵 Используем голос: ${voiceId}`, 'info');
          
          const response = await apiService.createDIdTalkAudio(
            streamId,
            sessionId,
            file.url,
            voiceId
          );

          if (response.success) {
            addLog('✅ Аудио отправлено в D-ID успешно!', 'success');
            addLog(`📋 Talk ID: ${response.talk_id || 'N/A'}`, 'info');
            
            // Удаляем обработанный файл из очереди
            setDidUploadQueue(prev => {
              const newQueue = prev.slice(1);
              addLog(`🗑️ Файл удален из очереди D-ID, осталось: ${newQueue.length}`, 'info');
              return newQueue;
            });
            
          } else {
            // Проверяем на ошибку 429 (система занята)
            if (response.error && response.error.includes('429')) {
              addLog(`⚠️ ElevenLabs API перегружен (429). Повторная попытка через 5 секунд...`, 'warning');
              isRetryNeeded = true;
              
              // Повторная попытка через 5 секунд
              setTimeout(() => {
                setIsSendingToDid(false);
              }, 5000);
            } else {
              addLog(`❌ Ошибка отправки в D-ID: ${response.error}`, 'error');
            }
          }
          
        } catch (error) {
          // Проверяем на ошибку 429 в catch блоке
          if (error.message && error.message.includes('429')) {
            addLog(`⚠️ ElevenLabs API перегружен (429). Повторная попытка через 5 секунд...`, 'warning');
            isRetryNeeded = true;
            
            // Повторная попытка через 5 секунд
            setTimeout(() => {
              setIsSendingToDid(false);
            }, 5000);
          } else {
            addLog(`❌ Ошибка отправки в D-ID: ${error.message}`, 'error');
          }
        } finally {
          // Гарантированно снимаем блокировку в случае успеха
          // (в случае ошибки 429 блокировка снимается через setTimeout)
          if (!isRetryNeeded) {
            setIsSendingToDid(false);
          }
        }
      };
      
      // Запускаем обработку файла
      processFile();
    } else if (didUploadQueue.length === 0 && !isSendingToDid && !isPlayingSilence && currentStreamId && currentSessionId && currentVoiceId) {
      // Если очередь пуста, нет активной обработки, и не проигрывается тишина - запускаем интервал тишины
      addLog('🔇 Очередь пуста, запускаем проигрывание тишины', 'info');
      startSilenceInterval();
    }
  }, [didUploadQueue, isSendingToDid, currentStreamId, currentSessionId, currentVoiceId, isPlayingSilence, startSilenceInterval, stopSilenceInterval, addLog]);

  // Основная функция для создания talk с микрофоном
  const createTalkMic = useCallback(async (streamId, sessionId, voiceId) => {
    try {
      setIsProcessing(true);
      setError(null);
      addLog('🎤 Начинаем создание talk с микрофоном...', 'info');
      
      // Проверяем параметры
      if (!streamId) {
        throw new Error('Stream ID не предоставлен');
      }
      if (!sessionId) {
        throw new Error('Session ID не предоставлен');
      }
      if (!voiceId) {
        throw new Error('Voice ID не предоставлен');
      }
      
      addLog(`📊 Stream ID: ${streamId}`, 'info');
      addLog(`📊 Session ID: ${sessionId}`, 'info');
      addLog(`🎵 Voice ID: ${voiceId}`, 'info');
      
      // 🎬 СНАЧАЛА отправляем файл с тишиной для анимации аватара
      addLog('🎬 Отправляем файл с тишиной для анимации аватара...', 'info');
      
      try {
        console.log('🎬 createTalkMic - параметры файла с тишиной:', {
          streamId,
          sessionId,
          silenceAudioUrl: SILENCE_AUDIO_URL,
          voiceId
        });
        
        const silenceResponse = await apiService.createDIdTalkAudio(
          streamId,
          sessionId,
          SILENCE_AUDIO_URL,
          voiceId
        );
        
        if (silenceResponse.success) {
          addLog('✅ Файл с тишиной отправлен в D-ID успешно!', 'success');
          addLog(`📋 Silence Talk ID: ${silenceResponse.talk_id || 'N/A'}`, 'info');
        } else {
          addLog(`⚠️ Ошибка отправки файла с тишиной: ${silenceResponse.error}`, 'warning');
        }
      } catch (silenceError) {
        addLog(`⚠️ Ошибка отправки файла с тишиной: ${silenceError.message}`, 'warning');
      }
      
      // ПОТОМ сохраняем текущие ID и голос (ПЕРЕД запуском записи)
      addLog('💾 Сохраняем параметры для D-ID...', 'info');
      setCurrentStreamId(streamId);
      setCurrentSessionId(sessionId);
      setCurrentVoiceId(voiceId);
      
      // Также сохраняем в ref для callback
      currentParamsRef.current = {
        streamId,
        sessionId,
        voiceId
      };
      
      addLog(`💾 Параметры сохранены в ref:`, 'info');
      addLog(`   Stream ID: ${currentParamsRef.current.streamId}`, 'info');
      addLog(`   Session ID: ${currentParamsRef.current.sessionId}`, 'info');
      addLog(`   Voice ID: ${currentParamsRef.current.voiceId}`, 'info');
      
      // Ждем обновления состояния
      await new Promise(resolve => setTimeout(resolve, 100));
      
      addLog('🎤 Запускаем запись с микрофона...', 'info');
      
      // Запускаем запись микрофона
      await startMicRecording(voiceId);
      
      addLog('✅ Запись микрофона запущена', 'success');
      addLog('📝 Аудио будет автоматически загружаться в Cloudinary и отправляться в D-ID', 'info');
      
    } catch (error) {
      addLog(`❌ Ошибка создания talk с микрофоном: ${error.message}`, 'error');
      setError(error.message);
      setIsProcessing(false);
    }
  }, [startMicRecording, addLog]);

  // Остановка записи
  const stopTalkMic = useCallback(() => {
    try {
      addLog('⏹️ Останавливаем запись микрофона...', 'info');
      stopMicRecording();
      
      // Останавливаем интервал тишины
      stopSilenceInterval();
      
      addLog('✅ Запись остановлена', 'success');
      setIsProcessing(false);
    } catch (error) {
      addLog(`❌ Ошибка остановки записи: ${error.message}`, 'error');
    }
  }, [stopMicRecording, stopSilenceInterval, addLog]);

  // Очистка состояния
  const clearState = useCallback(() => {
    setLogs([]);
    setError(null);
    setCurrentStreamId(null);
    setCurrentSessionId(null);
    setCurrentVoiceId(null);
    setDidUploadQueue([]);
    setIsSendingToDid(false);
    
    // Останавливаем интервал тишины при очистке
    stopSilenceInterval();
  }, [stopSilenceInterval]);

  return {
    // Состояние
    isProcessing,
    isRecording,
    isMicProcessing,
    isUploading,
    isSendingToDid,
    isPlayingSilence,
    error: error || micError,
    logs,
    
    // Статистика
    streamStats,
    audioChunks,
    processedChunks,
    uploadedFiles,
    didUploadQueue,
    
    // Методы
    createTalkMic,
    stopTalkMic,
    clearState
  };
};
