class AudioPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentSample = 0;
    this.currentBuffer = null;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }

    const outputChannel = output[0];
    
    // Если нет аудио для воспроизведения
    if (!this.isPlaying || !this.currentBuffer) {
      // Заполняем выход нулями
      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = 0;
      }
      return true;
    }

    // Воспроизводим текущий буфер
    for (let i = 0; i < outputChannel.length; i++) {
      if (this.currentSample < this.currentBuffer.length) {
        outputChannel[i] = this.currentBuffer[this.currentSample];
        this.currentSample++;
      } else {
        // Буфер закончился, берем следующий
        if (this.audioQueue.length > 0) {
          this.currentBuffer = this.audioQueue.shift();
          this.currentSample = 0;
          outputChannel[i] = this.currentBuffer[0] || 0;
          this.currentSample = 1;
        } else {
          // Очередь пуста, останавливаем воспроизведение
          this.isPlaying = false;
          this.currentBuffer = null;
          outputChannel[i] = 0;
        }
      }
    }

    return true;
  }

  // Обработка сообщений от основного потока
  port.onmessage = (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'play-audio':
        // Декодируем base64 в Float32Array
        const audioData = this.decodeBase64Audio(data);
        this.audioQueue.push(audioData);
        
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.currentBuffer = this.audioQueue.shift();
          this.currentSample = 0;
        }
        break;
        
      case 'stop-playing':
        this.isPlaying = false;
        this.audioQueue = [];
        this.currentBuffer = null;
        this.currentSample = 0;
        break;
    }
  };

  // Декодирование base64 аудио в Float32Array
  decodeBase64Audio(base64Data) {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Простое декодирование (для MP3 нужен более сложный декодер)
      const audioData = new Float32Array(bytes.length / 2);
      for (let i = 0; i < audioData.length; i++) {
        const sample = (bytes[i * 2] | (bytes[i * 2 + 1] << 8)) / 32768.0;
        audioData[i] = Math.max(-1, Math.min(1, sample));
      }
      
      return audioData;
    } catch (error) {
      console.error('Ошибка декодирования аудио:', error);
      return new Float32Array(0);
    }
  }
}

registerProcessor('audio-player-processor', AudioPlayerProcessor);
