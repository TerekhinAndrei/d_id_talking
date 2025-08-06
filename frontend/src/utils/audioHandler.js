export class AudioHandler {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.volume = 1.0;
    this.isMuted = false;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Восстановление контекста если он приостановлен
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('AudioContext инициализирован:', this.audioContext.state);
      return true;
    } catch (error) {
      console.error('Ошибка инициализации AudioContext:', error);
      return false;
    }
  }

  async playAudio(base64Data) {
    try {
      if (!this.audioContext) {
        console.warn('AudioContext не инициализирован');
        return false;
      }

      // Декодирование base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Декодирование аудио
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      
      // Создание источника
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Создание gain node для контроля громкости
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.isMuted ? 0 : this.volume;
      
      // Подключение цепочки
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Воспроизведение
      source.start(0);
      
      return new Promise((resolve) => {
        source.onended = () => {
          console.log('Аудио воспроизведение завершено');
          resolve();
        };
        
        source.onerror = (error) => {
          console.error('Ошибка воспроизведения аудио:', error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Ошибка воспроизведения аудио:', error);
      return false;
    }
  }

  async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    console.log('Начинаем воспроизведение очереди аудио...');
    
    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift();
      const success = await this.playAudio(audioData);
      
      if (!success) {
        console.warn('Пропускаем неудачное аудио');
      }
    }
    
    this.isPlaying = false;
    console.log('Воспроизведение очереди завершено');
  }

  addToQueue(audioData) {
    this.audioQueue.push(audioData);
    console.log(`Добавлено в очередь аудио. Размер очереди: ${this.audioQueue.length}`);
    this.playAudioQueue();
  }

  clearQueue() {
    this.audioQueue = [];
    console.log('Очередь аудио очищена');
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`Громкость установлена: ${this.volume}`);
  }

  mute() {
    this.isMuted = true;
    console.log('Аудио отключено');
  }

  unmute() {
    this.isMuted = false;
    console.log('Аудио включено');
  }

  getQueueLength() {
    return this.audioQueue.length;
  }

  isQueuePlaying() {
    return this.isPlaying;
  }

  // Метод для тестирования аудио
  async testAudio() {
    try {
      // Создаем простой синусоидальный сигнал для тестирования
      const sampleRate = 44100;
      const duration = 1; // 1 секунда
      const frequency = 440; // 440 Hz (нота A)
      
      const audioBuffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
      
      console.log('Тестовый аудио сигнал воспроизведен');
      return true;
    } catch (error) {
      console.error('Ошибка тестирования аудио:', error);
      return false;
    }
  }
}
