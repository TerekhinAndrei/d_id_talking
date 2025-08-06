import axios from 'axios';
import 'webrtc-adapter';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.streamId = null;
        this.sessionId = null;
        this.remoteStream = null;
        this.onTrackCallback = null;
        this.onConnectionStateChange = null;
        this.onIceConnectionStateChange = null;
    }

    // Initialize WebRTC adapter for cross-browser compatibility
    initWebRTCAdapter() {
        if (typeof window !== 'undefined' && window.adapter) {
            // WebRTC adapter is already loaded
            return;
        }
        
        // Load webrtc-adapter if not already loaded
        if (typeof window !== 'undefined' && !window.RTCPeerConnection) {
            console.warn('WebRTC not supported in this browser');
            return false;
        }
        
        return true;
    }

    // Create a new stream session
    async createStream(sourceUrl) {
        try {
            const response = await axios.post(`${API_BASE_URL}/streaming/start`, {
                image_url: sourceUrl
            });
            
            const { stream_id, session_id, sdp_offer, ice_servers } = response.data;
            this.streamId = stream_id;
            this.sessionId = session_id;
            
            return {
                streamId: stream_id,
                sessionId: session_id,
                offer: sdp_offer,
                iceServers: ice_servers
            };
        } catch (error) {
            console.error('Error creating stream:', error);
            throw error;
        }
    }

    // Create and configure RTCPeerConnection
    createPeerConnection(iceServers) {
        if (!this.initWebRTCAdapter()) {
            throw new Error('WebRTC not supported');
        }

        const configuration = {
            iceServers: iceServers || [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Set up event handlers
        this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
        this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange.bind(this);
        this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange.bind(this);
        this.peerConnection.onsignalingstatechange = this.handleSignalingStateChange.bind(this);
        this.peerConnection.ontrack = this.handleTrack.bind(this);

        return this.peerConnection;
    }

    // Handle ICE candidates
    async handleIceCandidate(event) {
        if (event.candidate) {
            try {
                await axios.post(`${API_BASE_URL}/streaming/ice`, {
                    stream_id: this.streamId,
                    session_id: this.sessionId,
                    candidate: event.candidate.candidate,
                    sdp_mid: event.candidate.sdpMid,
                    sdp_m_line_index: event.candidate.sdpMLineIndex
                });
            } catch (error) {
                console.error('Error submitting ICE candidate:', error);
            }
        }
    }

    // Handle ICE connection state changes
    handleIceConnectionStateChange() {
        if (this.onIceConnectionStateChange) {
            this.onIceConnectionStateChange(this.peerConnection.iceConnectionState);
        }
        
        if (this.peerConnection.iceConnectionState === 'failed' || 
            this.peerConnection.iceConnectionState === 'closed') {
            this.cleanup();
        }
    }

    // Handle connection state changes
    handleConnectionStateChange() {
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(this.peerConnection.connectionState);
        }
    }

    // Handle signaling state changes
    handleSignalingStateChange() {
        console.log('Signaling state:', this.peerConnection.signalingState);
    }

    // Handle incoming tracks
    handleTrack(event) {
        this.remoteStream = event.streams[0];
        if (this.onTrackCallback) {
            this.onTrackCallback(this.remoteStream);
        }
    }

    // Start WebRTC connection
    async startConnection(offer, iceServers) {
        try {
            // Set remote description (offer from D-ID)
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
                type: 'offer',
                sdp: offer
            }));

            // Create answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Send answer to D-ID
            await axios.post(`${API_BASE_URL}/streaming/sdp`, {
                stream_id: this.streamId,
                session_id: this.sessionId,
                sdp_answer: answer.sdp
            });

            return answer;
        } catch (error) {
            console.error('Error starting WebRTC connection:', error);
            throw error;
        }
    }

    // Start talk stream with audio
    async startTalkStream(audioUrl) {
        try {
            const response = await axios.post(`${API_BASE_URL}/streaming/audio`, {
                stream_id: this.streamId,
                session_id: this.sessionId,
                audio_url: audioUrl
            });

            return response.data;
        } catch (error) {
            console.error('Error starting talk stream:', error);
            throw error;
        }
    }

    // Delete stream
    async deleteStream() {
        try {
            if (this.streamId) {
                await axios.delete(`${API_BASE_URL}/streaming/${this.streamId}`);
            }
        } catch (error) {
            console.error('Error deleting stream:', error);
        } finally {
            this.cleanup();
        }
    }

    // Get stream status
    async getStreamStatus() {
        try {
            const response = await axios.get(`${API_BASE_URL}/streaming/${this.streamId}/status`);
            return response.data;
        } catch (error) {
            console.error('Error getting stream status:', error);
            throw error;
        }
    }

    // Set callbacks
    setOnTrack(callback) {
        this.onTrackCallback = callback;
    }

    setOnConnectionStateChange(callback) {
        this.onConnectionStateChange = callback;
    }

    setOnIceConnectionStateChange(callback) {
        this.onIceConnectionStateChange = callback;
    }

    // Cleanup resources
    cleanup() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }

        this.streamId = null;
        this.sessionId = null;
    }

    // Get current state
    getState() {
        return {
            streamId: this.streamId,
            sessionId: this.sessionId,
            peerConnection: this.peerConnection,
            remoteStream: this.remoteStream,
            connectionState: this.peerConnection?.connectionState,
            iceConnectionState: this.peerConnection?.iceConnectionState,
            signalingState: this.peerConnection?.signalingState
        };
    }
}

export default WebRTCService; 