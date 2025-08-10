import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useMicrophoneToDidPipeline } from '../hooks/useMicrophoneToDidPipeline';

const DIdStreamingTester = () => {
  const [testState, setTestState] = useState({
    step: 0,
    streamId: null,
    sessionId: null,
    sdpOffer: null,
    iceServers: null,
    peerConnection: null,
    isConnected: false,
    error: null,
    logs: [],
    talkMode: 'text', // 'text' or 'audio'
    audioUrl: 'https://res.cloudinary.com/daeoqig4w/video/upload/v1754770303/1-second-of-silence_l1un5v.mp3'
  });

  // Хук для микрофонного пайплайна в D-ID
  const microphonePipeline = useMicrophoneToDidPipeline({
    onAudioSent: (audioUrl, didResponse) => {
      addLog(`🎤 Аудио отправлено в D-ID: ${audioUrl}`, 'success');
      addLog(`📊 D-ID ответ: ${JSON.stringify(didResponse)}`, 'info');
    }
  });

  const addLog = useCallback((message, type = 'info') => {
    setTestState(prev => ({
      ...prev,
      logs: [...prev.logs, { message, type, timestamp: new Date().toISOString() }]
    }));
  }, []);

  const resetTest = useCallback(() => {
    setTestState({
      step: 0,
      streamId: null,
      sessionId: null,
      sdpOffer: null,
      iceServers: null,
      peerConnection: null,
      isConnected: false,
      error: null,
      logs: [],
      talkMode: 'text',
      audioUrl: 'https://res.cloudinary.com/daeoqig4w/video/upload/v1754770303/1-second-of-silence_l1un5v.mp3'
    });
  }, []);

  // Step 1: Create a new stream
  const createStream = useCallback(async () => {
    try {
      addLog('🚀 Step 1: Creating new stream...', 'info');
      
      const imageUrl = 'https://res.cloudinary.com/daeoqig4w/image/upload/v1754601773/ced034aa-4c77-4d02-a762-fb16bcb25d75.jpg';
      
      // Проверяем, существует ли изображение
      addLog('🔍 Проверяем доступность изображения...', 'info');
      try {
        const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageCheck.ok) {
          addLog(`❌ Изображение не найдено: ${imageUrl}`, 'error');
          addLog('⚠️ Статус: 404 - Resource not found', 'error');
          setTestState(prev => ({ ...prev, error: 'Изображение не найдено. Проверьте URL.' }));
          return;
        }
        addLog('✅ Изображение доступно', 'success');
      } catch (imageError) {
        addLog(`❌ Ошибка проверки изображения: ${imageError.message}`, 'error');
        setTestState(prev => ({ ...prev, error: 'Не удалось проверить изображение.' }));
        return;
      }
      
      const response = await apiService.createDIdStream(imageUrl, 'Test stream from frontend D-ID tester');
      
      if (response.success) {
        addLog('✅ Stream created successfully!', 'success');
        addLog(`📊 Stream ID: ${response.stream_id}`, 'info');
        addLog(`📊 Session ID: ${response.session_id}`, 'info');
        addLog(`📊 Has SDP Offer: ${!!response.sdp_offer}`, 'info');
        addLog(`📊 Has ICE Servers: ${!!response.ice_servers}`, 'info');
        
        setTestState(prev => ({
          ...prev,
          step: 1,
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers,
          error: null
        }));
                   } else {
               let errorMessage = response.error;
               
               // Check for specific backend errors
               if (response.error && response.error.includes('_create_session_if_needed')) {
                 errorMessage = 'Бэкенд не полностью реализован. Некоторые методы D-ID API отсутствуют.';
               } else if (response.error && response.error.includes('Authentication failed')) {
                 errorMessage = 'Ошибка аутентификации D-ID API.';
               } else if (response.error && response.error.includes('SDP exchange failed')) {
                 errorMessage = 'D-ID API отклонил запрос. Проверьте формат данных.';
               }
               
               addLog(`❌ Failed to create stream: ${errorMessage}`, 'error');
               setTestState(prev => ({ ...prev, error: errorMessage }));
             }
    } catch (error) {
      addLog(`❌ Error creating stream: ${error.message}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [addLog]);

  // Step 2: Start the stream (WebRTC setup)
  const startStream = useCallback(async () => {
    try {
      addLog('🔗 Step 2: Starting stream with WebRTC...', 'info');
      
      if (!testState.sdpOffer || !testState.iceServers) {
        addLog('❌ Missing SDP offer or ICE servers', 'error');
        return;
      }

      // Create WebRTC peer connection
      const peerConnection = new RTCPeerConnection({ 
        iceServers: testState.iceServers 
      });

      // Set up event listeners
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          addLog('🧊 ICE candidate generated', 'info');
          // Submit ICE candidate
          submitIceCandidate(event.candidate);
        }
      });

      peerConnection.addEventListener('iceconnectionstatechange', () => {
        addLog(`🔗 ICE connection state: ${peerConnection.iceConnectionState}`, 'info');
        if (peerConnection.iceConnectionState === 'connected') {
          addLog('✅ WebRTC connection established!', 'success');
          setTestState(prev => ({ ...prev, isConnected: true }));
        }
      });

      peerConnection.addEventListener('track', (event) => {
        addLog('🎬 Received video track!', 'success');
        // Handle video stream
        const videoElement = document.getElementById('test-video');
        if (videoElement && event.streams[0]) {
          videoElement.srcObject = event.streams[0];
        }
      });

      // Set remote description (SDP offer)
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: testState.sdpOffer
      });

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      addLog('📝 SDP answer created', 'info');

      // Submit SDP answer
      const sdpResponse = await apiService.startDIdStream(
        testState.streamId,
        testState.sessionId,
        answer.sdp
      );

                   if (sdpResponse.success) {
               addLog('✅ SDP answer submitted successfully!', 'success');
               setTestState(prev => ({
                 ...prev,
                 step: 2,
                 peerConnection,
                 error: null
               }));
             } else {
               let errorMessage = sdpResponse.error;
               
               // Check for specific backend errors
               if (sdpResponse.error && sdpResponse.error.includes('_create_session_if_needed')) {
                 errorMessage = 'Бэкенд не полностью реализован. Метод SDP submission отсутствует.';
               }
               
               addLog(`❌ Failed to submit SDP answer: ${errorMessage}`, 'error');
             }

    } catch (error) {
      addLog(`❌ Error starting stream: ${error.message}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [testState, addLog]);

  // Submit ICE candidate
  const submitIceCandidate = useCallback(async (candidate) => {
    try {
      console.log('🎬 submitIceCandidate called with:', {
        streamId: testState.streamId,
        sessionId: testState.sessionId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
      
      const response = await apiService.submitDIdIceCandidate(
        testState.streamId,
        testState.sessionId,
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
  }, [testState, addLog]);

  // Step 4: Create talk stream
  const createTalk = useCallback(async () => {
    try {
      addLog('🎤 Step 4: Creating talk stream...', 'info');
      
      // Use text script format that works with D-ID API
      const textScript = {
        type: "text",
        input: "Hello! This is a test message from D-ID streaming.",
        provider: {
          type: "microsoft",
          voice_id: "en-US-JennyNeural"
        }
      };

      const response = await apiService.createDIdTalk(
        testState.streamId,
        testState.sessionId,
        textScript
      );

      if (response.success) {
        addLog('✅ Talk stream created successfully!', 'success');
        addLog(`📝 Text: ${textScript.input}`, 'info');
        addLog(`📋 Talk ID: ${response.talk_id || 'N/A'}`, 'info');
        setTestState(prev => ({ ...prev, step: 4, error: null }));
      } else {
        addLog(`❌ Failed to create talk: ${response.error}`, 'error');
        setTestState(prev => ({ ...prev, error: response.error }));
      }
    } catch (error) {
      addLog(`❌ Error creating talk: ${error.message}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [testState, addLog]);

  // Step 4: Create talk stream with audio
  const createTalkAudio = useCallback(async () => {
    try {
      addLog('🎵 Step 4: Creating talk stream with audio...', 'info');
      
      const response = await apiService.createDIdTalkAudio(
        testState.streamId,
        testState.sessionId,
        testState.audioUrl,
        "en-US-JennyNeural"
      );

      if (response.success) {
        addLog('✅ Talk stream with audio created successfully!', 'success');
        addLog(`🎵 Audio URL: ${testState.audioUrl}`, 'info');
        addLog(`📋 Talk ID: ${response.talk_id || 'N/A'}`, 'info');
        setTestState(prev => ({ ...prev, step: 4, error: null }));
      } else {
        addLog(`❌ Failed to create talk with audio: ${response.error}`, 'error');
        setTestState(prev => ({ ...prev, error: response.error }));
      }
    } catch (error) {
      addLog(`❌ Error creating talk with audio: ${error.message}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [testState, addLog]);

  // Step 5: Close stream
  const closeStream = useCallback(async () => {
    try {
      addLog('🔚 Step 5: Closing stream...', 'info');
      
      const response = await apiService.closeDIdStream(
        testState.streamId,
        testState.sessionId
      );

      if (response.success) {
        addLog('✅ Stream closed successfully!', 'success');
        setTestState(prev => ({ ...prev, step: 5, error: null }));
      } else {
        addLog(`❌ Failed to close stream: ${response.error}`, 'error');
      }

      // Close WebRTC connection
      if (testState.peerConnection) {
        testState.peerConnection.close();
        addLog('🔚 WebRTC connection closed', 'info');
      }

    } catch (error) {
      addLog(`❌ Error closing stream: ${error.message}`, 'error');
      setTestState(prev => ({ ...prev, error: error.message }));
    }
  }, [testState, addLog]);

  return (
    <div className="d-id-streaming-tester">
      <h2>🎬 D-ID Streaming Tester</h2>
      
      <div className="test-controls">
        <button 
          onClick={createStream}
          disabled={testState.step > 0}
          className="test-btn"
        >
          Step 1: Create Stream
        </button>
        
        <button 
          onClick={startStream}
          disabled={testState.step < 1 || testState.step > 1}
          className="test-btn"
        >
          Step 2: Start Stream
        </button>
        
        <button 
          onClick={createTalk}
          disabled={testState.step < 2 || !testState.isConnected}
          className="test-btn"
        >
          Step 4: Create Talk (Text)
        </button>
        
        <button 
          onClick={createTalkAudio}
          disabled={testState.step < 2 || !testState.isConnected}
          className="test-btn"
        >
          Step 4: Create Talk (Audio)
        </button>
        
        <button 
          onClick={() => microphonePipeline.startRecording("en-US-JennyNeural", testState.streamId, testState.sessionId)}
          disabled={testState.step < 2 || !testState.isConnected || microphonePipeline.isRecording}
          className="test-btn"
        >
          🎤 Start Microphone Pipeline
        </button>
        
        <button 
          onClick={microphonePipeline.stopRecording}
          disabled={!microphonePipeline.isRecording}
          className="test-btn"
        >
          ⏹️ Stop Microphone Pipeline
        </button>
        
        <button 
          onClick={closeStream}
          disabled={testState.step < 4}
          className="test-btn"
        >
          Step 5: Close Stream
        </button>
        
        <button 
          onClick={resetTest}
          className="test-btn reset"
        >
          Reset Test
        </button>
      </div>

      <div className="test-status">
        <h3>📊 Test Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">Current Step:</span>
            <span className="value">{testState.step}/5</span>
          </div>
          <div className="status-item">
            <span className="label">Stream ID:</span>
            <span className="value">{testState.streamId || 'N/A'}</span>
          </div>
                           <div className="status-item">
                   <span className="label">Session ID:</span>
                   <span className="value">
                     {testState.sessionId ? 
                       testState.sessionId.length > 50 ? 
                         `${testState.sessionId.substring(0, 50)}...` : 
                         testState.sessionId 
                       : 'N/A'
                     }
                   </span>
                 </div>
          <div className="status-item">
            <span className="label">WebRTC Connected:</span>
            <span className="value">{testState.isConnected ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div className="status-item">
            <span className="label">Microphone Pipeline:</span>
            <span className="value">{microphonePipeline.isRecording ? '🎤 Recording' : '⏹️ Stopped'}</span>
          </div>
          <div className="status-item">
            <span className="label">Sent Chunks:</span>
            <span className="value">{microphonePipeline.streamStats.sentChunks}</span>
          </div>
        </div>
      </div>

      <div className="audio-settings">
        <h3>🎵 Audio Settings</h3>
        <div className="audio-input">
          <label htmlFor="audioUrl">Audio URL:</label>
          <input
            type="text"
            id="audioUrl"
            value={testState.audioUrl}
            onChange={(e) => setTestState(prev => ({ ...prev, audioUrl: e.target.value }))}
            placeholder="Enter audio URL"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          <small>Default: 1 second of silence from Cloudinary</small>
        </div>
      </div>

      {testState.error && (
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{testState.error}</p>
        </div>
      )}

      {microphonePipeline.error && (
        <div className="error-message">
          <h3>❌ Microphone Pipeline Error</h3>
          <p>{microphonePipeline.error}</p>
        </div>
      )}

      <div className="video-container">
        <h3>🎬 Video Stream</h3>
        <video 
          id="test-video"
          autoPlay 
          playsInline
          muted
          style={{ width: '100%', maxWidth: '400px', border: '1px solid #ccc' }}
        />
      </div>

      <div className="logs-container">
        <h3>📝 Test Logs</h3>
        <div className="logs">
          {testState.logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default DIdStreamingTester;
