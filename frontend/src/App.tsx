import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoPlayer from './components/VideoPlayer';
import DIdStreamingTester from './components/DIdStreamingTester';
import { DIdVideoTalksDemo } from './components/DIdVideoTalksDemo';
import { useDefaultVideo } from './contexts/AppContext';

const App: React.FC = () => {
  const [showTester, setShowTester] = useState(false);
  const [showTalksDemo, setShowTalksDemo] = useState(false);
  const { defaultVideoUrl } = useDefaultVideo();

  const handleFileUpdate = (file: File, url: string) => {
    console.log('🖼️ File updated:', file.name, 'URL:', url);
    // Здесь можно добавить дополнительную логику при обновлении файла
  };

  if (showTester) {
    return <DIdStreamingTester onBack={() => setShowTester(false)} />;
  }

  if (showTalksDemo) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="flex justify-between items-center p-4 bg-white shadow-sm">
          <h1 className="text-xl font-bold">🎬 D-ID Video Talks Demo</h1>
          <button
            onClick={() => setShowTalksDemo(false)}
            className="btn btn-secondary"
          >
            ← Назад
          </button>
        </div>
        <DIdVideoTalksDemo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="container">
        <Header />
        
        {/* Кнопки переключения */}
        <div className="flex justify-end gap-4 mb-4">
          <button
            onClick={() => setShowTalksDemo(true)}
            className="btn btn-primary"
          >
            🎬 D-ID Video Talks Demo
          </button>
          <button
            onClick={() => setShowTester(true)}
            className="btn btn-accent"
          >
            🧪 Test D-ID Streaming
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mt-8" style={{ height: '80vh', gridTemplateColumns: '15% 85%' }}>
          <div className="flex items-start justify-center pt-4">
            <FileUpload 
              accept="image/*"
              multiple={false}
              maxSize={10}
              onFileUpdate={handleFileUpdate}
            />
          </div>
          
          <div className="h-full">
            <VideoPlayer 
              defaultVideoSrc={defaultVideoUrl}
              streamVideoSrc={null}
              isStreamActive={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
