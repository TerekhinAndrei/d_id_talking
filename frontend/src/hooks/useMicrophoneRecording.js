import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';

export const useMicrophoneRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('🎤 Запись с микрофона начата');
    } catch (error) {
      console.error('❌ Ошибка начала записи:', error);
      setError(error.message);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Запись с микрофона остановлена');
    }
  }, [isRecording]);

  // Process recorded audio with ElevenLabs
  const processWithElevenLabs = useCallback(async (voiceId, settings = null) => {
    if (!audioBlob) {
      setError('Нет записанного аудио для обработки');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('🔄 Обработка аудио через ElevenLabs...', { voiceId });

      // Convert blob to file
      const audioFile = new File([audioBlob], 'microphone_recording.webm', {
        type: 'audio/webm'
      });

      // Send to ElevenLabs API
      const response = await apiService.speechToSpeech(audioFile, voiceId, settings);

      if (response.success) {
        console.log('✅ Аудио успешно обработано через ElevenLabs');
        
        // Convert base64 to blob for playback
        const base64Data = response.audio_data;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const processedBlob = new Blob([byteArray], { type: `audio/${response.format || 'mp3'}` });
        const processedUrl = URL.createObjectURL(processedBlob);
        
        setProcessedAudioUrl(processedUrl);
        
        return {
          success: true,
          audioUrl: processedUrl,
          format: response.format,
          sampleRate: response.sample_rate,
          bitrate: response.bitrate
        };
      } else {
        throw new Error(response.message || 'Ошибка обработки аудио');
      }
    } catch (error) {
      console.error('❌ Ошибка обработки аудио:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob]);

  // Play original audio
  const playOriginalAudio = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Ошибка воспроизведения оригинального аудио:', error);
        setError('Ошибка воспроизведения оригинального аудио');
      });
    }
  }, [audioUrl]);

  // Play processed audio
  const playProcessedAudio = useCallback(() => {
    if (processedAudioUrl) {
      const audio = new Audio(processedAudioUrl);
      audio.play().catch(error => {
        console.error('Ошибка воспроизведения обработанного аудио:', error);
        setError('Ошибка воспроизведения обработанного аудио');
      });
    }
  }, [processedAudioUrl]);

  // Clear all audio data
  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setProcessedAudioUrl(null);
    setError(null);
    
    // Clean up URLs
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (processedAudioUrl) URL.revokeObjectURL(processedAudioUrl);
  }, [audioUrl, processedAudioUrl]);

  // Get recording duration
  const getRecordingDuration = useCallback(() => {
    if (audioBlob) {
      return Math.round(audioBlob.size / 16000); // Rough estimate based on file size
    }
    return 0;
  }, [audioBlob]);

  return {
    // State
    isRecording,
    isProcessing,
    error,
    audioBlob,
    audioUrl,
    processedAudioUrl,
    
    // Functions
    startRecording,
    stopRecording,
    processWithElevenLabs,
    playOriginalAudio,
    playProcessedAudio,
    clearAudio,
    getRecordingDuration
  };
};
