import React, { useState } from 'react';
import { useElevenLabs } from '../hooks/useElevenLabs';
import { useMicrophoneRecording } from '../hooks/useMicrophoneRecording';
import ErrorMessage from './ErrorMessage';

const ElevenLabsTester = ({ voices = [], loadingVoices = false }) => {
  const [testText, setTestText] = useState('Привет! Это тест ElevenLabs API.');
  const [selectedVoiceForTest, setSelectedVoiceForTest] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [testResults, setTestResults] = useState([]);

  const {
    textToSpeech,
    speechToSpeech,
    validateVoice,
    testAuth,
    playAudioData,
    isProcessing,
    error,
    clearState
  } = useElevenLabs();

  const {
    isRecording,
    isProcessing: isProcessingMicrophone,
    error: microphoneError,
    audioBlob,
    audioUrl,
    processedAudioUrl,
    startRecording,
    stopRecording,
    processWithElevenLabs,
    playOriginalAudio,
    playProcessedAudio,
    clearAudio,
    getRecordingDuration
  } = useMicrophoneRecording();

  const addTestResult = (testName, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      testName,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleTestAuth = async () => {
    try {
      addTestResult('Аутентификация', 'pending', 'Тестирование аутентификации...');
      
      const response = await testAuth();
      
      if (response.success) {
        addTestResult('Аутентификация', 'success', 'Аутентификация успешна', response.data);
      } else {
        addTestResult('Аутентификация', 'error', response.message || 'Ошибка аутентификации');
      }
    } catch (error) {
      addTestResult('Аутентификация', 'error', error.message);
    }
  };

  const handleTestTTS = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для теста');
      return;
    }

    try {
      addTestResult('Text-to-Speech', 'pending', 'Тестирование TTS...');
      
      const response = await textToSpeech(testText, selectedVoiceForTest);
      
      if (response.success) {
        addTestResult('Text-to-Speech', 'success', 'TTS успешно выполнен', {
          format: response.format,
          sample_rate: response.sample_rate,
          bitrate: response.bitrate
        });
        
        // Play the generated audio
        await playAudioData(response.audio_data, response.format);
      } else {
        addTestResult('Text-to-Speech', 'error', response.message || 'Ошибка TTS');
      }
    } catch (error) {
      addTestResult('Text-to-Speech', 'error', error.message);
    }
  };

  const handleTestSTS = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для теста');
      return;
    }

    if (!audioFile) {
      alert('Выберите аудио файл для теста');
      return;
    }

    try {
      addTestResult('Speech-to-Speech', 'pending', 'Тестирование STS...');
      
      const response = await speechToSpeech(audioFile, selectedVoiceForTest);
      
      if (response.success) {
        addTestResult('Speech-to-Speech', 'success', 'STS успешно выполнен', {
          format: response.format,
          sample_rate: response.sample_rate,
          bitrate: response.bitrate
        });
        
        // Play the generated audio
        await playAudioData(response.audio_data, response.format);
      } else {
        addTestResult('Speech-to-Speech', 'error', response.message || 'Ошибка STS');
      }
    } catch (error) {
      addTestResult('Speech-to-Speech', 'error', error.message);
    }
  };

  const handleTestVoiceValidation = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для валидации');
      return;
    }

    try {
      addTestResult('Валидация голоса', 'pending', 'Тестирование валидации голоса...');
      
      const response = await validateVoice(selectedVoiceForTest);
      
      if (response.success) {
        addTestResult('Валидация голоса', 'success', 
          response.valid ? 'Голос валиден' : 'Голос не валиден', 
          { valid: response.valid }
        );
      } else {
        addTestResult('Валидация голоса', 'error', response.error || 'Ошибка валидации');
      }
    } catch (error) {
      addTestResult('Валидация голоса', 'error', error.message);
    }
  };

  // New microphone recording functions
  const handleStartMicrophoneRecording = async () => {
    try {
      await startRecording();
      addTestResult('Запись с микрофона', 'pending', 'Запись начата...');
    } catch (error) {
      addTestResult('Запись с микрофона', 'error', error.message);
    }
  };

  const handleStopMicrophoneRecording = () => {
    stopRecording();
    addTestResult('Запись с микрофона', 'success', 'Запись завершена');
  };

  const handleProcessMicrophoneAudio = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для обработки');
      return;
    }

    if (!audioBlob) {
      alert('Сначала запишите аудио с микрофона');
      return;
    }

    try {
      addTestResult('Обработка микрофона', 'pending', 'Обработка аудио через ElevenLabs...');
      
      const response = await processWithElevenLabs(selectedVoiceForTest);
      
      if (response.success) {
        addTestResult('Обработка микрофона', 'success', 'Аудио успешно обработано', {
          format: response.format,
          sampleRate: response.sampleRate,
          bitrate: response.bitrate
        });
      } else {
        addTestResult('Обработка микрофона', 'error', response.message || 'Ошибка обработки');
      }
    } catch (error) {
      addTestResult('Обработка микрофона', 'error', error.message);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    } else {
      alert('Пожалуйста, выберите аудио файл');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    clearState();
    clearAudio();
  };

  return (
    <div className="elevenlabs-tester">
      <h3>Тестирование ElevenLabs API</h3>
      
      <div className="test-controls">
        <div className="test-input-group">
          <label>Текст для TTS:</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Введите текст для преобразования в речь"
            rows={3}
          />
        </div>

        <div className="test-input-group">
          <label>Голос для тестов:</label>
          <div className="voice-dropdown-container">
            <select
              className="voice-dropdown"
              value={selectedVoiceForTest}
              onChange={(e) => setSelectedVoiceForTest(e.target.value)}
              disabled={loadingVoices}
            >
              <option value="">Выберите голос для тестов</option>
              {loadingVoices ? (
                <option value="">Загрузка голосов...</option>
              ) : (
                voices && voices.length > 0 && voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} - {voice.description}
                  </option>
                ))
              )}
            </select>
            {loadingVoices && (
              <div className="loading-indicator">
                <span className="loading-spinner">⏳</span>
              </div>
            )}
          </div>
        </div>

        <div className="test-input-group">
          <label>Аудио файл для STS:</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
          />
          {audioFile && (
            <span className="file-info">✅ Выбран: {audioFile.name}</span>
          )}
        </div>

        {/* Microphone Recording Section */}
        <div className="microphone-section">
          <h4>🎤 Запись с микрофона</h4>
          
          <div className="microphone-controls">
            <button 
              onClick={handleStartMicrophoneRecording}
              disabled={isRecording || isProcessingMicrophone}
              className="test-btn microphone-btn record-btn"
            >
              {isRecording ? '⏳' : '🎤'} {isRecording ? 'Запись...' : 'Начать запись'}
            </button>

            <button 
              onClick={handleStopMicrophoneRecording}
              disabled={!isRecording}
              className="test-btn microphone-btn stop-btn"
            >
              ⏹️ Остановить запись
            </button>

            <button 
              onClick={handleProcessMicrophoneAudio}
              disabled={!audioBlob || !selectedVoiceForTest || isProcessingMicrophone}
              className="test-btn microphone-btn process-btn"
            >
              {isProcessingMicrophone ? '⏳' : '🔄'} Обработать через ElevenLabs
            </button>
          </div>

          {/* Audio Playback Controls */}
          {(audioUrl || processedAudioUrl) && (
            <div className="audio-playback">
              <h5>Воспроизведение:</h5>
              
              {audioUrl && (
                <button 
                  onClick={playOriginalAudio}
                  className="test-btn playback-btn original-btn"
                >
                  🔊 Воспроизвести оригинал
                </button>
              )}

              {processedAudioUrl && (
                <button 
                  onClick={playProcessedAudio}
                  className="test-btn playback-btn processed-btn"
                >
                  🎵 Воспроизвести обработанное
                </button>
              )}

              <button 
                onClick={clearAudio}
                className="test-btn clear-btn"
              >
                🗑️ Очистить аудио
              </button>
            </div>
          )}

          {/* Recording Status */}
          {isRecording && (
            <div className="recording-status">
              <span className="recording-indicator">🔴 Запись...</span>
            </div>
          )}

          {audioBlob && (
            <div className="recording-info">
              <span>✅ Записано: {getRecordingDuration()} сек</span>
            </div>
          )}
        </div>

        <div className="test-buttons">
          <button 
            onClick={handleTestAuth}
            disabled={isProcessing}
            className="test-btn auth-btn"
          >
            {isProcessing ? '⏳' : '🔐'} Тест Аутентификации
          </button>

          <button 
            onClick={handleTestTTS}
            disabled={isProcessing || !selectedVoiceForTest}
            className="test-btn tts-btn"
          >
            {isProcessing ? '⏳' : '🎤'} Тест TTS
          </button>

          <button 
            onClick={handleTestSTS}
            disabled={isProcessing || !selectedVoiceForTest || !audioFile}
            className="test-btn sts-btn"
          >
            {isProcessing ? '⏳' : '🔄'} Тест STS
          </button>

          <button 
            onClick={handleTestVoiceValidation}
            disabled={isProcessing || !selectedVoiceForTest}
            className="test-btn validation-btn"
          >
            {isProcessing ? '⏳' : '✅'} Валидация Голоса
          </button>

          <button 
            onClick={clearResults}
            className="test-btn clear-btn"
          >
            🗑️ Очистить Результаты
          </button>
        </div>
      </div>

      {/* Показываем информацию о выбранном голосе */}
      {selectedVoiceForTest && (
        <div className="voice-info">
          <p className="selected-voice">
            Выбран для тестов: <strong>{voices.find(v => v.voice_id === selectedVoiceForTest)?.name}</strong>
          </p>
        </div>
      )}

      {(error || microphoneError) && (
        <ErrorMessage 
          message={`Ошибка ElevenLabs: ${error || microphoneError}`} 
          onRetry={() => {
            clearState();
            clearAudio();
          }}
        />
      )}

      <div className="test-results">
        <h4>Результаты тестов:</h4>
        {testResults.length === 0 ? (
          <p className="no-results">Нет результатов тестов</p>
        ) : (
          <div className="results-list">
            {testResults.map(result => (
              <div key={result.id} className={`test-result ${result.success}`}>
                <div className="result-header">
                  <span className="result-name">{result.testName}</span>
                  <span className="result-time">{result.timestamp}</span>
                </div>
                <div className="result-status">
                  {result.success === 'success' && '✅'}
                  {result.success === 'error' && '❌'}
                  {result.success === 'pending' && '⏳'}
                  <span className="result-message">{result.message}</span>
                </div>
                {result.data && (
                  <div className="result-data">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElevenLabsTester;
