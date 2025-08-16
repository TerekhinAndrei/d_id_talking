import React from 'react';
import Layout from './components/layout/Layout';
import VideoPlayer from './components/VideoPlayer';
import { Card, CardContent } from './components/ui/Card';

const App: React.FC = () => {
  const handleNewStream = () => {
    console.log('New stream requested');
  };

  return (
    <Layout onNewStream={handleNewStream}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <h2 className="text-3xl font-bold text-primary mb-4">
                Welcome to Talking Head
              </h2>
              <p className="text-lg text-secondary mb-6">
                Create AI-powered video streams with real-time voice synthesis and facial animation.
              </p>
              
              <VideoPlayer 
                defaultVideoSrc="/Waiting.mp4"
                streamVideoSrc={null}
                isStreamActive={false}
                className="mb-6"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold text-primary mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Active Streams</span>
                  <span className="text-primary font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Total Views</span>
                  <span className="text-primary font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Voice Models</span>
                  <span className="text-primary font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default App;
