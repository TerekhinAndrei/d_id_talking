import React, { useState } from 'react';
import { useElevenLabs } from '../hooks/useElevenLabs';
import { useMicrophoneRecording } from '../hooks/useMicrophoneRecording';
import { useMicrophoneToDid } from '../hooks/useMicrophoneToDid';
import ErrorMessage from './ErrorMessage';
import AudioVisualizer from './AudioVisualizer';

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
    streamStats,
    audioChunks,
    processedChunks,
    error: microphoneError,
    startRecording,
    stopRecording
  } = useMicrophoneRecording();

  // Хук для микрофона с загрузкой в D-ID
  const {
    isRecording: isRecordingDid,
    isProcessing: isProcessingDid,
    isUploading,
    streamStats: didStats,
    audioChunks: didChunks,
    processedChunks: didProcessedChunks,
    uploadedFiles,
    error: didError,
    startRecording: startRecordingDid,
    stopRecording: stopRecordingDid
  } = useMicrophoneToDid({
    onAudioUploaded: (didUrl, provider) => {
      console.log('🎵 Аудио загружено в D-ID:', didUrl, 'Provider:', provider);
      addTestResult('D-ID загрузка', 'success', `Файл загружен в ${provider}: ${didUrl}`, { url: didUrl, provider });
      
      // Автоматически воспроизводим загруженный файл
      playDidAudio(didUrl);
    }
  });

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
        const playResult = await playAudioData(response.audio_data, response.format);
        
        if (!playResult.success && playResult.canRetry) {
          addTestResult('Воспроизведение аудио', 'warning', playResult.message);
        }
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
        const playResult = await playAudioData(response.audio_data, response.format);
        
        if (!playResult.success && playResult.canRetry) {
          addTestResult('Воспроизведение аудио', 'warning', playResult.message);
        }
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

  // Real-time streaming functions
  const handleStartStreaming = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для стриминга');
      return;
    }

    try {
      addTestResult('Потоковый стриминг', 'pending', 'Запуск стриминга в реальном времени...');
      await startRecording(selectedVoiceForTest);
      addTestResult('Потоковый стриминг', 'success', 'Стриминг запущен - говорите в микрофон');
    } catch (error) {
      addTestResult('Потоковый стриминг', 'error', error.message);
    }
  };

  const handleStopStreaming = () => {
    stopRecording();
    addTestResult('Потоковый стриминг', 'success', 'Стриминг остановлен');
  };

  // Cloudinary streaming functions
  const handleStartDidStreaming = async () => {
    if (!selectedVoiceForTest) {
      alert('Выберите голос для D-ID стриминга');
      return;
    }

    try {
      addTestResult('D-ID стриминг', 'pending', 'Запуск стриминга с загрузкой в D-ID...');
      await startRecordingDid(selectedVoiceForTest);
      addTestResult('D-ID стриминг', 'success', 'Стриминг запущен - говорите в микрофон, результат будет загружен в D-ID');
    } catch (error) {
      addTestResult('D-ID стриминг', 'error', error.message);
    }
  };

  const handleStopDidStreaming = () => {
    stopRecordingDid();
    addTestResult('D-ID стриминг', 'success', 'Стриминг остановлен');
  };

  const handleStopPlayback = () => {
    // Воспроизведение теперь обрабатывается автоматически в AudioWorklet
    addTestResult('Воспроизведение', 'info', 'Воспроизведение обрабатывается автоматически');
  };

  // Воспроизведение аудио из D-ID
  const playDidAudio = async (didUrl) => {
    try {
      addTestResult('Воспроизведение D-ID', 'pending', 'Воспроизведение загруженного аудио...');
      
      const response = await fetch(didUrl);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        addTestResult('Воспроизведение D-ID', 'success', 'Аудио воспроизведено успешно');
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        addTestResult('Воспроизведение D-ID', 'error', `Ошибка воспроизведения: ${error.message}`);
      };
      
      await audio.play();
      addTestResult('Воспроизведение D-ID', 'success', 'Воспроизведение начато');
      
    } catch (error) {
      addTestResult('Воспроизведение D-ID', 'error', `Ошибка: ${error.message}`);
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
    // clearData(); // clearData is not in the new useMicrophoneRecording hook
  };

  // Get streaming statistics
  const stats = streamStats;

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

        {/* Real-time Streaming Section */}
        <div className="microphone-section">
          <h4>🎤 Потоковый стриминг в реальном времени</h4>
          
          <div className="streaming-info">
            <p className="streaming-description">
              <strong>🎯 WEBSOCKET СТРИМИНГ:</strong> Говорите в микрофон - ваша речь будет 
              передаваться через WebSocket чанками по 0.2 секунды и воспроизводиться измененным голосом 
              в реальном времени с минимальной задержкой.
            </p>
          </div>

          {/* АУДИО ВИЗУАЛИЗАТОР */}
          <AudioVisualizer 
            isRecording={isRecording}
            audioData={audioChunks}
          />

          <div className="microphone-controls">
            <button 
              onClick={handleStartStreaming}
              disabled={isRecording || isProcessingMicrophone || !selectedVoiceForTest}
              className="test-btn microphone-btn stream-btn"
            >
              {isRecording ? '⏳' : '🎤'} {isRecording ? 'Стриминг...' : 'Начать стриминг'}
            </button>

            <button 
              onClick={handleStopStreaming}
              disabled={!isRecording}
              className="test-btn microphone-btn stop-btn"
            >
              ⏹️ Остановить стриминг
            </button>

            <button 
              onClick={handleStopPlayback}
              className="test-btn microphone-btn stop-playback-btn"
            >
              Остановить воспроизведение
            </button>
          </div>

          {/* УЛУЧШЕННАЯ СТАТИСТИКА СТРИМИНГА */}
          {(isRecording || streamStats.totalChunks > 0) && (
            <div className="streaming-stats">
              <h5>📊 Расширенная статистика стриминга:</h5>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Статус записи:</span>
                  <span className={`stat-value ${isRecording ? 'recording' : 'stopped'}`}>
                    {isRecording ? '🔴 Запись' : '⏹️ Остановлено'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Статус обработки:</span>
                  <span className={`stat-value ${isProcessingMicrophone ? 'processing' : 'idle'}`}>
                    {isProcessingMicrophone ? '🔄 Обработка' : '⏸️ Ожидание'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Статус воспроизведения:</span>
                  <span className="stat-value stopped">
                    🔇 Автоматическое
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Всего чанков:</span>
                  <span className="stat-value">{streamStats.totalChunks}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Обработано чанков:</span>
                  <span className="stat-value success">{streamStats.processedChunks}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Ошибок обработки:</span>
                  <span className="stat-value error">{streamStats.failedChunks}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Текущая задержка:</span>
                  <span className="stat-value">
                    {streamStats.currentLatency > 0 ? `${streamStats.currentLatency}ms` : 'Н/Д'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Средняя задержка:</span>
                  <span className="stat-value">
                    {streamStats.averageLatency > 0 ? `${Math.round(streamStats.averageLatency)}ms` : 'Н/Д'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Процент успеха:</span>
                  <span className="stat-value">
                    {streamStats.totalChunks > 0 ? 
                      `${Math.round((streamStats.processedChunks / streamStats.totalChunks) * 100)}%` : 
                      '0%'
                    }
                  </span>
                </div>
              </div>

              {/* Прогресс-бар обработки */}
              {streamStats.totalChunks > 0 && (
                <div className="processing-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(streamStats.processedChunks / streamStats.totalChunks) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {streamStats.processedChunks} / {streamStats.totalChunks} чанков обработано
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Chunk History */}
          {audioChunks.length > 0 && (
            <div className="chunk-history">
              <h5>📦 История чанков:</h5>
              <div className="chunks-list">
                {audioChunks.slice(-5).reverse().map((chunk, index) => (
                  <div key={`audio-chunk-${chunk.id}-${chunk.timestamp}`} className="chunk-item">
                    <span className="chunk-number">#{chunk.counter}</span>
                    <span className="chunk-size">{chunk.size} байт</span>
                    <span className="chunk-time">{chunk.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Обработанные чанки */}
          {processedChunks.length > 0 && (
            <div className="processed-chunks">
              <h5>✅ Обработанные чанки:</h5>
              <div className="chunks-list">
                {processedChunks.slice(-5).reverse().map((chunk, index) => (
                  <div key={`processed-chunk-${chunk.id}-${chunk.timestamp}`} className="chunk-item processed">
                    <span className="chunk-number">#{index + 1}</span>
                    <span className="chunk-size">
                      {chunk.originalSize} → {chunk.processedSize} байт
                    </span>
                    <span className="chunk-time">
                      {chunk.processingTime}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cloudinary Streaming Section */}
        <div className="cloudinary-section">
          <h4>☁️ Микрофон → ElevenLabs → Cloudinary → Автовоспроизведение</h4>
          
          <div className="streaming-info">
            <p className="streaming-description">
              <strong>🎯 ПОЛНЫЙ ПАЙПЛАЙН:</strong> Говорите в микрофон → ElevenLabs обрабатывает → 
              Результат загружается в Cloudinary → Автоматически воспроизводится в динамиках. 
              Полный цикл обработки голоса с сохранением в облаке.
            </p>
          </div>

          {/* АУДИО ВИЗУАЛИЗАТОР для D-ID */}
          <AudioVisualizer 
            isRecording={isRecordingDid}
            audioData={didChunks}
          />

          <div className="did-controls">
            <button 
              onClick={handleStartDidStreaming}
              disabled={isRecordingDid || isProcessingDid || isUploading || !selectedVoiceForTest}
              className="test-btn microphone-btn did-btn"
            >
              {isRecordingDid ? '⏳' : isUploading ? '🎯' : '🎤'} 
              {isRecordingDid ? 'Стриминг...' : isUploading ? 'Загрузка...' : 'Начать D-ID стриминг'}
            </button>

            <button 
              onClick={handleStopDidStreaming}
              disabled={!isRecordingDid}
              className="test-btn microphone-btn stop-btn"
            >
              ⏹️ Остановить D-ID стриминг
            </button>
          </div>

          {/* СТАТИСТИКА D-ID СТРИМИНГА */}
          {(isRecordingDid || didStats.totalChunks > 0) && (
            <div className="did-stats">
              <h5>📊 Статистика D-ID стриминга:</h5>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Статус записи:</span>
                  <span className={`stat-value ${isRecordingDid ? 'recording' : 'stopped'}`}>
                    {isRecordingDid ? '🔴 Запись' : '⏹️ Остановлено'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Статус обработки:</span>
                  <span className={`stat-value ${isProcessingDid ? 'processing' : 'idle'}`}>
                    {isProcessingDid ? '🔄 Обработка' : '⏸️ Ожидание'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Статус загрузки:</span>
                  <span className={`stat-value ${isUploading ? 'uploading' : 'idle'}`}>
                    {isUploading ? '🎯 Загрузка в D-ID' : '⏸️ Ожидание'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Отправлено чанков:</span>
                  <span className="stat-value">{didStats.sentChunks}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Обработано чанков:</span>
                  <span className="stat-value success">{didStats.processedChunks}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Загружено файлов:</span>
                  <span className="stat-value success">{didStats.uploadedFiles}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Общий объем данных:</span>
                  <span className="stat-value">
                    {Math.round(didStats.totalSentData / 1024)} KB
                  </span>
                </div>
              </div>

              {/* Прогресс-бар загрузки */}
              {didStats.totalChunks > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill did-fill"
                      style={{ 
                        width: `${(didStats.uploadedFiles / didStats.processedChunks) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {didStats.uploadedFiles} / {didStats.processedChunks} файлов загружено в D-ID
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ЗАГРУЖЕННЫЕ ФАЙЛЫ D-ID */}
          {uploadedFiles.length > 0 && (
            <div className="did-files">
              <h5>🎯 Загруженные файлы в D-ID:</h5>
              <div className="files-list">
                {uploadedFiles.slice(-5).reverse().map((file, index) => (
                  <div key={`did-file-${file.id}-${file.timestamp}`} className="file-item did-file">
                    <div className="file-header">
                      <span className="file-number">#{uploadedFiles.length - index}</span>
                      <span className="file-time">{file.timestamp.toLocaleTimeString()}</span>
                      <span className="file-size">{Math.round(file.size / 1024)} KB</span>
                      {file.provider && (
                        <span className="file-provider">({file.provider})</span>
                      )}
                    </div>
                    <div className="file-url">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="did-link"
                      >
                        🔗 {file.url}
                      </a>
                    </div>
                    <div className="file-actions">
                      <button 
                        onClick={() => playDidAudio(file.url)}
                        className="play-btn"
                        title="Воспроизвести"
                      >
                        🔊 Воспроизвести
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* История чанков D-ID */}
          {didChunks.length > 0 && (
            <div className="did-chunks">
              <h5>📦 История чанков D-ID:</h5>
              <div className="chunks-list">
                {didChunks.slice(-5).reverse().map((chunk) => (
                  <div key={`did-chunk-${chunk.id}-${chunk.timestamp}`} className="chunk-item did-chunk">
                    <span className="chunk-number">#{chunk.counter}</span>
                    <span className="chunk-size">{chunk.size} байт</span>
                    <span className="chunk-time">{chunk.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
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

      {(error || microphoneError || cloudinaryError) && (
        <ErrorMessage 
          message={`Ошибка: ${error || microphoneError || cloudinaryError}`} 
          onRetry={() => {
            clearState();
            // clearData(); // clearData is not in the new useMicrophoneRecording hook
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
                  {result.success === 'warning' && '⚠️'}
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
