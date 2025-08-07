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
      
      const response = await apiService.createDIdStream(imageUrl);
      
      if (response.success) {
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
        throw new Error(response.message || 'Failed to create stream');
      }
    } catch (error) {
      console.error('❌ Error creating stream:', error);
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
  const startStream = useCallback(async (sdpAnswer) => {
    if (!streamState.streamId || !streamState.sessionId) {
      throw new Error('Stream not created yet');
    }
    
    setStreamState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    try {
      console.log('🔗 Step 2: Starting D-ID stream with SDP answer');
      
      const response = await apiService.startDIdStream(
        streamState.streamId,
        streamState.sessionId,
        sdpAnswer
      );
      
      if (response.success) {
        console.log('✅ Stream started successfully');
        
        setStreamState(prev => ({
          ...prev,
          sessionId: response.session_id, // Updated session ID
          status: 'connected',
          isConnected: true
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
  }, [streamState.streamId, streamState.sessionId]);

  // Step 3: Submit ICE candidate
  const submitIceCandidate = useCallback(async (candidate, sdpMid, sdpMLineIndex) => {
    if (!streamState.streamId || !streamState.sessionId) {
      throw new Error('Stream not connected yet');
    }
    
    try {
      console.log('🌐 Step 3: Submitting ICE candidate:', { candidate, sdpMid, sdpMLineIndex });
      
      const response = await apiService.submitDIdIceCandidate(
        streamState.streamId,
        streamState.sessionId,
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
  const createTalk = useCallback(async (text, voiceId) => {
    if (!streamState.streamId || !streamState.sessionId) {
      throw new Error('Stream not connected yet');
    }
    
    setStreamState(prev => ({ ...prev, status: 'talking', error: null }));
    
    try {
      console.log('🎤 Step 4: Creating talk stream:', { text, voiceId });
      
      const response = await apiService.createDIdTalk(
        streamState.streamId,
        streamState.sessionId,
        text,
        voiceId
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
      
      const response = await apiService.closeDIdStream(
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
      const response = await apiService.getDIdStreamStatus(streamState.streamId);
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
