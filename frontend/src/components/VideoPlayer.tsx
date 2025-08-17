import React from 'react';
import { VideoPlayerProps } from '../types';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  defaultVideoSrc = '/Waiting.mp4',
  streamVideoSrc = null,
  isStreamActive = false,
  className = ''
}) => {
  console.log('🎬 VideoPlayer render - defaultVideoSrc:', defaultVideoSrc);
  
  return (
    <div className={`video-player ${className}`}>
      <div className="video-container">
        {/* Default Video - всегда видимый */}
        <video 
          key={defaultVideoSrc} // Добавляем key для принудительного обновления
          className="video-element video-default"
          autoPlay 
          playsInline
          loop
          muted
          src={defaultVideoSrc}
        />
        
        {/* Stream Video - перекрывает дефолтное при активном стриме */}
        <video 
          key={streamVideoSrc || 'no-stream'} // Добавляем key для принудительного обновления
          className={`video-element video-stream ${isStreamActive ? 'active' : ''}`}
          autoPlay 
          playsInline
          muted
          src={streamVideoSrc || undefined}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
