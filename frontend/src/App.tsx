import React from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="container">
        <Header />
        
        <VideoPlayer 
          defaultVideoSrc="/Waiting.mp4"
          streamVideoSrc={null}
          isStreamActive={false}
          className="mt-8"
        />
      </div>
    </div>
  );
};

export default App;
