import React, { useState, useRef } from 'react';
import { useVoiceChanger } from '../hooks/useVoiceChanger.js';
import { useVoices } from '../hooks/useVoices.js';
import './VoiceChanger.css';

const VoiceChanger = () => {
  const {
    isRecording,
    isProcessing,
    processedAudio,
    error,
    selectedVoice,
    audioChunks,
    totalProcessedAudio,
    startRecording,
    stopRecording,
    processAudioFile,
    downloadProcessedAudio,
    clearData,
    setSelectedVoice,
    hasProcessedAudio,
    hasError,
    recordingTime
  } = useVoiceChanger();

  const { voices, loading: voicesLoading, error: voicesError } = useVoices();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (file && file.type.startsWith('audio/')) {
      try {
        await processAudioFile(file);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle voice selection
  const handleVoiceChange = (event) => {
    setSelectedVoice(event.target.value);
  };

  return (
    <div className="voice-changer">
      <div className="voice-changer-header">
        <h2>🎤 Voice Changer Stream</h2>
        <p>Измените свой голос в реальном времени с помощью микрофона</p>
      </div>

      {/* Voice Selection */}
      <div className="voice-changer-section">
        <h3>🎭 Выберите голос</h3>
        {voicesLoading ? (
          <p>Загрузка голосов...</p>
        ) : voicesError ? (
          <p className="error">Ошибка загрузки голосов: {voicesError}</p>
        ) : (
          <select 
            value={selectedVoice} 
            onChange={handleVoiceChange}
            className="voice-selector"
          >
            {voices.map(voice => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Recording Controls */}
      <div className="voice-changer-section">
        <h3>🎙️ Запись с микрофона</h3>
        <div className="recording-controls">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="btn btn-primary"
              disabled={isProcessing}
            >
              🎤 Начать запись
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="btn btn-danger"
            >
              ⏹️ Остановить запись
            </button>
          )}
          
          {recordingTime && (
            <span className="recording-status">
              {recordingTime}
            </span>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="voice-changer-section">
        <h3>📁 Загрузить аудио файл</h3>
        <div 
          className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <p>Перетащите аудио файл сюда или нажмите для выбора</p>
            <p className="upload-hint">Поддерживаются: MP3, WAV, WebM, OGG</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="voice-changer-section">
          <div className="error-message">
            <h3>❌ Ошибка</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="voice-changer-section">
          <div className="processing-status">
            <h3>🔄 Обработка аудио...</h3>
            <div className="loading-spinner"></div>
            <p>Пожалуйста, подождите</p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasProcessedAudio && (
        <div className="voice-changer-section">
          <h3>✅ Результат</h3>
          <div className="results-container">
            <div className="audio-info">
              <p>Обработанное аудио готово!</p>
              <p>Количество чанков: {audioChunks.length}</p>
            </div>
            
            <div className="audio-controls">
              <button 
                onClick={downloadProcessedAudio}
                className="btn btn-success"
              >
                💾 Скачать аудио
              </button>
              
              <button 
                onClick={clearData}
                className="btn btn-secondary"
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="voice-changer-section">
        <h3>📋 Инструкции</h3>
        <div className="instructions">
          <ol>
            <li>Выберите голос из списка выше</li>
            <li>Нажмите "Начать запись" для записи с микрофона</li>
            <li>Говорите в микрофон - ваша речь будет обрабатываться в реальном времени</li>
            <li>Нажмите "Остановить запись" когда закончите</li>
            <li>Или загрузите аудио файл для обработки</li>
            <li>Скачайте результат в формате MP3</li>
          </ol>
        </div>
      </div>

      {/* Technical Info */}
      <div className="voice-changer-section">
        <h3>🔧 Техническая информация</h3>
        <div className="tech-info">
          <p><strong>Формат записи:</strong> WebM (Opus кодек)</p>
          <p><strong>Частота дискретизации:</strong> 44.1 kHz</p>
          <p><strong>Каналы:</strong> Моно</p>
          <p><strong>Модель:</strong> eleven_multilingual_sts_v2</p>
          <p><strong>Оптимизация задержки:</strong> Максимальная</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceChanger;


