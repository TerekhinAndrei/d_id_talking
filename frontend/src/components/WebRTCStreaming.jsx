import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const WebRTCStreaming = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sdpOffer, setSdpOffer] = useState(null);
  const [iceServers, setIceServers] = useState([]);
  
  const peerConnectionRef = useRef(null);
  const videoRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000/api/v1';

  // Initialize WebRTC
  const initializeWebRTC = () => {
    const configuration = {
      iceServers: iceServers.length > 0 ? iceServers : [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Handle incoming tracks
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track:', event);
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        // Send ICE candidate to server
        sendIceCandidate(event.candidate);
      }
    };
    
    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      if (peerConnectionRef.current.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      }
    };
  };

  // Create WebRTC session
  const createSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('Creating WebRTC session...');
      
      const response = await axios.post(`${API_BASE_URL}/streaming/start`, {
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
      });
      
      if (response.data.success) {
        const { stream_id, session_id, sdp_offer, ice_servers } = response.data;
        
        setStreamId(stream_id);
        setSessionId(session_id);
        setSdpOffer(sdp_offer);
        setIceServers(ice_servers);
        
        console.log('Session created:', { stream_id, session_id });
        console.log('SDP Offer:', sdp_offer);
        console.log('ICE Servers:', ice_servers);
        
        // Initialize WebRTC with ICE servers
        initializeWebRTC();
        
        // Process SDP offer
        await processSdpOffer(sdp_offer);
        
      } else {
        throw new Error(response.data.error || 'Failed to create session');
      }
      
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  };

  // Process SDP offer and create answer
  const processSdpOffer = async (offerSdp) => {
    try {
      console.log('Processing SDP offer...');
      
      // Set remote description (offer)
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: offerSdp
      });
      
      await peerConnectionRef.current.setRemoteDescription(offer);
      console.log('Remote description set');
      
      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      console.log('Answer created:', answer);
      
      // Set local description (answer)
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Local description set');
      
      // Send answer to server
      await sendSdpAnswer(answer);
      
    } catch (err) {
      console.error('Error processing SDP offer:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  };

  // Send SDP answer to server
  const sendSdpAnswer = async (answer) => {
    try {
      console.log('Sending SDP answer...');
      
      const response = await axios.post(`${API_BASE_URL}/streaming/${streamId}/sdp`, {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        },
        session_id: sessionId
      });
      
      if (response.data.success) {
        console.log('SDP answer sent successfully');
      } else {
        throw new Error(response.data.error || 'Failed to send SDP answer');
      }
      
    } catch (err) {
      console.error('Error sending SDP answer:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  };

  // Send ICE candidate to server
  const sendIceCandidate = async (candidate) => {
    try {
      console.log('Sending ICE candidate:', candidate);
      
      const response = await axios.post(`${API_BASE_URL}/streaming/${streamId}/ice`, {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        session_id: sessionId
      });
      
      if (response.data.success) {
        console.log('ICE candidate sent successfully');
      } else {
        console.warn('ICE candidate submission failed:', response.data.error);
      }
      
    } catch (err) {
      console.error('Error sending ICE candidate:', err);
      // Don't set error for ICE candidates as they're not critical
    }
  };

  // Disconnect
  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setStreamId(null);
    setSessionId(null);
    setSdpOffer(null);
    setIceServers([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="webrtc-streaming">
      <h2>WebRTC Streaming with D-ID</h2>
      
      <div className="controls">
        {!isConnected && !isConnecting && (
          <button 
            onClick={createSession}
            className="connect-btn"
          >
            Start WebRTC Session
          </button>
        )}
        
        {isConnecting && (
          <div className="connecting">
            <p>Connecting to D-ID...</p>
            <div className="spinner"></div>
          </div>
        )}
        
        {isConnected && (
          <button 
            onClick={disconnect}
            className="disconnect-btn"
          >
            Disconnect
          </button>
        )}
      </div>
      
      {error && (
        <div className="error">
          <p>Error: {error}</p>
        </div>
      )}
      
      {isConnected && (
        <div className="status">
          <p>✅ Connected to D-ID WebRTC Stream</p>
          <p>Stream ID: {streamId}</p>
          <p>Session ID: {sessionId}</p>
        </div>
      )}
      
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-stream"
        />
      </div>
      
      <div className="info">
        <h3>WebRTC Connection Info:</h3>
        <ul>
          <li>Status: {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected'}</li>
          <li>Stream ID: {streamId || 'None'}</li>
          <li>ICE Servers: {iceServers.length}</li>
        </ul>
      </div>
      
      <style jsx>{`
        .webrtc-streaming {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .controls {
          margin: 20px 0;
          text-align: center;
        }
        
        .connect-btn, .disconnect-btn {
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .connect-btn {
          background-color: #4CAF50;
          color: white;
        }
        
        .connect-btn:hover {
          background-color: #45a049;
        }
        
        .disconnect-btn {
          background-color: #f44336;
          color: white;
        }
        
        .disconnect-btn:hover {
          background-color: #da190b;
        }
        
        .connecting {
          text-align: center;
          padding: 20px;
        }
        
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 10px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        
        .status {
          background-color: #e8f5e8;
          color: #2e7d32;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        
        .video-container {
          margin: 20px 0;
          text-align: center;
        }
        
        .video-stream {
          max-width: 100%;
          max-height: 400px;
          border: 2px solid #ddd;
          border-radius: 8px;
        }
        
        .info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        
        .info ul {
          list-style: none;
          padding: 0;
        }
        
        .info li {
          margin: 5px 0;
          padding: 5px 0;
          border-bottom: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
};

export default WebRTCStreaming; 