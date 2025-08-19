import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDIdMicrophoneTalkUpdated } from './useDIdMicrophoneTalkUpdated';
import { useVideoStreamStatus } from './useVideoStreamStatus';
import { DEFAULT_AVATAR_URL } from '../constants';

export const useVoiceToAvatar = (videoElementId, imageUrl = null) => {
  const [streamState, setStreamState] = useState({
    step: 0,
    streamId: null,
    sessionId: null,
    sdpOffer: null,
    iceServers: null,
    peerConnection: null,
    isConnected: false,
    isCreating: false,
    isStarting: false,
    error: null,
    logs: [],
    status: 'idle' // 'idle', 'creating', 'starting', 'connected', 'error'
  });

  // Состояние для управления видимостью заглушки
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const placeholderTimerRef = useRef(null);

  // Используем хук для микрофонного talk
  const {
    isProcessing: isMicProcessing,
    isRecording: isMicRecording,
    isUploading: isMicUploading,
    isSendingToDid,
    error: micError,
    logs: micLogs,
    streamStats: micStats,
    uploadedFiles: micUploadedFiles,
    didUploadQueue,
    createTalkMic,
    stopTalkMic,
    clearState: clearMicState
  } = useDIdMicrophoneTalkUpdated();

  // Используем хук для определения статуса воспроизведения видеострима
  const isVideoStreamPlaying = useVideoStreamStatus(videoElementId);

  const addLog = useCallback((message, type = 'info') => {
    setStreamState(prev => ({
      ...prev,
      logs: [...prev.logs, { message, type, timestamp: new Date().toISOString() }]
    }));
  }, []);

  // Step 1: Create a new stream
  const createStream = useCallback(async (imageUrl = null) => {
    try {
      console.log('🎯 createStream called with imageUrl:', imageUrl);
      setStreamState(prev => ({ ...prev, isCreating: true, status: 'creating', error: null }));
      addLog('🚀 Step 1: Creating new stream...', 'info');
      
      // Используем переданное изображение или дефолтное
      const defaultImageUrl = DEFAULT_AVATAR_URL;
      
      // Преобразуем относительный URL в абсолютный (на случай если передается относительный URL)
      let finalImageUrl = imageUrl || defaultImageUrl;
      if (finalImageUrl.startsWith('/')) {
        finalImageUrl = `${window.location.origin}${finalImageUrl}`;
      }
      
      addLog(`🖼️ Используем изображение: ${finalImageUrl}`, 'info');
      
      // Проверяем, существует ли изображение
      addLog('🔍 Проверяем доступность изображения...', 'info');
      try {
        const imageCheck = await fetch(finalImageUrl, { method: 'HEAD' });
        if (!imageCheck.ok) {
          addLog(`❌ Изображение не найдено: ${finalImageUrl}`, 'error');
          setStreamState(prev => ({ 
            ...prev, 
            error: 'Изображение не найдено. Проверьте URL.',
            status: 'error',
            isCreating: false
          }));
          return false;
        }
        addLog('✅ Изображение доступно', 'success');
      } catch (imageError) {
        addLog(`❌ Ошибка проверки изображения: ${imageError.message}`, 'error');
        setStreamState(prev => ({ 
          ...prev, 
          error: 'Не удалось проверить изображение.',
          status: 'error',
          isCreating: false
        }));
        return false;
      }
      
      const response = await apiService.createDIdStream(finalImageUrl, 'Voice to Avatar stream');
      
      addLog(`🔍 API Response: ${JSON.stringify(response)}`, 'info');
      addLog(`🔍 Response.success: ${response.success}`, 'info');
      
      if (response.success) {
        addLog('✅ Stream created successfully!', 'success');
        addLog(`📊 Stream ID: ${response.stream_id}`, 'info');
        addLog(`📊 Session ID: ${response.session_id}`, 'info');
        addLog(`📊 Has SDP Offer: ${!!response.sdp_offer}`, 'info');
        addLog(`📊 Has ICE Servers: ${!!response.ice_servers}`, 'info');
        
        const streamData = {
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers
        };
        
        setStreamState(prev => ({
          ...prev,
          step: 1,
          ...streamData,
          status: 'created',
          isCreating: false,
          error: null
        }));
        
        return streamData;
      } else {
        let errorMessage = response.error || 'Unknown error';
        
        // Check for specific backend errors
        if (response.error && response.error.includes('_create_session_if_needed')) {
          errorMessage = 'Бэкенд не полностью реализован. Метод создания стрима отсутствует.';
        }
        
        addLog(`❌ Failed to create stream: ${errorMessage}`, 'error');
        setStreamState(prev => ({ 
          ...prev, 
          error: errorMessage,
          status: 'error',
          isCreating: false
        }));
        return false;
      }
    } catch (error) {
      addLog(`❌ Error creating stream: ${error.message}`, 'error');
      setStreamState(prev => ({ 
        ...prev, 
        error: error.message,
        status: 'error',
        isCreating: false
      }));
      return false;
    }
  }, [imageUrl, addLog]);

  // Step 2: Start the stream (WebRTC setup)
  const startStream = useCallback(async (streamData = null) => {
    try {
      setStreamState(prev => ({ ...prev, isStarting: true, status: 'starting', error: null }));
      addLog('🔗 Step 2: Starting stream with WebRTC...', 'info');
      
      // Используем переданные данные или текущее состояние
      const currentStreamData = streamData || streamState;
      
      if (!currentStreamData.streamId || !currentStreamData.sessionId || !currentStreamData.sdpOffer) {
        addLog('❌ Missing required stream data', 'error');
        addLog(`🔍 streamId: ${currentStreamData.streamId}`, 'error');
        addLog(`🔍 sessionId: ${currentStreamData.sessionId}`, 'error');
        addLog(`🔍 sdpOffer: ${!!currentStreamData.sdpOffer}`, 'error');
        setStreamState(prev => ({ 
          ...prev, 
          error: 'Missing required stream data',
          status: 'error',
          isStarting: false
        }));
        return false;
      }
      
      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: currentStreamData.iceServers || [
          { urls: 'stun:stun.cloudflare.com:3478' }
        ]
      });
      
      // Set up event handlers
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          addLog('🧊 ICE candidate generated', 'info');
          submitIceCandidate(event.candidate, currentStreamData.streamId, currentStreamData.sessionId);
        }
      });
      
      peerConnection.addEventListener('connectionstatechange', () => {
        addLog(`🔗 Connection state: ${peerConnection.connectionState}`, 'info');
        if (peerConnection.connectionState === 'connected') {
          addLog('✅ WebRTC connection established!', 'success');
          addLog(`🎬 PeerConnection state: ${peerConnection.connectionState}`, 'info');
          addLog(`🎬 ICE connection state: ${peerConnection.iceConnectionState}`, 'info');
          addLog(`🎬 Signaling state: ${peerConnection.signalingState}`, 'info');
          addLog(`🎬 Receivers count: ${peerConnection.getReceivers().length}`, 'info');
          addLog(`🎬 Senders count: ${peerConnection.getSenders().length}`, 'info');
          setStreamState(prev => ({ ...prev, isConnected: true }));
        }
      });
      
      peerConnection.addEventListener('track', async (event) => {
        addLog('🎬 Received track!', 'success');
        addLog(`🎬 Track kind: ${event.track.kind}`, 'info');
        addLog(`🎬 Streams count: ${event.streams.length}`, 'info');
        addLog(`🎬 Track enabled: ${event.track.enabled}`, 'info');
        addLog(`🎬 Track readyState: ${event.track.readyState}`, 'info');
        
        if (event.track.kind === 'video') {
          addLog('🎬 Received VIDEO track!', 'success');
          // Handle video stream
          let videoElement = document.getElementById(videoElementId);
          addLog(`🎬 Video element found: ${!!videoElement}`, 'info');
          addLog(`🎬 Video element ID: ${videoElementId}`, 'info');
          
          // Если видео элемент не найден, попробуем найти его через небольшую задержку
          if (!videoElement) {
            addLog('⏳ Video element not found, waiting for DOM...', 'warning');
            await new Promise(resolve => setTimeout(resolve, 100));
            videoElement = document.getElementById(videoElementId);
            addLog(`🎬 Video element found after delay: ${!!videoElement}`, 'info');
          }
          
          if (videoElement && event.streams[0]) {
            videoElement.srcObject = event.streams[0];
            addLog('✅ Video stream assigned to element', 'success');
            addLog(`🎬 Video element srcObject: ${!!videoElement.srcObject}`, 'info');
            addLog(`🎬 Video element readyState: ${videoElement.readyState}`, 'info');
            addLog(`🎬 Video element paused: ${videoElement.paused}`, 'info');
            addLog(`🎬 Video element muted: ${videoElement.muted}`, 'info');
            
            // Размьючиваем видеоплеер
            videoElement.muted = false;
            addLog('🔊 Video player unmuted', 'success');
            
            // Пытаемся воспроизвести видео
            try {
              await videoElement.play();
              addLog('✅ Video playback started successfully', 'success');
            } catch (playError) {
              addLog(`⚠️ Video play failed: ${playError.message}`, 'warning');
            }
            
            // Скрываем заглушку после небольшой задержки
            setTimeout(() => {
              setShowPlaceholder(false);
            }, 1000);
          } else {
            addLog('❌ Video element not found or no streams', 'error');
            addLog(`🔍 Available video elements:`, 'error');
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach((video, index) => {
              addLog(`   ${index}: id="${video.id}"`, 'error');
            });
          }
        } else if (event.track.kind === 'audio') {
          addLog('🎵 Received AUDIO track!', 'success');
        }
      });
      
      // Set remote description (SDP offer)
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: currentStreamData.sdpOffer
      });
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      addLog('📝 SDP answer created', 'info');
      
      // Submit SDP answer
      const sdpResponse = await apiService.startDIdStream(
        currentStreamData.streamId,
        currentStreamData.sessionId,
        answer.sdp
      );
      
      if (sdpResponse.success) {
        addLog('✅ SDP answer submitted successfully!', 'success');
        console.log('🎯 startStream completed successfully');
        
        const updatedStreamData = {
          ...currentStreamData,
          step: 2,
          peerConnection,
          status: 'connected',
          isConnected: true,
          isStarting: false,
          error: null
        };
        
        setStreamState(prev => ({
          ...prev,
          ...updatedStreamData
        }));
        
        return updatedStreamData;
      } else {
        let errorMessage = sdpResponse.error;
        
        // Check for specific backend errors
        if (sdpResponse.error && sdpResponse.error.includes('_create_session_if_needed')) {
          errorMessage = 'Бэкенд не полностью реализован. Метод SDP submission отсутствует.';
        }
        
        addLog(`❌ Failed to submit SDP answer: ${errorMessage}`, 'error');
        setStreamState(prev => ({ 
          ...prev, 
          error: errorMessage,
          status: 'error',
          isStarting: false
        }));
        return false;
      }
    } catch (error) {
      addLog(`❌ Error starting stream: ${error.message}`, 'error');
      setStreamState(prev => ({ 
        ...prev, 
        error: error.message,
        status: 'error',
        isStarting: false
      }));
      return false;
    }
  }, [streamState, videoElementId, addLog]);

  // Submit ICE candidate
  const submitIceCandidate = useCallback(async (candidate, streamId = null, sessionId = null) => {
    try {
      addLog('🧊 Submitting ICE candidate...', 'info');
      
      // Используем переданные параметры или текущее состояние
      const currentStreamId = streamId || streamState.streamId;
      const currentSessionId = sessionId || streamState.sessionId;
      
      const response = await apiService.submitDIdIceCandidate(
        currentStreamId,
        currentSessionId,
        candidate.candidate,
        candidate.sdpMid,
        candidate.sdpMLineIndex
      );
      
      if (response.success) {
        addLog('✅ ICE candidate submitted', 'success');
      } else {
        let errorMessage = response.error;
        
        // Check for specific backend errors
        if (response.error && response.error.includes('_create_session_if_needed')) {
          errorMessage = 'Бэкенд не полностью реализован. Метод ICE submission отсутствует.';
        }
        
        addLog(`❌ Failed to submit ICE candidate: ${errorMessage}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error submitting ICE candidate: ${error.message}`, 'error');
    }
  }, [streamState, addLog]);

  // Step 3: Start microphone talk
  const startVoiceToAvatar = useCallback(async (selectedVoice, streamData = null) => {
    try {
      console.log('🎯 startVoiceToAvatar called with voice:', selectedVoice);
      console.log('🎯 Current streamState:', streamState);
      addLog('🎤 Step 3: Starting voice to avatar...', 'info');
      
      // Используем переданные данные или текущее состояние
      const currentStreamData = streamData || streamState;
      
      if (!currentStreamData.streamId || !currentStreamData.sessionId) {
        console.log('❌ Stream not ready - streamId:', currentStreamData.streamId, 'sessionId:', currentStreamData.sessionId);
        addLog('❌ Stream not ready', 'error');
        return false;
      }
      
      if (!currentStreamData.isConnected) {
        console.log('❌ WebRTC connection not established - isConnected:', currentStreamData.isConnected);
        addLog('❌ WebRTC connection not established', 'error');
        return false;
      }
      
      if (!selectedVoice) {
        addLog('❌ Voice not selected', 'error');
        return false;
      }
      
      addLog('✅ All prerequisites met', 'success');
      addLog(`🎵 Selected voice: ${selectedVoice}`, 'info');
      
      // Размьючиваем видеоплеер перед началом голосового стрима
      const videoElement = document.getElementById(videoElementId);
      if (videoElement) {
        videoElement.muted = false;
        addLog('🔊 Video player unmuted for voice stream', 'success');
        console.log('🔊 Video element muted state:', videoElement.muted);
      } else {
        addLog('❌ Video element not found for unmuting', 'error');
        console.log('❌ Video element not found, videoElementId:', videoElementId);
      }
      
      // Используем хук для микрофонного talk
      await createTalkMic(currentStreamData.streamId, currentStreamData.sessionId, selectedVoice);
      
      addLog('✅ Voice to avatar started successfully!', 'success');
      return true;
      
    } catch (error) {
      addLog(`❌ Error starting voice to avatar: ${error.message}`, 'error');
      return false;
    }
  }, [streamState, createTalkMic, addLog]);

  // Step 4: Stop microphone talk
  const stopVoiceToAvatar = useCallback(async () => {
    try {
      addLog('🛑 Stopping voice to avatar...', 'info');
      await stopTalkMic();
      addLog('✅ Voice to avatar stopped', 'success');
    } catch (error) {
      addLog(`❌ Error stopping voice to avatar: ${error.message}`, 'error');
    }
  }, [stopTalkMic, addLog]);

  // Step 5: Close stream
  const closeStream = useCallback(async () => {
    try {
      addLog('🔚 Step 5: Closing stream...', 'info');
      
      // Останавливаем микрофонный talk
      try {
        await stopTalkMic();
      } catch (e) {
        addLog('⚠️ Error stopping microphone talk during close', 'warning');
      }
      
      if (streamState.streamId && streamState.sessionId) {
        const response = await apiService.closeDIdStream(
          streamState.streamId,
          streamState.sessionId
        );
        
        if (response.success) {
          addLog('✅ Stream closed successfully!', 'success');
        } else {
          addLog(`❌ Failed to close stream: ${response.error}`, 'error');
        }
      }
      
      // Close WebRTC connection
      if (streamState.peerConnection) {
        streamState.peerConnection.close();
        addLog('✅ WebRTC connection closed', 'success');
      }
      
      // Reset state
      setStreamState(prev => ({
        ...prev,
        step: 0,
        streamId: null,
        sessionId: null,
        sdpOffer: null,
        iceServers: null,
        peerConnection: null,
        isConnected: false,
        status: 'idle',
        error: null
      }));
      
      // Clear microphone state
      clearMicState();
      
      // Мьютим видеоплеер при закрытии стрима
      const videoElement = document.getElementById(videoElementId);
      if (videoElement) {
        videoElement.muted = true;
        addLog('🔇 Video player muted on stream close', 'info');
      }
      
      // Show placeholder again
      setShowPlaceholder(true);
      
    } catch (error) {
      addLog(`❌ Error closing stream: ${error.message}`, 'error');
    }
  }, [streamState, stopTalkMic, clearMicState, addLog]);

  // Автоматический процесс установки стрима
  const setupStream = useCallback(async (selectedVoice, imageUrl = null) => {
    try {
      addLog('🚀 Starting automatic stream setup...', 'info');
      addLog(`🎤 Selected voice: ${selectedVoice}`, 'info');
      
      // Step 1: Create stream
      console.log('🎯 About to call createStream...');
      const createResult = await createStream(imageUrl);
      console.log('🎯 createStream result:', createResult);
      if (!createResult) {
        addLog('❌ Failed to create stream', 'error');
        return false;
      }
      
      // Step 2: Start stream
      console.log('🎯 About to call startStream...');
      const startResult = await startStream(createResult);
      console.log('🎯 startStream result:', startResult);
      if (!startResult) {
        addLog('❌ Failed to start stream', 'error');
        return false;
      }
      
      // Step 3: Start voice to avatar
      console.log('🎯 About to call startVoiceToAvatar...');
      const voiceSuccess = await startVoiceToAvatar(selectedVoice, startResult);
      console.log('🎯 startVoiceToAvatar result:', voiceSuccess);
      if (!voiceSuccess) {
        addLog('❌ Failed to start voice to avatar', 'error');
        return false;
      }
      
      addLog('✅ Automatic stream setup completed successfully!', 'success');
      
      // Принудительно размьючиваем видеоплеер после успешной настройки
      const videoElement = document.getElementById(videoElementId);
      if (videoElement) {
        videoElement.muted = false;
        addLog('🔊 Video player unmuted after setup completion', 'success');
        console.log('🔊 Final video element muted state:', videoElement.muted);
      }
      
      return true;
      
    } catch (error) {
      addLog(`❌ Error in automatic stream setup: ${error.message}`, 'error');
      return false;
    }
  }, [createStream, startStream, startVoiceToAvatar, addLog]);

  // Reset everything
  const reset = useCallback(() => {
    addLog('🔄 Resetting voice to avatar...', 'info');
    
    // Close stream if active
    if (streamState.status !== 'idle') {
      closeStream();
    }
    
    // Clear microphone state
    clearMicState();
    
    // Reset stream state
    setStreamState({
      step: 0,
      streamId: null,
      sessionId: null,
      sdpOffer: null,
      iceServers: null,
      peerConnection: null,
      isConnected: false,
      isCreating: false,
      isStarting: false,
      error: null,
      logs: [],
      status: 'idle'
    });
    
    // Show placeholder
    setShowPlaceholder(true);
    
    addLog('✅ Reset completed', 'success');
  }, [streamState.status, closeStream, clearMicState, addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamState.peerConnection) {
        streamState.peerConnection.close();
      }
      if (placeholderTimerRef.current) {
        clearTimeout(placeholderTimerRef.current);
      }
    };
  }, [streamState.peerConnection]);

  return {
    // State
    streamState,
    showPlaceholder,
    
    // Video stream status
    isVideoStreamPlaying,
    
    // Microphone state from useDIdMicrophoneTalk
    isMicProcessing,
    isMicRecording,
    isMicUploading,
    isSendingToDid,
    micError,
    micLogs,
    micStats,
    micUploadedFiles,
    didUploadQueue,
    
    // Actions
    setupStream,
    startVoiceToAvatar,
    stopVoiceToAvatar,
    closeStream,
    reset,
    
    // Individual steps (for manual control)
    createStream,
    startStream,
    submitIceCandidate,
    
    // Logs
    logs: streamState.logs
  };
};
