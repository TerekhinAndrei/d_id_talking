import { uint8ToBase64 } from '../../utils/base64';

export class DIdAudioClient {
  constructor(webSocketFactory) {
    this.webSocketFactory = webSocketFactory;
    this.socket = null;
    this.isConnected = false;
    this.isStreaming = false;
    this.streamId = null;
    this.sessionId = null;
    this.index = 0;
  }

  async connect(url) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    this.socket = this.webSocketFactory(url);
    await new Promise((resolve, reject) => {
      this.socket.onopen = () => { this.isConnected = true; resolve(); };
      this.socket.onerror = () => reject(new Error('WebSocket error'));
      this.socket.onclose = () => { this.isConnected = false; this.isStreaming = false; };
    });
  }

  begin(streamId, sessionId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('WS not connected');
    this.streamId = streamId;
    this.sessionId = sessionId;
    this.index = 0;
    this.socket.send(JSON.stringify({ type: 'context', stream_id: streamId, session_id: sessionId }));
    this.isStreaming = true;
  }

  sendBase64Chunk(base64) {
    if (!this.isStreaming) return;
    this.socket.send(JSON.stringify({
      type: 'stream_audio',
      stream_id: this.streamId,
      session_id: this.sessionId,
      audio: base64,
      index: this.index++
    }));
  }

  async sendBlob(blob) {
    const buffer = await blob.arrayBuffer();
    const b64 = uint8ToBase64(new Uint8Array(buffer));
    this.sendBase64Chunk(b64);
  }

  end() {
    this.isStreaming = false;
  }

  disconnect() {
    try { this.socket?.close(); } catch (_) {}
    this.isConnected = false;
    this.isStreaming = false;
  }
}


