import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ stream, isSpeaking, idleVideoUrl = '/Waiting.mp4' }) => {
  const streamVideoRef = useRef(null);
  const idleVideoRef = useRef(null);

  // Эффект для управления MediaStream (без изменений)
  useEffect(() => {
    const videoElement = streamVideoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(e => console.error('Ошибка воспроизведения стрима:', e));
    }
  }, [stream]);

  // ====================================================================
  // НОВЫЙ useEffect для логирования параметров ВИДЕО-ЗАГЛУШКИ
  // ====================================================================
  useEffect(() => {
    const video = idleVideoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      console.log('✅ METADATA LOADED: Idle Video (Заглушка)', {
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight
      });
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [idleVideoUrl]); // Запускаем при смене URL заглушки

  // ====================================================================
  // НОВЫЙ useEffect для логирования параметров ВИДЕОПОТОКА от D-ID
  // ====================================================================
  useEffect(() => {
    const video = streamVideoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      console.log('✅ METADATA LOADED: Stream Video (D-ID)', {
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight
      });
    };
    
    // Мы не можем просто слушать событие, так как стрим может прийти позже.
    // Вместо этого, мы проверяем, есть ли уже размеры.
    if (video.videoWidth > 0) {
      handleMetadata();
    } else {
      // Если размеров еще нет, подписываемся на событие
      video.addEventListener('loadedmetadata', handleMetadata);
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [stream]); // Запускаем каждый раз, когда приходит новый стрим

  // JSX остается тот, который я предложил в прошлый раз (с wrapper)
  return (
    <div className="video-viewport" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <div className="video-aspect-ratio-wrapper" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: 0,
        paddingTop: '112.5%', // Пропорции 8:9
      }}>
        <video
          ref={idleVideoRef}
          src={idleVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: isSpeaking ? 0 : 1, transition: 'opacity 0.4s ease-in-out'
          }}
        />
        <video
          ref={streamVideoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: isSpeaking ? 1 : 0, transition: 'opacity 0.4s ease-in-out'
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;