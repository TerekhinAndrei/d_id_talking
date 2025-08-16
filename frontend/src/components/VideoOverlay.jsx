import React from 'react';

const VideoOverlay = ({ stream, isConnected, videoError }) => {
  return (
    <div className="video-overlay">
      {videoError && (
        <div className="error-overlay">
          <span className="error-text">{videoError}</span>
        </div>
      )}
      
      {!stream && !isConnected && !videoError && (
        <div className="waiting-overlay">
          <span className="waiting-text">Ожидание сессии...</span>
        </div>
      )}
    </div>
  );
};

export default VideoOverlay;
