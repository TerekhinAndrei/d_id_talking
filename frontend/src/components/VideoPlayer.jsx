import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ stream, isSpeaking, idleVideoUrl = '/Waiting.mp4' }) => {
  const streamVideoRef = useRef(null);
  const idleVideoRef = useRef(null);

  // Эффект для управления MediaStream
  useEffect(() => {
    const videoElement = streamVideoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(e => console.error('Ошибка воспроизведения стрима:', e));
    }
  }, [stream]);

  return (
    // Этот контейнер теперь гарантированно будет отображаться внутри квадратного родителя
    <div className="video-player-container" style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      backgroundColor: '#000'
    }}>
      {/* Видео для состояния ожидания (idle) */}
      <video
        ref={idleVideoRef}
        src={idleVideoUrl}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          // Теперь, когда и видео (1:1), и контейнер (1:1) квадратные,
          // 'cover' сработает идеально и без искажений.
          objectFit: 'cover', 
          opacity: isSpeaking ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out'
        }}
      />
      {/* Видео для стрима от D-ID */}
      <video
        ref={streamVideoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          // То же самое справедливо и для видеопотока.
          objectFit: 'cover',
          opacity: isSpeaking ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out'
        }}
      />
    </div>
  );
};

export default VideoPlayer;