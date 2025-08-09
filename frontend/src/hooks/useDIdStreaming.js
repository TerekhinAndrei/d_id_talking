import { useState, useCallback, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { DidWebRtcSession } from '../services/webrtc/DidWebRtcSession';

export const useDIdStreaming = () => {
  const [streamState, setStreamState] = useState({
    isCreating: false,
    isConnected: false,
    isActive: false,
    streamId: null,
    sessionId: null,
    sdpOffer: null,
    iceServers: null,
    peerConnection: null,
    audioStream: null,
    videoStream: null,
    error: null,
    status: 'idle'
  });

  // Keep a reference to WebRTC session (OOP encapsulation)
  const sessionRef = useRef(null);

  // Log all streamState changes
  useEffect(() => {
    console.log('🔄 streamState changed:', {
      isCreating: streamState.isCreating,
      isConnected: streamState.isConnected,
      isActive: streamState.isActive,
      streamId: streamState.streamId,
      hasVideoStream: !!streamState.videoStream,
      hasAudioStream: !!streamState.audioStream,
      videoStreamId: streamState.videoStream?.id || 'null',
      videoStreamActive: streamState.videoStream?.active || false,
      status: streamState.status
    });
  }, [streamState]);

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

  // Add audio track to peer connection
  const addAudioTrack = useCallback(async (peerConnection) => {
    try {
      console.log('🎤 Getting microphone access...');
      
      // Get microphone stream
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      console.log('✅ Microphone access granted');
      
      // Get audio track from stream
      const audioTrack = audioStream.getAudioTracks()[0];
      console.log('🎤 Audio track:', audioTrack);
      
      // Add audio track to peer connection
      peerConnection.addTrack(audioTrack, audioStream);
      console.log('✅ Audio track added to peer connection');
      
      return audioStream;
    } catch (error) {
      console.error('❌ Error getting microphone access:', error);
      throw error;
    }
  }, []);

  // Submit ICE candidate - define BEFORE startStream to avoid TDZ in deps
  const submitIceCandidate = useCallback(async (candidate, streamId, sessionId) => {
    try {
      console.log('🎬 submitIceCandidate called with:', {
        streamId: streamId,
        sessionId: sessionId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
      
      if (!streamId || !sessionId) {
        console.error('❌ Missing streamId or sessionId for ICE candidate');
        return;
      }
      
      const response = await apiService.submitDIdIceCandidate(
        streamId,
        sessionId,
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
  }, []);

  // Start D-ID stream with WebRTC setup (via DidWebRtcSession)
  const startStream = useCallback(async (streamId, sessionId, sdpOffer, iceServers) => {
    // Use passed parameters if provided, otherwise use state
    const currentStreamId = streamId || streamState.streamId;
    const currentSessionId = sessionId || streamState.sessionId;
    const currentSdpOffer = sdpOffer || streamState.sdpOffer;
    const currentIceServers = iceServers || streamState.iceServers;

    if (!currentStreamId || !currentSessionId || !currentSdpOffer || !currentIceServers) {
      throw new Error('Missing required stream data');
    }

    console.log('🔗 Step 2: Starting D-ID stream with WebRTC setup');
    console.log('🔗 Using streamId:', currentStreamId);
    console.log('🔗 Using sessionId:', currentSessionId);
    console.log('🔗 sdpOffer type:', typeof currentSdpOffer);
    console.log('🔗 sdpOffer length:', currentSdpOffer.length);
    console.log('🔗 iceServers type:', typeof currentIceServers);
    console.log('🔗 iceServers length:', currentIceServers.length);

    setStreamState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    try {
      // Create session
      sessionRef.current = new DidWebRtcSession(currentIceServers, {
        onIceCandidate: (candidate) => {
          console.log('🧊 ICE candidate generated');
          submitIceCandidate(candidate, currentStreamId, currentSessionId);
        },
        onIceConnectionStateChange: (state) => {
          console.log('🔗 ICE connection state:', state);
          if (state === 'connected') {
            console.log('✅ WebRTC connection established!');
            setStreamState(prev => ({ ...prev, isConnected: true, isActive: true, status: 'connected' }));
          }
        },
        onTrack: (event) => {
          console.log('🎬 Received track:', { kind: event.track.kind, id: event.track.id, streams: event.streams.length });
          if (event.streams[0]) {
            setStreamState(prev => ({ ...prev, videoStream: event.streams[0] }));
          }
        }
      });

      const pc = sessionRef.current.createPeerConnection();

      // Add audio track from microphone (optional)
      let audioStream = null;
      try {
        audioStream = await addAudioTrack(pc);
      } catch (audioError) {
        console.warn('⚠️ Could not add audio track:', audioError);
      }

      // Apply remote offer and create local answer
      await sessionRef.current.setRemoteOffer(currentSdpOffer);
      const answer = await sessionRef.current.createAnswerAndSetLocal();

      console.log('📝 SDP answer created');

      // Submit SDP answer
      console.log('📝 Submitting SDP answer object:', answer);
      const response = await apiService.startDIdStream(currentStreamId, currentSessionId, answer);
      
      if (response.success) {
        console.log('✅ Stream started successfully');
        console.log('🔍 Response object:', response);
        
        setStreamState(prev => {
          const newState = {
            ...prev,
            streamId: currentStreamId, // Keep the original streamId
            sessionId: response.session_id || currentSessionId, // Use response session_id or keep current
            status: 'connected',
            isConnected: true,
            isActive: true,
            peerConnection: pc,
            audioStream, // Store audio stream for later use
            videoStream: prev.videoStream // Preserve video stream from previous state
          };
          
          console.log('🔄 Updating stream state to:', newState);
          console.log('🔍 Current values:', {
            currentStreamId,
            currentSessionId,
            responseSessionId: response.session_id,
            hasVideoStream: !!prev.videoStream,
            videoStreamId: prev.videoStream?.id || 'null'
          });
          return newState;
        });

        // No silent warmup: align with official demo, video will activate when WS audio starts streaming

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
  }, [streamState.streamId, streamState.sessionId, streamState.sdpOffer, streamState.iceServers, addAudioTrack, submitIceCandidate]);

  // (moved above to avoid TDZ)

  // Step 4: Create talk stream - EXACT SAME AS DIdStreamingTester
  const createTalk = useCallback(async (streamId, sessionId, voice) => {
    try {
      console.log('🎤 Step 4: Creating talk stream...');
      
      if (!streamId || !sessionId) {
        console.error('❌ Missing streamId or sessionId for talk creation');
        return { success: false, error: 'Missing stream data' };
      }
      
      if (!voice) {
        console.error('❌ Missing voice for talk creation');
        return { success: false, error: 'Missing voice data' };
      }

      // Create script with voice for D-ID API
      const script = {
        type: "text",
        input: "Hello! This is a test message from D-ID streaming.",
        provider: {
          type: "elevenlabs",
          voice_id: voice.voice_id || voice.id || voice
        }
      };

      console.log('🎤 Using streamId:', streamId);
      console.log('🎤 Using sessionId:', sessionId);
      console.log('🎤 Using voice:', voice);
      console.log('🎤 Using script:', script);

      const response = await apiService.createDIdTalk(
        streamId,
        sessionId,
        script
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
  }, []);

  // Stop audio track
  const stopAudioTrack = useCallback(() => {
    if (streamState.audioStream) {
      console.log('🔇 Stopping audio track...');
      const tracks = streamState.audioStream.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped:', track);
      });
    }
  }, [streamState.audioStream]);

  // Step 5: Close stream
  const closeStream = useCallback(async () => {
    if (!streamState.streamId || !streamState.sessionId) {
      console.log('⚠️ No active stream to close');
      return;
    }
    
    try {
      console.log('🔚 Step 5: Closing D-ID stream');
      
      // Stop audio track first
      stopAudioTrack();
      
      // Close peer connection if exists
      if (sessionRef.current) {
        console.log('🔌 Closing peer connection...');
        sessionRef.current.close();
        sessionRef.current = null;
      } else if (streamState.peerConnection) {
        try { streamState.peerConnection.close(); } catch (_) {}
      }
      
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
        isActive: false,
        streamId: null,
        sessionId: null,
        sdpOffer: null,
        iceServers: null,
        peerConnection: null,
        audioStream: null,
        videoStream: null,
        error: null,
        status: 'idle'
      });
    }
  }, [streamState.streamId, streamState.sessionId, streamState.peerConnection, stopAudioTrack]);

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
    // Stop audio track if exists
    stopAudioTrack();
    
    setStreamState({
      isCreating: false,
      isConnected: false,
      isActive: false,
      streamId: null,
      sessionId: null,
      sdpOffer: null,
      iceServers: null,
      peerConnection: null,
      audioStream: null,
      videoStream: null,
      error: null,
      status: 'idle'
    });
  }, [stopAudioTrack]);

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
