import { useState, useEffect, useRef } from 'react'
import './App.css'
import { apiService } from './services/api'

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
  const [videoUrl, setVideoUrl] = useState(null)

  // Refs
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)

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
      setVoices(voicesArray)
      if (voicesArray.length > 0) {
        setSelectedVoice(voicesArray[0].voice_id)
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
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      const chunks = []
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
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
    setVideoUrl(null)

    try {
      const response = await apiService.generateVideo(imageFile, audioBlob, selectedVoice)
      setTaskId(response.task_id)
      
      // Start polling for status
      startStatusPolling(response.task_id)
    } catch (err) {
      setError(err.message || 'Failed to start video generation')
      console.error('Generation Error:', err)
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
        
        // If video is ready, set the URL
        if (status.video_url) {
          setVideoUrl(status.video_url)
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 AI Talking Avatar</h1>
        <p>Create animated videos with your voice and image</p>
      </header>

      {/* API Status Section */}
      <section className="api-status">
        <h2>🔗 API Connection Status</h2>
        <div className="status-info">
          <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
          {loading && <p>Testing connection...</p>}
          {error && <p className="error">Error: {error}</p>}
          {healthStatus && (
            <div className="success">
              <p>✅ API Connected Successfully!</p>
            </div>
          )}
        </div>
        <button onClick={testApiConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test API Connection'}
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
            <audio controls>
              <source src={audioUrl} type="audio/webm" />
              Your browser does not support the audio element.
            </audio>
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

      {/* Video Result */}
      {videoUrl && (
        <section className="video-result">
          <h2>🎬 Generated Video</h2>
          <div className="video-container">
            <video controls autoPlay className="result-video">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video element.
            </video>
            <div className="video-actions">
              <a href={videoUrl} download="generated-video.mp4" className="download-button">
                📥 Download Video
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
