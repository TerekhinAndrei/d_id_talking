import { base64ToUint8, cleanBase64 } from '../../utils/base64';

// Re-encodes arbitrary base64 audio (mp3/wav/ogg) to webm/opus via MediaRecorder
export class AudioReencoder {
  constructor(audioContextFactory = () => new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 })) {
    this.audioContextFactory = audioContextFactory;
    this.ctx = null;
    this.destination = null;
    this.recorder = null;
    this.onChunk = null; // (base64 webm/opus) => void
  }

  ensurePipeline() {
    if (!this.ctx) this.ctx = this.audioContextFactory();
    if (!this.destination) this.destination = this.ctx.createMediaStreamDestination();
    if (!this.recorder) {
      this.recorder = new MediaRecorder(this.destination.stream, { mimeType: 'audio/webm;codecs=opus' });
      this.recorder.ondataavailable = async (e) => {
        if (!e.data || e.data.size === 0 || !this.onChunk) return;
        const buffer = await e.data.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        this.onChunk(btoa(binary));
      };
    }
  }

  start(onChunk) {
    this.onChunk = onChunk;
    this.ensurePipeline();
    if (this.recorder.state !== 'recording') this.recorder.start(50);
  }

  async ingestBase64(base64Audio) {
    this.ensurePipeline();
    const bytes = base64ToUint8(cleanBase64(base64Audio));
    const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer);
    const src = this.ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.destination);
    src.start();
  }

  stop() {
    try { if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop(); } catch (_) {}
  }

  async dispose() {
    this.stop();
    try { await this.ctx?.close?.(); } catch (_) {}
    this.recorder = null;
    this.destination = null;
    this.ctx = null;
    this.onChunk = null;
  }
}


