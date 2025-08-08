class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.chunkSize = 4096;
    this.buffer = [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || !this.isRecording) {
      return true;
    }

    const inputChannel = input[0];
    
    // Добавляем данные в буфер
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer.push(inputChannel[i]);
    }

    // Отправляем чанк когда буфер заполнен
    if (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.slice(0, this.chunkSize);
      this.buffer = this.buffer.slice(this.chunkSize);
      
      this.port.postMessage({
        type: 'audio-chunk',
        data: chunk
      });
    }

    return true;
  }

  // Обработка сообщений от основного потока
  port.onmessage = (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'start-recording':
        this.isRecording = true;
        this.buffer = [];
        break;
        
      case 'stop-recording':
        this.isRecording = false;
        // Отправляем оставшиеся данные
        if (this.buffer.length > 0) {
          this.port.postMessage({
            type: 'audio-chunk',
            data: this.buffer
          });
        }
        break;
        
      case 'set-chunk-size':
        this.chunkSize = data;
        break;
    }
  };
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
