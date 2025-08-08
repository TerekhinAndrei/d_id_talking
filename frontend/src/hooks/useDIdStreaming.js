import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useDIdStreaming = () => {
  const [streamState, setStreamState] = useState({
    isCreating: false,
    isConnected: false,
    streamId: null,
    sessionId: null,
    error: null,
    status: 'idle' // idle, creating, connecting, connected, talking, error
  });

  // Step 1: Create a new stream
  const createStream = useCallback(async (imageUrl) => {
    setStreamState(prev => ({ ...prev, isCreating: true, status: 'creating', error: null }));
    
    try {
      console.log('🎬 Step 1: Creating D-ID stream with image:', imageUrl);
      
      const response = await apiService.createStream(imageUrl);
      
      console.log('🎯 Hook received response:', response);
      console.log('🔍 Checking response.success:', response.success);
      console.log('🔍 Response type:', typeof response.success);
      console.log('🔍 Response keys:', Object.keys(response));
      
      // Check if success is true (boolean) or truthy
      const isSuccess = response.success === true || response.success === 'true';
      console.log('🔍 Is success:', isSuccess);
      
      if (isSuccess) {
        console.log('✅ Stream created successfully:', {
          streamId: response.stream_id,
          sessionId: response.session_id,
          hasSdpOffer: !!response.sdp_offer,
          hasIceServers: !!response.ice_servers
        });
        
        console.log('📝 Saving to stream state:', {
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer ? 'present' : 'missing',
          iceServers: response.ice_servers ? 'present' : 'missing'
        });
        
        console.log('📝 Actual SDP offer:', response.sdp_offer ? response.sdp_offer.substring(0, 100) + '...' : 'null');
        
        setStreamState(prev => ({
          ...prev,
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers,
          status: 'created',
          isCreating: false
        }));
        
        console.log('📝 After setStreamState - checking what was saved:');
        console.log('📝 response.sdp_offer type:', typeof response.sdp_offer);
        console.log('📝 response.sdp_offer length:', response.sdp_offer ? response.sdp_offer.length : 'null');
        console.log('📝 response.ice_servers type:', typeof response.ice_servers);
        console.log('📝 response.ice_servers length:', response.ice_servers ? response.ice_servers.length : 'null');
        
        return {
          success: true,
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers
        };
      } else {
        console.log('❌ Response.success is false, response:', response);
        console.log('❌ Response.error:', response.error);
        
        // Check for specific D-ID authentication error
        if (response.error && response.error.includes('Authentication failed')) {
          throw new Error('Ошибка подключения к D-ID API. Сервер не может подключиться к D-ID.');
        }
        
        // Check for backend method missing error
        if (response.error && response.error.includes('_create_session_if_needed')) {
          throw new Error('Бэкенд не полностью реализован. Некоторые методы D-ID API отсутствуют.');
        }
        
        // Check for D-ID API errors
        if (response.error && response.error.includes('SDP exchange failed')) {
          throw new Error('D-ID API отклонил запрос. Проверьте формат данных.');
        }
        
        throw new Error(response.error || response.message || 'Failed to create stream');
      }
    } catch (error) {
      console.error('❌ Error creating stream:', error);
      console.error('❌ Error stack:', error.stack);
      setStreamState(prev => ({
        ...prev,
        error: error.message,
        status: 'error',
        isCreating: false
      }));
      throw error;
    }
  }, []);

  // Step 2: Start the stream (WebRTC setup) - EXACT SAME FLOW AS DIdStreamingTester
  const startStream = useCallback(async (sdpOffer, iceServers, streamId, sessionId) => {
    console.log('🔗 Step 2: Starting D-ID stream with WebRTC setup');
    
    // Use passed parameters if provided, otherwise use state
    const currentSdpOffer = sdpOffer || streamState.sdpOffer;
    const currentIceServers = iceServers || streamState.iceServers;
    const currentStreamId = streamId || streamState.streamId;
    const currentSessionId = sessionId || streamState.sessionId;
    
    if (!currentSdpOffer || !currentIceServers) {
      console.error('❌ Missing SDP offer or ICE servers');
      console.error('❌ sdpOffer:', currentSdpOffer ? 'present' : 'missing');
      console.error('❌ iceServers:', currentIceServers ? 'present' : 'missing');
      throw new Error('Missing SDP offer or ICE servers');
    }

    console.log('🔗 Using streamId:', currentStreamId);
    console.log('🔗 Using sessionId:', currentSessionId);
    console.log('🔗 sdpOffer type:', typeof currentSdpOffer);
    console.log('🔗 sdpOffer length:', currentSdpOffer ? currentSdpOffer.length : 'null');
    console.log('🔗 iceServers type:', typeof currentIceServers);
    console.log('🔗 iceServers length:', currentIceServers ? currentIceServers.length : 'null');
    
    setStreamState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    try {
      // Create WebRTC peer connection - EXACT SAME AS DIdStreamingTester
      const peerConnection = new RTCPeerConnection({ 
        iceServers: currentIceServers 
      });

      // Set up event listeners - EXACT SAME AS DIdStreamingTester
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated');
          // Submit ICE candidate
          submitIceCandidate(event.candidate);
        }
      });

      peerConnection.addEventListener('iceconnectionstatechange', () => {
        console.log(`🔗 ICE connection state: ${peerConnection.iceConnectionState}`);
        if (peerConnection.iceConnectionState === 'connected') {
          console.log('✅ WebRTC connection established!');
          setStreamState(prev => ({ ...prev, isConnected: true }));
        }
      });

      peerConnection.addEventListener('track', (event) => {
        console.log('🎬 Received video track!');
        // Handle video stream
        const videoElement = document.getElementById('video-player');
        if (videoElement && event.streams[0]) {
          videoElement.srcObject = event.streams[0];
        }
      });

      // Set remote description (SDP offer) - EXACT SAME AS DIdStreamingTester
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: currentSdpOffer
      });

      // Create answer - EXACT SAME AS DIdStreamingTester
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log('📝 SDP answer created');

      // Submit SDP answer - EXACT SAME AS DIdStreamingTester
      console.log('📝 Submitting SDP answer object:', answer);
      const response = await apiService.startDIdStream(
        currentStreamId,
        currentSessionId,
        answer
      );
      
      if (response.success) {
        console.log('✅ Stream started successfully');
        
        setStreamState(prev => ({
          ...prev,
          sessionId: response.session_id, // Updated session ID
          status: 'connected',
          isConnected: true,
          peerConnection
        }));
        
        return { success: true, sessionId: response.session_id };
      } else {
        throw new Error(response.message || 'Failed to start stream');
      }
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      setStreamState(prev => ({
        ...prev,
        error: error.message,
        status: 'error'
      }));
      throw error;
    }
  }, [streamState.streamId, streamState.sessionId, streamState.sdpOffer, streamState.iceServers]);

  // Submit ICE candidate - EXACT SAME AS DIdStreamingTester
  const submitIceCandidate = useCallback(async (candidate) => {
    try {
      console.log('🎬 submitIceCandidate called with:', {
        streamId: streamState.streamId,
        sessionId: streamState.sessionId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
      
      if (!streamState.streamId || !streamState.sessionId) {
        console.error('❌ Missing streamId or sessionId for ICE candidate');
        return;
      }
      
      const response = await apiService.submitDIdIceCandidate(
        streamState.streamId,
        streamState.sessionId,
        candidate.candidate,
        candidate.sdpMid,
        candidate.sdpMLineIndex
      );

      if (response.success) {
        console.log('✅ ICE candidate submitted');
      } else {
        console.error('❌ Failed to submit ICE candidate:', response.error);
      }
    } catch (error) {
      console.error('❌ Error submitting ICE candidate:', error);
    }
  }, [streamState, apiService]);

  // Step 4: Create talk stream - EXACT SAME AS DIdStreamingTester
  const createTalk = useCallback(async () => {
    try {
      console.log('🎤 Step 4: Creating talk stream...');
      
      if (!streamState.streamId || !streamState.sessionId) {
        console.error('❌ Missing streamId or sessionId for talk creation');
        return { success: false, error: 'Missing stream data' };
      }
      
      // Use text script format that works with D-ID API - EXACT SAME AS DIdStreamingTester
      const textScript = {
        type: "text",
        input: "Hello! This is a test message from D-ID streaming.",
        provider: {
          type: "microsoft",
          voice_id: "en-US-JennyNeural"
        }
      };

      console.log('🎤 Using streamId:', streamState.streamId);
      console.log('🎤 Using sessionId:', streamState.sessionId);
      console.log('🎤 Using script:', textScript);

      const response = await apiService.createDIdTalk(
        streamState.streamId,
        streamState.sessionId,
        textScript
      );

      if (response.success) {
        console.log('✅ Talk stream created successfully!');
        return { success: true };
      } else {
        console.error('❌ Failed to create talk stream:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('❌ Error creating talk stream:', error);
      return { success: false, error: error.message };
    }
  }, [streamState, apiService]);

  // Step 5: Close stream
  const closeStream = useCallback(async () => {
    if (!streamState.streamId || !streamState.sessionId) {
      console.log('⚠️ No active stream to close');
      return;
    }
    
    try {
      console.log('🔚 Step 5: Closing D-ID stream');
      
      const response = await apiService.closeStream(
        streamState.streamId,
        streamState.sessionId
      );
      
      if (response.success) {
        console.log('✅ Stream closed successfully');
      } else {
        console.warn('⚠️ Stream close response:', response);
      }
    } catch (error) {
      console.error('❌ Error closing stream:', error);
    } finally {
      // Reset state regardless of success/failure
      setStreamState({
        isCreating: false,
        isConnected: false,
        streamId: null,
        sessionId: null,
        error: null,
        status: 'idle'
      });
    }
  }, [streamState.streamId, streamState.sessionId]);

  // Get stream status
  const getStreamStatus = useCallback(async () => {
    if (!streamState.streamId) {
      return null;
    }
    
    try {
      const response = await apiService.getStreamStatus(streamState.streamId);
      return response;
    } catch (error) {
      console.error('❌ Error getting stream status:', error);
      return null;
    }
  }, [streamState.streamId]);

  // Reset state
  const resetState = useCallback(() => {
    setStreamState({
      isCreating: false,
      isConnected: false,
      streamId: null,
      sessionId: null,
      error: null,
      status: 'idle'
    });
  }, []);

  return {
    // State
    streamState,
    
    // Actions
    createStream,
    startStream,
    submitIceCandidate,
    createTalk,
    closeStream,
    getStreamStatus,
    resetState
  };
};
