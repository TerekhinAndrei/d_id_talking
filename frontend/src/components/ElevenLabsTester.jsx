import React, { useState } from 'react';
import { useElevenLabs } from '../hooks/useElevenLabs';
import ErrorMessage from './ErrorMessage';

const ElevenLabsTester = () => {
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
          <input
            type="text"
            value={selectedVoiceForTest}
            onChange={(e) => setSelectedVoiceForTest(e.target.value)}
            placeholder="Введите ID голоса (например: 21m00Tcm4TlvDq8ikWAM)"
          />
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

      {error && (
        <ErrorMessage 
          message={`Ошибка ElevenLabs: ${error}`} 
          onRetry={() => clearState()}
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
