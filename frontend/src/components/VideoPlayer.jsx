import React, { useRef, useEffect } from 'react';
import './VideoPlayer.css';

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
    // Когда стрим пропадает, srcObject автоматически станет null
  }, [stream]);
  
  // Эффект для управления видимостью
  useEffect(() => {
    const streamVideo = streamVideoRef.current;
    const idleVideo = idleVideoRef.current;
    if (!streamVideo || !idleVideo) return;

    if (isSpeaking) {
      // Аватар говорит - показываем видео стрима
      streamVideo.style.opacity = '1';
      idleVideo.style.opacity = '0';
    } else {
      // Аватар молчит - показываем видео ожидания
      streamVideo.style.opacity = '0';
      idleVideo.style.opacity = '1';
    }
  }, [isSpeaking]);

  return (
    <div className="video-player-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
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
          objectFit: 'cover',
          opacity: 1, // Изначально видимо
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
          objectFit: 'cover',
          opacity: 0, // Изначально скрыто
          transition: 'opacity 0.4s ease-in-out'
        }}
      />
    </div>
  );
};

export default VideoPlayer;
