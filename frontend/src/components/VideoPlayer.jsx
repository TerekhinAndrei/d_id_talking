import React, { useRef, useEffect } from 'react';

// CSS файл можно оставить, он не мешает
import './VideoPlayer.css';

const VideoPlayer = ({ stream, isSpeaking, idleVideoUrl = '/Waiting.mp4' }) => {
  const streamVideoRef = useRef(null);
  const idleVideoRef = useRef(null);

  // Эффект для управления MediaStream остается без изменений.
  useEffect(() => {
    const videoElement = streamVideoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(e => console.error('Ошибка воспроизведения стрима:', e));
    }
  }, [stream]);

  return (
    // 1. ВНЕШНИЙ КОНТЕЙНЕР (ВАШ КВАДРАТНЫЙ VIEWPORT)
    // Его задача - быть "окном", через которое мы смотрим, и обрезать все лишнее.
    <div className="video-viewport" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden', // Обрезаем все, что выходит за пределы квадрата
      backgroundColor: '#000' // Черный фон на случай, если что-то пойдет не так
    }}>
      {/* 2. ВЛОЖЕННЫЙ КОНТЕЙНЕР ДЛЯ ЗАДАНИЯ ПРАВИЛЬНЫХ ПРОПОРЦИЙ (8:9) */}
      {/* Этот div - наш "холст". Мы задаем ему пропорции 8:9 с помощью 
        трюка с padding-top. Расчет: (высота / ширина) * 100% = (9 / 8) * 100% = 112.5%.
      */}
      <div className="video-aspect-ratio-wrapper" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', // Заполняем по ширине
        // height: 0 и padding-top - это стандартный способ задать пропорции
        height: 0,
        paddingTop: '112.5%', 
      }}>
        {/* 3. ОБА ВИДЕО ТЕПЕРЬ НАХОДЯТСЯ ВНУТРИ КОНТЕЙНЕРА 8:9 */}
        {/* Это гарантирует, что `object-fit: cover` будет работать для них одинаково. */}
        
        <video
          ref={idleVideoRef}
          src={idleVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isSpeaking ? 0 : 1, // Управляем видимостью здесь
            transition: 'opacity 0.4s ease-in-out'
          }}
        />
        
        <video
          ref={streamVideoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isSpeaking ? 1 : 0, // Управляем видимостью здесь
            transition: 'opacity 0.4s ease-in-out'
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
