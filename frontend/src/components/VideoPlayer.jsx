import React from 'react'

const VideoPlayer = ({ 
  defaultVideoSrc = '/Waiting.mp4',
  streamVideoSrc = null,
  isStreamActive = false,
  className = ''
}) => {
  return (
    <div className={`video-player ${className}`}>
      <div className="video-container">
        {/* Default Video - всегда видимый */}
        <video 
          className="video-element video-default"
          autoPlay 
          playsInline
          loop
          muted
          src={defaultVideoSrc}
        />
        
        {/* Stream Video - перекрывает дефолтное при активном стриме */}
        <video 
          className={`video-element video-stream ${isStreamActive ? 'active' : ''}`}
          autoPlay 
          playsInline
          muted
          src={streamVideoSrc}
        />
      </div>
    </div>
  )
}

export default VideoPlayer
