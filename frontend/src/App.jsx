import React from 'react'
import VideoPlayer from './components/VideoPlayer'

function App() {
  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="container">
        <h1 className="text-4xl font-bold text-primary mb-8">Talking Head</h1>
        
        <VideoPlayer 
          defaultVideoSrc="/Waiting.mp4"
          streamVideoSrc={null}
          isStreamActive={false}
          className="mb-8"
        />
      </div>
    </div>
  )
}

export default App
