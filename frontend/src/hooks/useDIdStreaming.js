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
        
        setStreamState(prev => ({
          ...prev,
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers,
          status: 'created',
          isCreating: false
        }));
        
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

  // Step 2: Start the stream
  const startStream = useCallback(async (sdpAnswer, streamId, sessionId) => {
    // Use passed parameters if provided, otherwise use state
    const currentStreamId = streamId || streamState.streamId;
    const currentSessionId = sessionId || streamState.sessionId;
    
    if (!currentStreamId || !currentSessionId) {
      console.error('❌ Missing stream data:', { 
        currentStreamId, 
        currentSessionId,
        stateStreamId: streamState.streamId,
        stateSessionId: streamState.sessionId 
      });
      throw new Error('Stream not created yet');
    }
    
    setStreamState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    try {
      console.log('🔗 Step 2: Starting D-ID stream with WebRTC setup');
      console.log('🔗 Using streamId:', currentStreamId);
      console.log('🔗 Using sessionId:', currentSessionId);
      
      // Create WebRTC peer connection using ICE servers from stream creation
      const peerConnection = new RTCPeerConnection({ 
        iceServers: streamState.iceServers || [] 
      });

      // Set up event listeners
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated');
          // Submit ICE candidate
          submitIceCandidate(event.candidate, currentStreamId, currentSessionId);
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
        // Handle video stream - this will be handled by the video player component
      });

      // Set remote description (SDP offer from stream creation)
      // Fix SDP format - replace \r\n with \n
      const cleanSdp = streamState.sdpOffer.replace(/\\r\\n/g, '\n');
      console.log('📝 Cleaned SDP offer:', cleanSdp.substring(0, 100) + '...');
      
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: cleanSdp
      });

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log('📝 SDP answer created');

      // Submit SDP answer using D-ID Tester's working format
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

  // Step 3: Submit ICE candidate
  const submitIceCandidate = useCallback(async (candidate, sdpMid, sdpMLineIndex, streamId, sessionId) => {
    // Use passed parameters if provided, otherwise use state
    const currentStreamId = streamId || streamState.streamId;
    const currentSessionId = sessionId || streamState.sessionId;
    
    if (!currentStreamId || !currentSessionId) {
      console.error('❌ Missing stream data for ICE candidate:', { 
        currentStreamId, 
        currentSessionId,
        stateStreamId: streamState.streamId,
        stateSessionId: streamState.sessionId 
      });
      throw new Error('Stream not connected yet');
    }
    
    try {
      console.log('🌐 Step 3: Submitting ICE candidate:', { candidate, sdpMid, sdpMLineIndex });
      console.log('🌐 Using streamId:', currentStreamId);
      console.log('🌐 Using sessionId:', currentSessionId);
      
      const response = await apiService.submitDIdIceCandidate(
        currentStreamId,
        currentSessionId,
        candidate,
        sdpMid,
        sdpMLineIndex
      );
      
      if (response.success) {
        console.log('✅ ICE candidate submitted successfully');
        
        setStreamState(prev => ({
          ...prev,
          sessionId: response.session_id // Updated session ID
        }));
        
        return { success: true, sessionId: response.session_id };
      } else {
        throw new Error(response.message || 'Failed to submit ICE candidate');
      }
    } catch (error) {
      console.error('❌ Error submitting ICE candidate:', error);
      setStreamState(prev => ({
        ...prev,
        error: error.message,
        status: 'error'
      }));
      throw error;
    }
  }, [streamState.streamId, streamState.sessionId]);

  // Step 4: Create talk stream
  const createTalk = useCallback(async (script, voiceId, streamId, sessionId) => {
    // Use passed parameters if provided, otherwise use state
    const currentStreamId = streamId || streamState.streamId;
    const currentSessionId = sessionId || streamState.sessionId;
    
    if (!currentStreamId || !currentSessionId) {
      console.error('❌ Missing stream data for talk creation:', { 
        currentStreamId, 
        currentSessionId,
        stateStreamId: streamState.streamId,
        stateSessionId: streamState.sessionId 
      });
      throw new Error('Stream not connected yet');
    }
    
    setStreamState(prev => ({ ...prev, status: 'talking', error: null }));
    
    try {
      console.log('🎤 Step 4: Creating talk stream:', { script, voiceId });
      console.log('🎤 Using streamId:', currentStreamId);
      console.log('🎤 Using sessionId:', currentSessionId);
      
      const response = await apiService.createTalk(
        currentStreamId,
        currentSessionId,
        script
      );
      
      if (response.success) {
        console.log('✅ Talk stream created successfully:', {
          talkId: response.talk_id,
          status: response.status
        });
        
        return {
          success: true,
          talkId: response.talk_id,
          status: response.status
        };
      } else {
        throw new Error(response.message || 'Failed to create talk stream');
      }
    } catch (error) {
      console.error('❌ Error creating talk stream:', error);
      setStreamState(prev => ({
        ...prev,
        error: error.message,
        status: 'error'
      }));
      throw error;
    }
  }, [streamState.streamId, streamState.sessionId]);

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
