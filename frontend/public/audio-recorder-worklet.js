class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.audioBuffer = [];
    this.isSpeaking = false;
    this.speechThreshold = 0.01;
    this.silenceTimeout = 1000; // 1 second
    this.lastSpeechTime = 0;
    this.currentFrame = 0; // Добавляем счетчик кадров
    this.lastHasSpeech = false; // Для отслеживания изменений состояния речи
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Привязываем обработчик сообщений
    this.port.onmessage = this.handleMessage.bind(this);
  }

  // Детекция речи по громкости
  detectSpeech(audioData) {
    const volume = Math.sqrt(
      audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length
    );
    return volume > this.speechThreshold;
  }

  // Обработка аудио данных
  process(inputs) {
    // Проверяем, что запись активна
    if (!this.isRecording) return true;
    
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const inputData = input[0];
    if (!inputData) return true;

    // Увеличиваем счетчик кадров
    this.currentFrame += inputData.length;
    
    // Детекция речи (используем Float32Array напрямую)
    const hasSpeech = this.detectSpeech(inputData);
    
    // Логируем только при изменении состояния речи (не так часто)
    if (hasSpeech !== this.lastHasSpeech) {
      this.lastHasSpeech = hasSpeech;
      this.port.postMessage({
        type: 'debug',
        data: {
          frame: this.currentFrame,
          hasSpeech: hasSpeech,
          bufferSize: this.audioBuffer.length,
          isSpeaking: this.isSpeaking,
          volume: Math.sqrt(inputData.reduce((sum, sample) => sum + sample * sample, 0) / inputData.length),
          event: hasSpeech ? 'speech_started' : 'speech_ended'
        }
      });
    }
    
    if (hasSpeech) {
      // Есть речь - добавляем в буфер (копируем Float32Array)
      this.audioBuffer.push(new Float32Array(inputData));
      this.isSpeaking = true;
      this.lastSpeechTime = this.currentFrame / globalThis.sampleRate;
      
    } else if (this.isSpeaking) {
      // Тишина после речи - добавляем в буфер
      this.audioBuffer.push(new Float32Array(inputData));
      
      // Проверяем, не пора ли отправить фразу
      const currentTime = this.currentFrame / globalThis.sampleRate;
      if (currentTime - this.lastSpeechTime > this.silenceTimeout / 1000) {
        // Объединяем все фрагменты в одну фразу
        const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Float32Array(totalLength);
        
        let offset = 0;
        for (const chunk of this.audioBuffer) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Отправляем фразу
        this.port.postMessage({
          type: 'send_phrase',
          data: Array.from(combinedAudio) // Конвертируем только при отправке
        });
        
        // Очищаем буфер
        this.audioBuffer = [];
        this.isSpeaking = false;
      }
    }

    return true;
  }

  // Обработка сообщений от основного потока
  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'start_recording':
        this.isRecording = true;
        this.audioBuffer = [];
        this.isSpeaking = false;
        this.lastSpeechTime = 0;
        break;
        
      case 'stop_recording':
        this.isRecording = false;
        this.audioBuffer = [];
        this.isSpeaking = false;
        break;
        
      case 'set_speech_threshold':
        this.speechThreshold = data.threshold || 0.01;
        break;
        
      case 'set_silence_timeout':
        this.silenceTimeout = data.timeout || 1000;
        break;
    }
  }
}

// Регистрируем процессор
registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
