import React, { useEffect, useRef, useState } from 'react';

const AudioVisualizer = ({ isRecording, audioData, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [visualizerData, setVisualizerData] = useState([]);
  const [error, setError] = useState(null);

  // Инициализация аудио контекста и анализатора
  useEffect(() => {
    if (isRecording && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        setError(null);
      } catch (error) {
        console.error('❌ Ошибка инициализации AudioContext:', error);
        setError('Web Audio API недоступен');
      }
    }

    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.log('⚠️ AudioContext уже закрыт');
        }
        audioContextRef.current = null;
      }
    };
  }, [isRecording]);

  // Анимация визуализации
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isRecording || !analyserRef.current) return;

    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = requestAnimationFrame(draw);
      
      try {
        analyser.getByteFrequencyData(dataArray);
        
        // Очистка canvas
        ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;
          
          // Градиент для баров
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, '#4a9eff');
          gradient.addColorStop(0.5, '#3a7bd5');
          gradient.addColorStop(1, '#28a745');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
      } catch (error) {
        console.error('❌ Ошибка отрисовки визуализации:', error);
        // Останавливаем анимацию при ошибке
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  // Обработка размера canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      try {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = 100;
        }
      } catch (error) {
        console.error('❌ Ошибка изменения размера canvas:', error);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Подключение к микрофону
  useEffect(() => {
    if (!isRecording || !analyserRef.current) return;

    const connectMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        setError(null);
      } catch (error) {
        console.error('❌ Ошибка подключения к микрофону:', error);
        setError('Не удалось получить доступ к микрофону');
      }
    };

    connectMicrophone();
  }, [isRecording]);

  return (
    <div className="audio-visualizer">
      <div className="visualizer-header">
        <h5>🎵 Визуализация аудио потока</h5>
        <div className="visualizer-status">
          {isRecording && <span className="status recording">🔴 Запись</span>}
          {isPlaying && <span className="status playing">🔊 Воспроизведение</span>}
          {!isRecording && !isPlaying && <span className="status idle">⏸️ Ожидание</span>}
        </div>
      </div>
      
      <div className="visualizer-container">
        {error ? (
          <div className="visualizer-error">
            <p>⚠️ {error}</p>
            <p className="error-details">Визуализация недоступна</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="visualizer-canvas"
            style={{
              width: '100%',
              height: '100px',
              borderRadius: '8px',
              border: '1px solid var(--border-secondary)',
              background: 'var(--bg-secondary)'
            }}
          />
        )}
      </div>
      
      <div className="visualizer-info">
        <div className="info-item">
          <span className="info-label">Статус:</span>
          <span className={`info-value ${isRecording ? 'recording' : isPlaying ? 'playing' : 'idle'}`}>
            {isRecording ? 'Запись' : isPlaying ? 'Воспроизведение' : 'Ожидание'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Активность:</span>
          <span className="info-value">
            {error ? 'Недоступна' : visualizerData.length > 0 ? 'Высокая' : 'Низкая'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
