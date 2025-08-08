import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

export const useMicrophoneRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [processedChunks, setProcessedChunks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const streamRef = useRef(null);
  const chunkIntervalRef = useRef(null);

  // Initialize audio context for playback
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Convert base64 to audio buffer for playback
  const base64ToAudioBuffer = useCallback(async (base64Data) => {
    try {
      // Remove data URL prefix if present
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }

      // Convert base64 to array buffer
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const arrayBuffer = byteArray.buffer;

      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Ошибка декодирования аудио:', error);
      throw error;
    }
  }, []);

  // Play audio buffer
  const playAudioBuffer = useCallback(async (audioBuffer) => {
    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      // Add to queue for sequential playback
      audioQueueRef.current.push(source);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (error) {
      console.error('Ошибка воспроизведения аудио:', error);
    }
  }, []);

  // Play next audio in queue
  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    
    const source = audioQueueRef.current.shift();
    source.onended = () => {
      playNextInQueue();
    };
    
    source.start();
  }, []);

  // Process audio chunk through ElevenLabs
  const processAudioChunk = useCallback(async (audioBlob, voiceId) => {
    try {
      console.log('🔄 Обработка аудио чанка...', { size: audioBlob.size });
      
      // Convert blob to file
      const audioFile = new File([audioBlob], 'chunk.webm', {
        type: 'audio/webm'
      });

      // Send to ElevenLabs API
      const response = await apiService.speechToSpeech(audioFile, voiceId);
      
      if (response.success) {
        console.log('✅ Чанк обработан успешно');
        
        // Convert response to audio buffer and play
        const audioBuffer = await base64ToAudioBuffer(response.audio_data);
        await playAudioBuffer(audioBuffer);
        
        // Store processed chunk
        setProcessedChunks(prev => [...prev, {
          id: Date.now(),
          originalSize: audioBlob.size,
          processedSize: response.audio_data.length,
          timestamp: new Date()
        }]);
        
        return response;
      } else {
        throw new Error(response.message || 'Ошибка обработки чанка');
      }
    } catch (error) {
      console.error('❌ Ошибка обработки чанка:', error);
      setError(error.message);
      throw error;
    }
  }, [base64ToAudioBuffer, playAudioBuffer]);

  // Start real-time streaming
  const startStreaming = useCallback(async (voiceId) => {
    try {
      setError(null);
      setAudioChunks([]);
      setProcessedChunks([]);
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      setIsPlaying(false);

      // Initialize audio context
      initAudioContext();

      // Get microphone stream
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Create MediaRecorder for chunked recording
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      let chunkCounter = 0;
      const CHUNK_DURATION = 2000; // 2 seconds per chunk

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data;
          chunkCounter++;
          
          console.log(`📦 Получен аудио чанк #${chunkCounter}`, { size: chunk.size });
          
          // Store original chunk
          setAudioChunks(prev => [...prev, {
            id: Date.now(),
            size: chunk.size,
            counter: chunkCounter,
            timestamp: new Date()
          }]);

          // Process chunk through ElevenLabs
          try {
            setIsProcessing(true);
            await processAudioChunk(chunk, voiceId);
          } catch (error) {
            console.error(`❌ Ошибка обработки чанка #${chunkCounter}:`, error);
          } finally {
            setIsProcessing(false);
          }
        }
      };

      mediaRecorderRef.current.start(CHUNK_DURATION);
      setIsRecording(true);
      
      console.log('🎤 Стриминг начат - обработка в реальном времени');
    } catch (error) {
      console.error('❌ Ошибка начала стриминга:', error);
      setError(error.message);
    }
  }, [processAudioChunk, initAudioContext]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      console.log('⏹️ Стриминг остановлен');
    }
  }, [isRecording]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    // Stop all queued audio
    audioQueueRef.current.forEach(source => {
      try {
        source.stop();
      } catch (error) {
        // Ignore errors for already stopped sources
      }
    });
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    
    console.log('🔇 Воспроизведение остановлено');
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setAudioChunks([]);
    setProcessedChunks([]);
    setError(null);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    return {
      totalChunks: audioChunks.length,
      processedChunks: processedChunks.length,
      isRecording,
      isProcessing,
      isPlaying,
      error
    };
  }, [audioChunks.length, processedChunks.length, isRecording, isProcessing, isPlaying, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isRecording,
    isProcessing,
    isPlaying,
    error,
    audioChunks,
    processedChunks,
    
    // Functions
    startStreaming,
    stopStreaming,
    stopPlayback,
    clearData,
    getStats
  };
};
