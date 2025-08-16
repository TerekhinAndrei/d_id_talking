import { Logger } from '../../utils/Logger.js';

/**
 * Базовый класс для обработки аудио
 * Устраняет дубликаты логики обработки аудио в различных хуках
 */
export class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isInitialized = false;
    this.isRecording = false;
  }

  /**
   * Инициализация аудио контекста
   */
  async initializeAudioContext() {
    try {
      Logger.audioOperation('initializeAudioContext', 'Starting');
      
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      Logger.audioOperation('initializeAudioContext', 'Completed');
    } catch (error) {
      Logger.audioOperation('initializeAudioContext', 'Failed', error);
      throw new Error(`Failed to initialize audio context: ${error.message}`);
    }
  }

  /**
   * Получение доступа к микрофону
   */
  async getMicrophoneAccess() {
    try {
      Logger.audioOperation('getMicrophoneAccess', 'Starting');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.stream = stream;
      Logger.audioOperation('getMicrophoneAccess', 'Completed');
      return stream;
    } catch (error) {
      Logger.audioOperation('getMicrophoneAccess', 'Failed', error);
      throw new Error(`Failed to get microphone access: ${error.message}`);
    }
  }

  /**
   * Создание MediaRecorder
   */
  createMediaRecorder(stream, options = {}) {
    try {
      Logger.audioOperation('createMediaRecorder', 'Starting');
      
      const defaultOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      const recorderOptions = { ...defaultOptions, ...options };
      
      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
      this.setupMediaRecorderEvents();
      
      Logger.audioOperation('createMediaRecorder', 'Completed');
      return this.mediaRecorder;
    } catch (error) {
      Logger.audioOperation('createMediaRecorder', 'Failed', error);
      throw new Error(`Failed to create MediaRecorder: ${error.message}`);
    }
  }

  /**
   * Настройка событий MediaRecorder
   */
  setupMediaRecorderEvents() {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        Logger.audioOperation('dataAvailable', `Chunk size: ${event.data.size}`);
      }
    };

    this.mediaRecorder.onstart = () => {
      this.isRecording = true;
      Logger.audioOperation('recordingStarted');
    };

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      Logger.audioOperation('recordingStopped');
    };

    this.mediaRecorder.onerror = (event) => {
      Logger.audioOperation('recordingError', event.error);
      this.isRecording = false;
    };
  }

  /**
   * Начало записи
   */
  async startRecording(stream = null, options = {}) {
    try {
      Logger.audioOperation('startRecording', 'Starting');
      
      if (!this.isInitialized) {
        await this.initializeAudioContext();
      }

      if (!stream && !this.stream) {
        stream = await this.getMicrophoneAccess();
      }

      if (!this.mediaRecorder) {
        this.createMediaRecorder(stream || this.stream, options);
      }

      this.audioChunks = [];
      this.mediaRecorder.start(1000); // Записываем чанки каждую секунду
      
      Logger.audioOperation('startRecording', 'Completed');
    } catch (error) {
      Logger.audioOperation('startRecording', 'Failed', error);
      throw error;
    }
  }

  /**
   * Остановка записи
   */
  async stopRecording() {
    try {
      Logger.audioOperation('stopRecording', 'Starting');
      
      if (!this.mediaRecorder || !this.isRecording) {
        throw new Error('No active recording to stop');
      }

      return new Promise((resolve, reject) => {
        this.mediaRecorder.onstop = () => {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            Logger.audioOperation('stopRecording', 'Completed', { size: audioBlob.size });
            resolve(audioBlob);
          } catch (error) {
            Logger.audioOperation('stopRecording', 'Failed', error);
            reject(error);
          }
        };

        this.mediaRecorder.stop();
      });
    } catch (error) {
      Logger.audioOperation('stopRecording', 'Failed', error);
      throw error;
    }
  }

  /**
   * Обработка аудио чанка
   */
  async processAudioChunk(chunk, options = {}) {
    try {
      Logger.audioOperation('processAudioChunk', 'Starting', { size: chunk.size });
      
      const {
        convertToWav = false,
        sampleRate = 48000,
        channels = 1
      } = options;

      if (convertToWav) {
        const wavBlob = await this.convertToWav(chunk, sampleRate, channels);
        Logger.audioOperation('processAudioChunk', 'Converted to WAV', { size: wavBlob.size });
        return wavBlob;
      }

      Logger.audioOperation('processAudioChunk', 'Completed');
      return chunk;
    } catch (error) {
      Logger.audioOperation('processAudioChunk', 'Failed', error);
      throw error;
    }
  }

  /**
   * Конвертация в WAV формат
   */
  async convertToWav(audioBlob, sampleRate = 48000, channels = 1) {
    try {
      Logger.audioOperation('convertToWav', 'Starting');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const wavBuffer = this.audioBufferToWav(audioBuffer, sampleRate, channels);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      Logger.audioOperation('convertToWav', 'Completed', { size: wavBlob.size });
      return wavBlob;
    } catch (error) {
      Logger.audioOperation('convertToWav', 'Failed', error);
      throw error;
    }
  }

  /**
   * Конвертация AudioBuffer в WAV
   */
  audioBufferToWav(buffer, sampleRate, channels) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * 2, true);

    // Audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    try {
      Logger.audioOperation('cleanup', 'Starting');
      
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.audioChunks = [];
      this.isInitialized = false;
      this.isRecording = false;
      
      Logger.audioOperation('cleanup', 'Completed');
    } catch (error) {
      Logger.audioOperation('cleanup', 'Failed', error);
    }
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      isRecording: this.isRecording,
      audioChunksCount: this.audioChunks.length,
      hasStream: !!this.stream,
      hasMediaRecorder: !!this.mediaRecorder,
      audioContextState: this.audioContext?.state
    };
  }
}
