export class DidWebRtcSession {
  constructor(iceServers, {
    onIceCandidate,
    onIceConnectionStateChange,
    onTrack
  } = {}) {
    this.iceServers = iceServers || [];
    this.onIceCandidate = onIceCandidate;
    this.onIceConnectionStateChange = onIceConnectionStateChange;
    this.onTrack = onTrack;
    this.peerConnection = null;
  }

  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate && this.onIceCandidate) {
        try { this.onIceCandidate(event.candidate); } catch (_) {}
      }
    });

    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      if (this.onIceConnectionStateChange) {
        try { this.onIceConnectionStateChange(this.peerConnection.iceConnectionState); } catch (_) {}
      }
    });

    this.peerConnection.addEventListener('track', (event) => {
      if (this.onTrack) {
        try { this.onTrack(event); } catch (_) {}
      }
    });

    return this.peerConnection;
  }

  addAudioTrackFromStream(stream) {
    if (!this.peerConnection) this.createPeerConnection();
    const [track] = stream.getAudioTracks();
    if (track) this.peerConnection.addTrack(track, stream);
  }

  async setRemoteOffer(sdpOffer) {
    if (!this.peerConnection) this.createPeerConnection();
    await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: sdpOffer });
  }

  async createAnswerAndSetLocal() {
    if (!this.peerConnection) this.createPeerConnection();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  close() {
    try { this.peerConnection?.close(); } catch (_) {}
    this.peerConnection = null;
  }
}


