import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-primary">
      <div className="container">
        {/* Header */}
        <header className="p-6 border-b border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">TH</span>
              </div>
              <h1 className="text-2xl font-bold text-primary">Talking Head</h1>
            </div>
            <nav className="flex items-center gap-6">
              <button className="btn btn-ghost">Dashboard</button>
              <button className="btn btn-ghost">Streams</button>
              <button className="btn btn-ghost">Settings</button>
              <button className="btn btn-primary">New Stream</button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hero Section */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title text-3xl mb-4">Welcome to Talking Head</h2>
                  <p className="card-content text-lg">
                    Create AI-powered video streams with real-time voice synthesis and facial animation.
                  </p>
                </div>
                <div className="flex gap-4 mt-6">
                  <button className="btn btn-primary">Start Streaming</button>
                  <button className="btn btn-secondary">Learn More</button>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Active Streams</span>
                  <span className="text-primary font-semibold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Total Views</span>
                  <span className="text-primary font-semibold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Voice Models</span>
                  <span className="text-primary font-semibold">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Real-time Streaming</h3>
              </div>
              <p className="card-content">
                Stream AI-generated talking head videos in real-time with WebRTC technology.
              </p>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Voice Synthesis</h3>
              </div>
              <p className="card-content">
                High-quality voice synthesis with multiple AI models and languages.
              </p>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Facial Animation</h3>
              </div>
              <p className="card-content">
                Advanced facial animation that syncs perfectly with voice output.
              </p>
            </div>
          </div>

          {/* Color Palette Demo */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Design System</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-primary-600 mb-2"></div>
                <span className="text-sm text-secondary">Primary</span>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-accent-500 mb-2"></div>
                <span className="text-sm text-secondary">Accent</span>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-success mb-2"></div>
                <span className="text-sm text-secondary">Success</span>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-warning mb-2"></div>
                <span className="text-sm text-secondary">Warning</span>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-error mb-2"></div>
                <span className="text-sm text-secondary">Error</span>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-elevated mb-2"></div>
                <span className="text-sm text-secondary">Elevated</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
