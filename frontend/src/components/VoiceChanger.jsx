import React, { useState, useEffect, useRef } from 'react';
import './VoiceChanger.css';

const VoiceChanger = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Готов к записи');
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const scriptProcessorNodeRef = useRef(null);
  const websocketRef = useRef(null);
  const dIdPeerConnectionRef = useRef(null);
  const videoRef = useRef(null);
  const playbackAudioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Fetch available voices on component mount
  useEffect(() => {
    fetchVoices();
    return () => {
      // Clean up on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (playbackAudioContextRef.current) {
        playbackAudioContextRef.current.close();
      }
      if (dIdPeerConnectionRef.current) {
        dIdPeerConnectionRef.current.close();
      }
    };
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/streaming/elevenlabs-voices');
      const data = await response.json();
      
      if (data.success && data.voices) {
        setVoices(data.voices);
        // Установите голос по умолчанию, если список не пуст
        if (data.voices.length > 0 && !data.voices.some(v => v.voice_id === selectedVoice)) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      } else {
        console.error('Failed to load voices:', data.error);
        // Fallback to a default voice if loading fails
        setVoices([{ voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (fallback)' }]);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setVoices([{ voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (fallback)' }]);
    }
  };

  const startRecording = async () => {
    try {
      setStatus('🎤 Запрашиваю доступ к микрофону...');
      
      // 1. Получаем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000  // ElevenLabs ожидает 16kHz
        } 
      });
      microphoneStreamRef.current = stream;

      // 2. Создаем AudioContext с правильной частотой
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000  // Устанавливаем 16kHz для ElevenLabs
      });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // 3. Создаем ScriptProcessorNode для обработки аудио
      // Buffer size: 4096, 1 input channel, 1 output channel
      scriptProcessorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      scriptProcessorNodeRef.current.onaudioprocess = (event) => {
        if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        // Получаем сырые аудиоданные (Float32Array)
        const inputBuffer = event.inputBuffer.getChannelData(0);

        // Проверяем уровень аудио
        let audioLevel = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          audioLevel += Math.abs(inputBuffer[i]);
        }
        audioLevel = audioLevel / inputBuffer.length;
        console.log('🎤 Audio level:', audioLevel.toFixed(4));

        // Преобразуем Float32Array в Int16Array для отправки
        // ElevenLabs ожидает 16-битные PCM данные с частотой 16kHz
        const pcm16 = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 0x7FFF; // Масштабируем до 16-бит
        }

        // Отправляем бинарные данные через WebSocket
        websocketRef.current.send(pcm16.buffer);
        console.log('📤 Sending audio chunk:', pcm16.buffer.byteLength, 'bytes');
      };

      // Подключаем узлы
      source.connect(scriptProcessorNodeRef.current);
      scriptProcessorNodeRef.current.connect(audioContextRef.current.destination);

      // 4. Инициализируем WebSocket-соединение с бэкендом
      const wsUrl = `ws://localhost:8000/api/v1/streaming/ws/stream-audio/${selectedVoice}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('✅ WebSocket connected to backend');
        setStatus('🎤 Запись началась... Говорите!');
        setIsRecording(true);
        setIsProcessing(true);
        
        // Очищаем очередь при старте
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        
        // Отправляем начальное сообщение с конфигурацией
        const configMessage = {
          type: 'config',
          sample_rate: audioContextRef.current.sampleRate,
          voice_id: selectedVoice,
          model_id: 'eleven_multilingual_sts_v2'
        };
        websocketRef.current.send(JSON.stringify(configMessage));
        console.log('📤 Sending config:', configMessage);
      };
      
      websocketRef.current.onmessage = (event) => {
        console.log('📥 WebSocket message received:', event.data);
        console.log('📥 Message type:', typeof event.data);
        console.log('📥 Message size:', event.data instanceof Blob ? event.data.size : 'N/A');

        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            console.log('📥 Received message:', data);
            
            if (data.type === 'error') {
              console.error('❌ WebSocket error from backend:', data.message);
              setStatus('❌ Ошибка streaming: ' + data.message);
            } else if (data.type === 'status') {
              console.log('✅ Status from backend:', data.message);
              setStatus(data.message);
            }
          } catch {
            console.warn('📥 Received non-JSON string message:', event.data);
          }
        } else if (event.data instanceof Blob) {
          console.log('🎵 Received audio chunk (Blob):', event.data.size, 'bytes');

          // Добавляем Blob в очередь для воспроизведения
          audioQueueRef.current.push(event.data);
          console.log('📦 Audio chunks in queue:', audioQueueRef.current.length);

          // Если это первый чанк, начинаем воспроизведение
          if (!isPlayingRef.current) {
            playNextAudioChunk();
          }
        }
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setStatus('❌ Ошибка WebSocket соединения');
        setIsRecording(false);
        setIsProcessing(false);
      };
      
      websocketRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsRecording(false);
        setIsProcessing(false);
        setStatus('Готов к записи');
      };
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setStatus('❌ Ошибка доступа к микрофону');
    }
  };

  const stopRecording = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorNodeRef.current) {
      scriptProcessorNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.send(JSON.stringify({ type: 'end' }));
      websocketRef.current.close();
    }
    
    // Очищаем аудио очередь
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    // Закрываем AudioContext для воспроизведения
    if (playbackAudioContextRef.current) {
      playbackAudioContextRef.current.close();
      playbackAudioContextRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(false);
    setIsPlaying(false);
    setStatus('✅ Запись остановлена');
  };

  const _PROCESS_AUDIO_FOR_DID = (audioBuffer) => {
    // Здесь будет логика для передачи audioBuffer в WebRTC-соединение с D-ID
    console.log('Received audio for D-ID:', audioBuffer.byteLength, 'bytes');
    
    // TODO: Интеграция с D-ID WebRTC
    // 1. Создать RTCPeerConnection с D-ID
    // 2. Добавить аудио дорожку
    // 3. Отправить аудио данные в D-ID
    
    // Временное локальное воспроизведение для тестирования
    console.log('🎵 Starting local audio playback...');
    playLocalAudioChunk(audioBuffer);
  };

  const playLocalAudioChunk = (audioBuffer) => {
    console.log('🔊 Attempting to play audio chunk...');
    
    if (!audioContextRef.current) {
      console.log('🎵 Creating new AudioContext...');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    console.log('🎵 Decoding audio data...');
    
    // Convert ArrayBuffer to Blob for MP3 playback
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element for MP3 playback
    const audio = new Audio(audioUrl);
    audio.volume = volume;
    
    audio.oncanplaythrough = () => {
      console.log('✅ Audio ready to play');
      audio.play().then(() => {
        console.log('🎵 Audio playback started successfully!');
      }).catch(error => {
        console.error('❌ Error playing audio:', error);
      });
    };
    
    audio.onerror = (error) => {
      console.error('❌ Audio error:', error);
    };
    
    // Clean up URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    // Fallback: try decodeAudioData for other formats
    audioContextRef.current.decodeAudioData(audioBuffer).then(decodedBuffer => {
      console.log('✅ Audio decoded successfully, creating source...');
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decodedBuffer;
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      console.log('🎵 Starting audio playback...');
      source.start(0);
      
      console.log('✅ Audio playback started successfully!');
    }).catch(e => {
      console.error('❌ Error decoding audio for local playback:', e);
      console.error('Audio buffer size:', audioBuffer.byteLength);
      console.error('Audio buffer type:', audioBuffer.constructor.name);
    });
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const playNextAudioChunk = () => {
    // Проверяем, есть ли аудио в очереди
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setStatus('Готов к записи');
      return;
    }

    // Берем первый аудио-кусок из очереди
    const audioBlob = audioQueueRef.current.shift();
    console.log('📦 Dequeued audio chunk. Queue size:', audioQueueRef.current.length);

    // Создаем AudioContext для воспроизведения, если его еще нет
    if (!playbackAudioContextRef.current) {
      playbackAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Преобразуем Blob в ArrayBuffer, который может декодировать AudioContext
    audioBlob.arrayBuffer().then(arrayBuffer => {
      // Декодируем аудио данные
      playbackAudioContextRef.current.decodeAudioData(arrayBuffer).then(decodedBuffer => {
        // Создаем источник звука
        const source = playbackAudioContextRef.current.createBufferSource();
        source.buffer = decodedBuffer;

        // Создаем узел громкости и подключаем
        const gainNode = playbackAudioContextRef.current.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(playbackAudioContextRef.current.destination);

        // Начинаем воспроизведение
        source.start(0);
        isPlayingRef.current = true;
        setIsPlaying(true);
        setStatus('🔊 Воспроизвожу...');

        console.log('🎵 Audio chunk playback started');

        // Когда воспроизведение этого куска закончится, проигрываем следующий
        source.onended = () => {
          console.log('✅ Audio chunk playback ended. Playing next chunk...');
          playNextAudioChunk();
        };
      }).catch(error => {
        console.error('❌ Ошибка декодирования аудио:', error);
        // Если ошибка, пробуем следующий чанк
        playNextAudioChunk();
      });
    }).catch(error => {
      console.error('❌ Ошибка чтения Blob:', error);
      // Если ошибка, пробуем следующий чанк
      playNextAudioChunk();
    });
  };

  return (
    <div className="voice-changer">
      <h2>🎤 Voice Changer - Real-time WebSocket Streaming</h2>
      <p className="description">
        Говорите в микрофон и слушайте свой голос, измененный через ElevenLabs WebSocket Streaming API в реальном времени.
        Аудио будет передаваться для анимации аватара D-ID.
      </p>

      {/* Voice Selection */}
      <div className="voice-selection">
        <label htmlFor="voice-select">Выберите голос:</label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          disabled={isRecording}
        >
          {voices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      {/* Recording Controls */}
      <div className="recording-controls">
        {!isRecording ? (
          <button
            className="record-button"
            onClick={startRecording}
            disabled={isProcessing}
          >
            🎤 Начать запись
          </button>
        ) : (
          <button
            className="stop-button"
            onClick={stopRecording}
          >
            ⏹️ Остановить запись
          </button>
        )}
      </div>

      {/* Status */}
      <div className="status">
        <p>{status}</p>
        {isRecording && (
          <div className="recording-indicator">
            <span className="pulse"></span>
            Запись...
          </div>
        )}
        {isPlaying && (
          <div className="playing-indicator">
            <span className="pulse"></span>
            Воспроизведение...
          </div>
        )}
      </div>

      {/* Volume Control */}
      <div className="volume-control">
        <label htmlFor="volume-slider">Громкость:</label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>

      {/* D-ID Avatar Video */}
      <div className="d-id-avatar-container">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className="d-id-video"
        />
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h4>Как использовать Real-time WebSocket Voice Changer:</h4>
        <ol>
          <li>Выберите голос из списка</li>
          <li>Нажмите "Начать запись"</li>
          <li>Говорите в микрофон</li>
          <li>Ваш голос будет отправлен на бэкенд, затем в ElevenLabs, обработан, возвращен и использован для анимации аватара D-ID</li>
          <li>Используйте ползунок громкости для настройки</li>
        </ol>
        <div className="streaming-info">
          <strong>🔄 WebSocket Streaming:</strong> Аудио обрабатывается через ElevenLabs WebSocket API для минимальной задержки и real-time воспроизведения.
        </div>
      </div>
    </div>
  );
};

export default VoiceChanger;
