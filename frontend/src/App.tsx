import React from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import DIdApiTester from './components/DIdApiTester';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="container">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <VideoPlayer 
            defaultVideoSrc="/Waiting.mp4"
            streamVideoSrc={null}
            isStreamActive={false}
          />
          
          <DIdApiTester />
        </div>
      </div>
    </div>
  );
};

export default App;
