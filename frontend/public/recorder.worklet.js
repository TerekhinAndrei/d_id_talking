class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.type === 'start-recording') {
        // Логика начала записи, если нужно
      }
    };
  }

  process(inputs) {
    if (inputs[0].length > 0) {
      const input = inputs[0][0];
      // Отправляем сырые данные обратно в основной поток
      this.port.postMessage(input);
    }
    return true;
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
