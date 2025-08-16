import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="container">
        <h1 className="text-4xl font-bold text-primary mb-8">Talking Head - Color Scheme</h1>
        
        {/* Color Palette Demo */}
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
    </div>
  )
}

export default App
