import { API_CONFIG } from '../api.js';

/**
 * D-ID WebRTC Session Manager
 * Handles WebRTC connections for D-ID streaming
 */
class DidWebRtcSession {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.iceServers = [
      { urls: 'stun:stun.cloudflare.com:3478' }
    ];
    this.isConnected = false;
    this.listeners = new Map();
  }

  async initialize() {
    try {
      console.log('🔧 Initializing WebRTC session');
      
      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // Set up event handlers
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', event.candidate);
          this._notifyListeners('icecandidate', event.candidate);
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('🔗 ICE connection state:', this.peerConnection.iceConnectionState);
        this._notifyListeners('iceconnectionstatechange', this.peerConnection.iceConnectionState);
        
        if (this.peerConnection.iceConnectionState === 'connected') {
          this.isConnected = true;
        } else if (this.peerConnection.iceConnectionState === 'disconnected') {
          this.isConnected = false;
        }
      };

      this.peerConnection.ontrack = (event) => {
        console.log('📹 Remote track received:', event.track);
        this.remoteStream = event.streams[0];
        this._notifyListeners('track', event);
      };

      console.log('✅ WebRTC session initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing WebRTC session:', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('WebRTC session not initialized');
    }

    try {
      console.log('📤 Creating SDP offer');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      console.log('✅ SDP offer created:', offer);
      return offer;
    } catch (error) {
      console.error('❌ Error creating SDP offer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('WebRTC session not initialized');
    }

    try {
      console.log('📥 Setting remote description:', description);
      await this.peerConnection.setRemoteDescription(description);
      console.log('✅ Remote description set');
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('WebRTC session not initialized');
    }

    try {
      console.log('🧊 Adding ICE candidate:', candidate);
      await this.peerConnection.addIceCandidate(candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
      throw error;
    }
  }

  async addLocalStream(stream) {
    if (!this.peerConnection) {
      throw new Error('WebRTC session not initialized');
    }

    try {
      console.log('🎤 Adding local stream:', stream);
      this.localStream = stream;
      
      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });
      
      console.log('✅ Local stream added');
    } catch (error) {
      console.error('❌ Error adding local stream:', error);
      throw error;
    }
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  getConnectionState() {
    if (!this.peerConnection) {
      return 'not-initialized';
    }
    return this.peerConnection.iceConnectionState;
  }

  isConnected() {
    return this.isConnected;
  }

  close() {
    if (this.peerConnection) {
      console.log('🔌 Closing WebRTC connection');
      this.peerConnection.close();
      this.peerConnection = null;
      this.isConnected = false;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.remoteStream = null;
    console.log('✅ WebRTC connection closed');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

export default DidWebRtcSession;


