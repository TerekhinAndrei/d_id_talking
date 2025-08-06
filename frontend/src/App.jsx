import { useState, useEffect, useRef } from 'react'
import './App.css'
import { apiService } from './services/api'
import WebRTCStream from './components/WebRTCStream'
import WebRTCStreaming from './components/WebRTCStreaming'

function App() {
  // State for API connection
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // State for voices
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loadingVoices, setLoadingVoices] = useState(false)

  // State for microphone recording
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)

  // State for image upload
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // State for video generation
  const [taskId, setTaskId] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)
  const [videoUrl, setVideoUrl] = useState('/files/Waiting.mp4')
  const [isGeneratedVideo, setIsGeneratedVideo] = useState(false)

  // State for view mode
  const [viewMode, setViewMode] = useState('standard') // 'standard' or 'webrtc'

  // Refs
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const videoRef = useRef(null)

  // Test API connection
  const testApiConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const health = await apiService.getHealth()
      setHealthStatus(health)
    } catch (err) {
      setError(err.message || 'Failed to connect to API')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load voices from API
  const loadVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await apiService.getVoices()
      // API returns array directly, not object with voices field
      const voicesArray = Array.isArray(response) ? response : (response.voices || [])
      
      // Sort voices alphabetically by name
      const sortedVoices = voicesArray.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
      
      setVoices(sortedVoices)
      if (sortedVoices.length > 0) {
        setSelectedVoice(sortedVoices[0].voice_id)
      }
    } catch (err) {
      console.error('Failed to load voices:', err)
      setError('Failed to load voices')
    } finally {
      setLoadingVoices(false)
    }
  }

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Start recording from microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try different audio formats for better compatibility
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        } else {
          mimeType = 'audio/wav'
        }
      }
      
      console.log('Using MIME type:', mimeType)
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      
      const chunks = []
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        console.log('Audio blob created:', blob.size, 'bytes, type:', blob.type)
        
        // Check audio quality and size
        console.log('Original audio size:', blob.size, 'bytes')
        
        if (blob.size < 1000) {
          console.warn('Audio file too small, might be empty or corrupted')
        }
        
        // Keep original format for playback
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        console.log('Audio URL created:', url)
        setAudioUrl(url)
        
        // Log audio details for debugging
        console.log('Audio details:', {
          size: blob.size,
          type: blob.type,
          duration: recordingTime
        })
        
        // Create a copy for server with different MIME type
        const serverBlob = new Blob([blob], { type: 'audio/mpeg' })
        console.log('Server audio blob created:', serverBlob.size, 'bytes, type:', serverBlob.type)
        
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to access microphone')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Ensure minimum recording time
      if (recordingTime < 2) {
        console.warn('Recording too short, minimum 2 seconds required')
        setError('Please record at least 2 seconds of audio')
        return
      }
      
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  // Generate video
  const generateVideo = async () => {
    if (!imageFile || !audioBlob) {
      setError('Please select an image and record audio')
      return
    }

    setGenerating(true)
    setError(null)
    setTaskStatus(null)
    setVideoUrl('/files/Waiting.mp4') // Reset to default waiting video
    setIsGeneratedVideo(false)

    try {
      const response = await apiService.generateVideo(imageFile, audioBlob, selectedVoice)
      console.log('Generation response:', response)
      setTaskId(response.task_id)
      
      // Start polling for status
      startStatusPolling(response.task_id)
    } catch (err) {
      console.error('Generation Error:', err)
      setError(err.message || 'Failed to start video generation')
    } finally {
      setGenerating(false)
    }
  }

  // Poll task status
  const startStatusPolling = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const status = await apiService.getTaskStatus(taskId)
        setTaskStatus(status)
        
        // If video is ready, update the video URL
        if (status.video_url) {
          setVideoUrl(status.video_url)
          setIsGeneratedVideo(true)
        }
        
        // Stop polling if task is completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
          setPollingInterval(null)
        }
      } catch (err) {
        console.error('Failed to get task status:', err)
        clearInterval(interval)
        setPollingInterval(null)
      }
    }, 2000) // Poll every 2 seconds

    setPollingInterval(interval)
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Open video in system player
  const openInSystemPlayer = (videoUrl) => {
    if (videoUrl) {
      console.log('🎬 Opening video in system player:', videoUrl)
      
      // Method 1: Direct download and open
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = 'generated-video.mp4'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Method 2: Open in new window
      const videoWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=no,resizable=yes')
      if (videoWindow) {
        videoWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Generated Video</title>
              <style>
                body { margin: 0; padding: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
                video { max-width: 100%; max-height: 100%; }
              </style>
            </head>
            <body>
              <video controls autoplay>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video element.
              </video>
            </body>
          </html>
        `)
        videoWindow.document.close()
      }
    }
  }

  // Handle user interaction to enable sound
  const handleVideoClick = () => {
    if (isGeneratedVideo && videoRef.current) {
      videoRef.current.muted = false
      console.log('🔊 Sound enabled by user click')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [pollingInterval])

  // Load voices on mount
  useEffect(() => {
    testApiConnection()
    loadVoices()
  }, [])

  // Start base video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Failed to play base video:', err)
      })
    }
  }, [])

  // Update video source when isGeneratedVideo changes
  useEffect(() => {
    if (videoRef.current && isGeneratedVideo) {
      videoRef.current.src = videoUrl
      videoRef.current.load() // Force reload to apply new source
      
      // Start muted for autoplay, then enable sound
      videoRef.current.muted = true
      videoRef.current.play().then(() => {
        console.log('✅ Video started playing (muted)')
        // Enable sound after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.muted = false
            console.log('🔊 Sound enabled')
          }
        }, 500)
      }).catch(err => {
        console.error('Failed to play generated video:', err)
      })
    }
  }, [videoUrl, isGeneratedVideo])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 AI Talking Avatar</h1>
        <p>Create animated videos with your voice and image</p>
        
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`mode-button ${viewMode === 'standard' ? 'active' : ''}`}
            onClick={() => setViewMode('standard')}
          >
            📹 Standard Generation
          </button>
          <button
            className={`mode-button ${viewMode === 'webrtc' ? 'active' : ''}`}
            onClick={() => setViewMode('webrtc')}
          >
            🔴 Live Streaming
          </button>
        </div>
      </header>

      {viewMode === 'webrtc' ? (
        <WebRTCStreaming />
      ) : (
        <div className="main-container">
        {/* Left Panel - Controls */}
        <div className="left-panel">
          {/* API Status Section - Simplified */}
          <section className="api-status">
            <div className="status-indicator">
              <div className={`status-dot ${healthStatus ? 'connected' : 'disconnected'}`}></div>
              <span className="status-text">
                {loading ? 'Testing...' : 
                 healthStatus ? 'Connected Successfully' : 
                 error ? 'Connection Failed' : 'Not Connected'}
              </span>
            </div>
            <button onClick={testApiConnection} disabled={loading} className="test-button">
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          </section>

          {/* Voice Selection */}
          <section className="voice-selection">
            <h2>🎭 Voice Selection</h2>
            {loadingVoices ? (
              <p>Loading voices...</p>
            ) : (
              <div className="voice-selector">
                <label htmlFor="voice-select">Choose a voice:</label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={voices.length === 0}
                >
                  {voices.map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.category})
                    </option>
                  ))}
                </select>
                {voices.length === 0 && <p className="error">No voices available</p>}
              </div>
            )}
          </section>

          {/* Image Upload */}
          <section className="image-upload">
            <h2>🖼️ Upload Image</h2>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="upload-button"
            >
              Select Image
            </button>
            {imageFile && (
              <div className="file-info">
                <p>✅ {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)</p>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>
            )}
          </section>

          {/* Audio Recording */}
          <section className="audio-recording">
            <h2>🎤 Record Audio</h2>
            <div className="recording-controls">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="record-button"
                  disabled={!imageFile}
                >
                  🎤 Start Recording
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="stop-button"
                >
                  ⏹️ Stop Recording ({formatTime(recordingTime)})
                </button>
              )}
            </div>
            
            {audioUrl && (
              <div className="audio-preview">
                <p>✅ Audio recorded ({Math.round(audioBlob.size / 1024)} KB)</p>
                <audio 
                  controls 
                  onError={(e) => console.error('Audio playback error:', e)}
                  onLoadStart={() => console.log('Audio loading started')}
                  onCanPlay={() => console.log('Audio can play')}
                  onLoadedMetadata={() => console.log('Audio metadata loaded')}
                >
                  <source src={audioUrl} type={audioBlob?.type || 'audio/webm'} />
                  <source src={audioUrl} type="audio/webm;codecs=opus" />
                  <source src={audioUrl} type="audio/mp4" />
                  <source src={audioUrl} type="audio/ogg" />
                  Your browser does not support the audio element.
                </audio>
                <button 
                  onClick={() => {
                    const audio = document.querySelector('audio')
                    if (audio) {
                      audio.play().catch(err => console.error('Play error:', err))
                    }
                  }}
                  className="play-button"
                >
                  ▶️ Play Audio
                </button>
              </div>
            )}
          </section>

          {/* Generate Button */}
          <section className="generate-section">
            <button
              onClick={generateVideo}
              disabled={!imageFile || !audioBlob || generating}
              className="generate-button"
            >
              {generating ? '🔄 Generating...' : '🚀 Generate Video'}
            </button>
            
            {/* Open in system player button */}
            {isGeneratedVideo && videoUrl && (
              <button
                onClick={() => openInSystemPlayer(videoUrl)}
                style={{ 
                  marginTop: '10px', 
                  background: '#FF6B35', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                🖥️ Open in System Player
              </button>
            )}
          </section>

          {/* Task Status */}
          {taskId && (
            <section className="task-status">
              <h2>📊 Generation Status</h2>
              <div className="task-info">
                <p><strong>Task ID:</strong> {taskId}</p>
                {taskStatus && (
                  <div className="status-details">
                    <p><strong>Status:</strong> {taskStatus.status}</p>
                    {taskStatus.progress !== undefined && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${taskStatus.progress}%` }}
                        ></div>
                        <span>{taskStatus.progress}%</span>
                      </div>
                    )}
                    {taskStatus.talk_id && (
                      <p><strong>D-ID Talk ID:</strong> {taskStatus.talk_id}</p>
                    )}
                    {taskStatus.error_message && (
                      <p className="error"><strong>Error:</strong> {taskStatus.error_message}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Panel - Video */}
        <div className="right-panel">
          <section className="video-section">
            <h3>Video Preview</h3>
            <div className="video-container">
              <video 
                ref={videoRef}
                autoPlay
                muted
                playsInline
                loop={!isGeneratedVideo}
                className="result-video"
                onEnded={() => {
                  if (isGeneratedVideo) {
                    // Return to waiting video after generated video ends
                    setVideoUrl('/files/Waiting.mp4')
                    setIsGeneratedVideo(false)
                  }
                }}
                onPlay={() => {
                  // Enable sound when video starts playing
                  if (isGeneratedVideo && videoRef.current) {
                    setTimeout(() => {
                      videoRef.current.muted = false
                      console.log('🔊 Sound enabled on play')
                    }, 100)
                  }
                }}
                onClick={handleVideoClick}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video element.
              </video>
            </div>
          </section>
        </div>
      </div>
      )}
    </div>
  )
}

export default App
