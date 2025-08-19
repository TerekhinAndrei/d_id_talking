import React, { useState, useCallback } from 'react';
import { useDIdMicrophoneTalkUpdated } from '../hooks/useDIdMicrophoneTalkUpdated.js';
import { fileStorageService, StorageProvider, UploadStrategy, UploadOptions } from '../core/index.js';

export const DIdAudioUploadTester = () => {
  const [testFile, setTestFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Используем обновленный хук для D-ID микрофона
  const {
    isProcessing,
    isRecording,
    isMicProcessing,
    isUploading: isMicUploading,
    isSendingToDid,
    error: micError,
    logs,
    streamStats,
    audioChunks,
    processedChunks,
    uploadedFiles,
    didUploadQueue,
    createTalkMic,
    stopTalkMic,
    clearState
  } = useDIdMicrophoneTalkUpdated();

  // Тестирование загрузки файла в D-ID
  const testFileUpload = useCallback(async () => {
    if (!testFile) {
      setError('Выберите файл для загрузки');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);

      console.log('🧪 Тестируем загрузку файла в D-ID:', testFile.name);

      // Инициализируем новую систему хранения файлов
      await fileStorageService.initialize();

      // Создаем опции для загрузки в D-ID с fallback
      const uploadOptions = new UploadOptions({
        provider: StorageProvider.D_ID,
        strategy: UploadStrategy.FALLBACK,
        onProgress: (progress) => console.log('Upload progress:', progress),
        onSuccess: (result) => console.log('✅ Upload success:', result),
        onError: (error) => console.error('❌ Upload error:', error)
      });

      // Загружаем файл
      const result = await fileStorageService.uploadAudio(testFile, uploadOptions);

      setUploadResult(result);
      console.log('✅ Тест загрузки завершен:', result);

    } catch (error) {
      console.error('❌ Ошибка тестирования загрузки:', error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  }, [testFile]);

  // Тестирование микрофона с загрузкой в D-ID
  const testMicrophoneUpload = useCallback(async () => {
    try {
      setError(null);
      
      // Тестовые параметры для D-ID
      const testStreamId = 'test-stream-' + Date.now();
      const testSessionId = 'test-session-' + Date.now();
      const testVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Тестовый голос

      console.log('🎤 Тестируем микрофон с загрузкой в D-ID:', {
        streamId: testStreamId,
        sessionId: testSessionId,
        voiceId: testVoiceId
      });

      await createTalkMic(testStreamId, testSessionId, testVoiceId);

    } catch (error) {
      console.error('❌ Ошибка тестирования микрофона:', error);
      setError(error.message);
    }
  }, [createTalkMic]);

  // Обработчик выбора файла
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setTestFile(file);
      setError(null);
      setUploadResult(null);
    }
  }, []);

  // Очистка состояния
  const handleClearState = useCallback(() => {
    clearState();
    setTestFile(null);
    setUploadResult(null);
    setError(null);
  }, [clearState]);

  return (
    <div className="did-audio-upload-tester">
      <h2>🎯 Тестер загрузки аудио в D-ID</h2>
      
      {/* Тестирование загрузки файла */}
      <div className="test-section">
        <h3>📁 Тест загрузки файла</h3>
        
        <div className="file-upload">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          {testFile && (
            <div className="file-info">
              <p>Выбран файл: {testFile.name}</p>
              <p>Размер: {(testFile.size / 1024).toFixed(2)} KB</p>
              <p>Тип: {testFile.type}</p>
            </div>
          )}
        </div>

        <button
          onClick={testFileUpload}
          disabled={!testFile || isUploading}
          className="test-button"
        >
          {isUploading ? '⏳ Загружаем...' : '🚀 Тест загрузки в D-ID'}
        </button>

        {uploadResult && (
          <div className="upload-result">
            <h4>✅ Результат загрузки:</h4>
            <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Тестирование микрофона */}
      <div className="test-section">
        <h3>🎤 Тест микрофона с D-ID</h3>
        
        <div className="microphone-controls">
          <button
            onClick={testMicrophoneUpload}
            disabled={isProcessing || isRecording}
            className="test-button"
          >
            {isRecording ? '⏹️ Остановить запись' : '🎤 Начать запись'}
          </button>
          
          {isRecording && (
            <button
              onClick={stopTalkMic}
              className="stop-button"
            >
              ⏹️ Остановить
            </button>
          )}
        </div>

        {/* Статистика записи */}
        {isRecording && (
          <div className="recording-stats">
            <h4>📊 Статистика записи:</h4>
            <div className="stats-grid">
              <div>Всего чанков: {streamStats.totalChunks}</div>
              <div>Отправлено: {streamStats.sentChunks}</div>
              <div>Обработано: {streamStats.processedChunks}</div>
              <div>Загружено файлов: {streamStats.uploadedFiles}</div>
              <div>Речь обнаружена: {streamStats.speechDetected}</div>
              <div>Тишина: {streamStats.silenceDetected}</div>
            </div>
          </div>
        )}

        {/* Очередь D-ID */}
        {didUploadQueue.length > 0 && (
          <div className="did-queue">
            <h4>📋 Очередь D-ID ({didUploadQueue.length} файлов):</h4>
            <div className="queue-list">
              {didUploadQueue.map((file, index) => (
                <div key={file.id} className="queue-item">
                  <span>#{index + 1}</span>
                  <span>{file.url.split('/').pop()}</span>
                  <span>{file.provider}</span>
                  <span>{file.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Загруженные файлы */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h4>📁 Загруженные файлы ({uploadedFiles.length}):</h4>
            <div className="files-list">
              {uploadedFiles.map((file, index) => (
                <div key={file.id} className="file-item">
                  <span>#{uploadedFiles.length - index}</span>
                  <span>{file.url.split('/').pop()}</span>
                  <span>{file.provider}</span>
                  <span>{file.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Логи */}
      <div className="test-section">
        <h3>📝 Логи</h3>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className={`log-entry log-${log.type}`}>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ошибки */}
      {(error || micError) && (
        <div className="error-section">
          <h3>❌ Ошибки</h3>
          <div className="error-message">
            {error && <p>Ошибка загрузки: {error}</p>}
            {micError && <p>Ошибка микрофона: {micError}</p>}
          </div>
        </div>
      )}

      {/* Управление */}
      <div className="test-section">
        <h3>⚙️ Управление</h3>
        <button onClick={handleClearState} className="clear-button">
          🗑️ Очистить состояние
        </button>
      </div>

      <style jsx>{`
        .did-audio-upload-tester {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .test-section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .test-section h3 {
          margin-top: 0;
          color: #333;
        }

        .file-upload {
          margin-bottom: 15px;
        }

        .file-info {
          margin-top: 10px;
          padding: 10px;
          background: #e8f4fd;
          border-radius: 4px;
        }

        .test-button, .stop-button, .clear-button {
          padding: 10px 20px;
          margin: 5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .test-button {
          background: #007bff;
          color: white;
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .stop-button {
          background: #dc3545;
          color: white;
        }

        .clear-button {
          background: #6c757d;
          color: white;
        }

        .upload-result {
          margin-top: 15px;
          padding: 15px;
          background: #d4edda;
          border-radius: 4px;
        }

        .upload-result pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }

        .recording-stats {
          margin-top: 15px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .stats-grid > div {
          padding: 8px;
          background: #e8f4fd;
          border-radius: 4px;
          text-align: center;
        }

        .did-queue, .uploaded-files {
          margin-top: 15px;
        }

        .queue-list, .files-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .queue-item, .file-item {
          display: grid;
          grid-template-columns: 50px 1fr 100px 100px;
          gap: 10px;
          padding: 8px;
          border-bottom: 1px solid #eee;
          font-size: 12px;
        }

        .queue-item:last-child, .file-item:last-child {
          border-bottom: none;
        }

        .logs-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f8f9fa;
        }

        .log-entry {
          padding: 5px 10px;
          border-bottom: 1px solid #eee;
          font-family: monospace;
          font-size: 12px;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-time {
          color: #666;
          margin-right: 10px;
        }

        .log-info {
          color: #333;
        }

        .log-success {
          color: #28a745;
        }

        .log-warning {
          color: #ffc107;
        }

        .log-error {
          color: #dc3545;
        }

        .error-section {
          margin-top: 20px;
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }

        .error-message {
          color: #721c24;
        }

        .microphone-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};
