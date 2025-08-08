import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { apiService } from '../services/api';
import './MicrophoneInput.css';

const MicrophoneInput = forwardRef(({ 
  voiceId, 
  voiceName, // Добавляем имя голоса
  onAudioReceived, 
  onError, 
  onStatusChange,
  autoPlay = true,
  autoInitialize = false, // Новый пропс для контроля автоматической инициализации
  chunkDuration = 1000, // milliseconds
  className = "" 
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, recording, processing, error
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Initialize microphone
  const initializeMicrophone = useCallback(async () => {
    try {
      setStatus('initializing');
      onStatusChange?.('initializing');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Set up audio context for level monitoring
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      setHasPermission(true);
      setStatus('ready');
      onStatusChange?.('ready');
      
      console.log('🎤 Microphone initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize microphone:', error);
      setStatus('error');
      onStatusChange?.('error');
      handleError(error);
    }
  }, [onStatusChange]);

  // Handle errors
  const handleError = useCallback((error) => {
    console.error('🎤 Microphone error:', error);
    setStatus('error');
    onStatusChange?.('error');
    onError?.(error);
  }, [onError, onStatusChange]);

  // Process audio chunk
  const processAudioChunk = useCallback(async (audioBlob) => {
    // Disable audio processing for D-ID streaming
    console.log(`🎤 Audio chunk recorded (${audioBlob.size} bytes) - skipping ElevenLabs processing for D-ID streaming`);
    
    // Just pass the audio to parent component without processing
    onAudioReceived?.(audioBlob);
    
    // Don't process through ElevenLabs API for D-ID streaming
    return;
    
    // Original code commented out:
    /*
    if (!voiceId) {
      throw new Error('Voice ID is required for audio processing');
    }

    try {
      // Convert blob to base64
      const audioBase64 = await blobToBase64(audioBlob);
      
      console.log(`🔄 Sending audio chunk to ElevenLabs (${audioBlob.size} bytes)`);
      
      // Send to ElevenLabs streaming API
      const response = await apiService.streamAudioRealtime(audioBase64, voiceId);
      
      if (response.success && (response.audio_chunk || response.audio_data)) {
        const audioData = response.audio_chunk || response.audio_data;
        console.log('✅ Received processed audio from ElevenLabs');
        
        // Convert base64 back to audio and play
        const processedAudio = base64ToBlob(audioData, 'audio/mp3');
        onAudioReceived?.(processedAudio);
        
        // Disable auto-play for D-ID streaming
        // if (autoPlay) {
        //   playAudio(processedAudio);
        // }
      } else {
        console.warn('⚠️ No audio received from ElevenLabs:', response.message);
      }
    } catch (error) {
      console.error('❌ Error processing audio chunk:', error);
      // Don't throw error for D-ID streaming - just log it
      console.warn('⚠️ Audio processing failed, but continuing for D-ID streaming');
    }
    */
  }, [voiceId, onAudioReceived, autoPlay]);

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Play audio
  const playAudio = useCallback((audioBlob) => {
    // Disable audio playback for D-ID streaming
    console.log('🔇 Audio playback disabled for D-ID streaming');
    return;
    
    // Original code commented out:
    /*
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
      audio.play().catch(error => {
        console.warn('⚠️ Could not auto-play audio:', error);
      });
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
    */
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!hasPermission || !mediaRecorderRef.current) {
      initializeMicrophone();
      return;
    }

    try {
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('recording');
      onStatusChange?.('recording');

      console.log('🎤 Recording started');

      // Auto-stop recording after chunk duration
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, chunkDuration);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      handleError(error);
    }
  }, [hasPermission, chunkDuration, initializeMicrophone, onStatusChange]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('processing');
      onStatusChange?.('processing');

      // Clear timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log('🛑 Recording stopped');
    }
  }, [isRecording, onStatusChange]);

  // Handle media recorder events
  useEffect(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    const handleDataAvailable = async (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        
        // Disable automatic audio processing for D-ID streaming
        console.log('🎤 Audio data available - skipping automatic processing for D-ID streaming');
        
        // Just clear chunks and set status to ready
        chunksRef.current = [];
        setStatus('ready');
        onStatusChange?.('ready');
        
        // Original processing code commented out:
        /*
        try {
          // Combine chunks into single blob
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Process the audio chunk
          await processAudioChunk(audioBlob);
          
          // Clear chunks after processing
          chunksRef.current = [];
          
          setStatus('ready');
          onStatusChange?.('ready');
          
        } catch (error) {
          console.error('❌ Error processing audio chunk:', error);
          handleError(error);
        }
        */
      }
    };

    const handleStop = () => {
      console.log('🛑 MediaRecorder stopped');
    };

    const handleError = (event) => {
      console.error('❌ MediaRecorder error:', event.error);
      handleError(event.error);
    };

    mediaRecorder.addEventListener('dataavailable', handleDataAvailable);
    mediaRecorder.addEventListener('stop', handleStop);
    mediaRecorder.addEventListener('error', handleError);

    return () => {
      mediaRecorder.removeEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.removeEventListener('stop', handleStop);
      mediaRecorder.removeEventListener('error', handleError);
    };
  }, [processAudioChunk, onStatusChange]);

  // Monitor audio level
  useEffect(() => {
    if (!analyserRef.current || !isRecording) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
    };

    const interval = setInterval(updateLevel, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initializeMicrophone();
    }
  }, [initializeMicrophone, autoInitialize]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startMicrophone: initializeMicrophone,
    stopMicrophone: () => {
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setStatus('idle');
      setHasPermission(false);
      onStatusChange?.('idle');
    },
    isReady: () => status === 'ready',
    isRecording: () => isRecording
  }), [initializeMicrophone, status, isRecording, onStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, []);

  const getStatusDisplay = () => {
    switch (status) {
      case 'initializing': return 'Инициализация...';
      case 'ready': return voiceName || 'Готов к записи';
      case 'recording': return 'Запись...';
      case 'processing': return 'Обработка...';
      case 'error': return 'Ошибка';
      default: return voiceName || 'Неизвестно';
    }
  };

  const getButtonIcon = () => {
    if (status === 'error') return '❌';
    if (isRecording) return '⏹️';
    return '🎤';
  };

  return (
    <div className={`microphone-input ${className}`}>
      <div className="mic-controls">
        <button
          className={`mic-button ${status} ${isRecording ? 'recording' : ''} ${status === 'error' ? 'error' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={status === 'initializing' || status === 'processing'}
        >
          <span className="mic-icon">{getButtonIcon()}</span>
        </button>
        
        <div className="mic-info">
          <div className="mic-status">{getStatusDisplay()}</div>
          {voiceId && <div className="voice-id">{voiceId}</div>}
        </div>
      </div>
      
      {status === 'error' && (
        <div className="mic-error">
          <span className="error-icon">❌</span>
          <span className="error-text">Ошибка инициализации микрофона</span>
          <button className="retry-button" onClick={initializeMicrophone}>
            Повторить
          </button>
        </div>
      )}
    </div>
  );
});

export default MicrophoneInput;
