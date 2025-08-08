import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';

export const useVoiceChanger = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [totalProcessedAudio, setTotalProcessedAudio] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Default voice
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Convert blob to base64
  const blobToBase64 = useCallback((blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Process audio chunk
  const processAudioChunk = useCallback(async (audioBlob, voiceId) => {
    try {
      console.log('🔄 Processing audio chunk...', {
        blobSize: audioBlob.size,
        voiceId
      });

      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await apiService.voiceChangerStream(
        base64Audio,
        voiceId,
        'eleven_multilingual_sts_v2',
        'mp3_44100_128',
        3
      );

      if (response.success && (response.processed_audio || response.audio_data)) {
        const processedAudioBase64 = response.processed_audio || response.audio_data;
        console.log('✅ Audio chunk processed successfully', {
          processedAudioSize: processedAudioBase64.length
        });

        // Convert base64 back to blob
        const binaryString = atob(processedAudioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const processedBlob = new Blob([bytes], { type: 'audio/mp3' });

        return processedBlob;
      } else {
        throw new Error(response.error || 'Failed to process audio chunk');
      }
    } catch (error) {
      console.error('❌ Error processing audio chunk:', error);
      throw error;
    }
  }, [blobToBase64]);

  // Play processed audio
  const playProcessedAudio = useCallback(async (audioBlob) => {
    try {
      const audioContext = initializeAudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      console.log('🔊 Playing processed audio...');
    } catch (error) {
      console.error('❌ Error playing processed audio:', error);
    }
  }, [initializeAudioContext]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioChunks([]);
      setTotalProcessedAudio(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          
          // Process chunk in real-time
          try {
            const processedChunk = await processAudioChunk(event.data, selectedVoice);
            
            // Play processed audio immediately
            await playProcessedAudio(processedChunk);
            
            // Store for total audio
            setAudioChunks(prev => [...prev, processedChunk]);
            
          } catch (error) {
            console.error('❌ Error processing chunk:', error);
            setError(`Error processing audio: ${error.message}`);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Combine all processed chunks
          if (chunks.length > 0) {
            const combinedBlob = new Blob(chunks, { type: 'audio/mp3' });
            setTotalProcessedAudio(combinedBlob);
          }
        } catch (error) {
          console.error('❌ Error combining audio chunks:', error);
          setError(`Error combining audio: ${error.message}`);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('🎤 Voice changer recording started');
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setError(`Failed to start recording: ${error.message}`);
    }
  }, [selectedVoice, processAudioChunk, playProcessedAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      console.log('🛑 Voice changer recording stopped');
    }
  }, [isRecording]);

  // Play total processed audio
  const playTotalAudio = useCallback(async () => {
    if (totalProcessedAudio) {
      try {
        await playProcessedAudio(totalProcessedAudio);
      } catch (error) {
        console.error('❌ Error playing total audio:', error);
        setError(`Error playing audio: ${error.message}`);
      }
    }
  }, [totalProcessedAudio, playProcessedAudio]);

  // Download total processed audio
  const downloadTotalAudio = useCallback(() => {
    if (totalProcessedAudio) {
      const url = URL.createObjectURL(totalProcessedAudio);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-changer-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [totalProcessedAudio]);

  // Clear all data
  const clearData = useCallback(() => {
    setAudioChunks([]);
    setTotalProcessedAudio(null);
    setError(null);
  }, []);

  return {
    // State
    isRecording,
    isProcessing,
    error,
    audioChunks,
    totalProcessedAudio,
    selectedVoice,
    
    // Functions
    startRecording,
    stopRecording,
    playTotalAudio,
    downloadTotalAudio,
    clearData,
    setSelectedVoice,
    setError
  };
};


