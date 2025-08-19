import React, { useState, useEffect } from 'react';
import { DIdAudioUploadTester } from './DIdAudioUploadTester.jsx';
import { ConfigTest } from './ConfigTest.jsx';
import { fileStorageService, StorageProvider, UploadStrategy, UploadOptions } from '../core/index.js';

export const MigrationTester = () => {
  const [systemStatus, setSystemStatus] = useState({
    initialized: false,
    providers: {},
    config: {},
    errors: []
  });

  const [testResults, setTestResults] = useState([]);

  // Инициализация системы
  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      console.log('🔧 Инициализация системы хранения файлов...');
      
      await fileStorageService.initialize();
      
      // Проверяем доступность провайдеров
      const didTest = await fileStorageService.testProvider('d_id');
      const cloudinaryTest = await fileStorageService.testProvider('cloudinary');
      
      setSystemStatus({
        initialized: true,
        providers: {
          d_id: didTest,
          cloudinary: cloudinaryTest
        },
        config: fileStorageService.getConfig(),
        errors: []
      });

      addTestResult('Инициализация системы', 'success', 'Система хранения файлов успешно инициализирована');
      
    } catch (error) {
      console.error('❌ Ошибка инициализации системы:', error);
      setSystemStatus(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
      addTestResult('Инициализация системы', 'error', error.message);
    }
  };

  const addTestResult = (testName, status, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      testName,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testProviderAvailability = async () => {
    try {
      addTestResult('Тест провайдеров', 'pending', 'Проверка доступности провайдеров...');
      
      const providers = ['d_id', 'cloudinary'];
      const results = {};
      
      for (const provider of providers) {
        const test = await fileStorageService.testProvider(provider);
        results[provider] = test;
        
        addTestResult(
          `Провайдер ${provider}`, 
          test.available ? 'success' : 'error',
          test.available ? 'Доступен' : 'Недоступен',
          test
        );
      }
      
      addTestResult('Тест провайдеров', 'success', 'Проверка провайдеров завершена', results);
      
    } catch (error) {
      addTestResult('Тест провайдеров', 'error', error.message);
    }
  };

  const testFallbackMechanism = async () => {
    try {
      addTestResult('Тест fallback', 'pending', 'Тестирование механизма fallback...');
      
      // Создаем тестовый файл
      const testData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // WAV header
      const testFile = new File([testData], 'test.wav', { type: 'audio/wav' });
      
      // Тестируем загрузку с приоритетом D-ID
      const uploadOptions = new UploadOptions({
        provider: StorageProvider.D_ID,
        strategy: UploadStrategy.FALLBACK
      });
      
      const result = await fileStorageService.uploadAudio(testFile, uploadOptions);
      
      addTestResult(
        'Тест fallback', 
        result.success ? 'success' : 'error',
        result.success ? `Файл загружен через ${result.provider}` : 'Ошибка загрузки',
        result
      );
      
    } catch (error) {
      addTestResult('Тест fallback', 'error', error.message);
    }
  };

  const testFileValidation = async () => {
    try {
      addTestResult('Тест валидации', 'pending', 'Тестирование валидации файлов...');
      
      // Тестовые файлы
      const testFiles = [
        { name: 'valid.wav', type: 'audio/wav', size: 1024, valid: true },
        { name: 'invalid.txt', type: 'text/plain', size: 1024, valid: false },
        { name: 'large.wav', type: 'audio/wav', size: 50 * 1024 * 1024, valid: false } // 50MB
      ];
      
      for (const testFile of testFiles) {
        const file = new File(['test'], testFile.name, { type: testFile.type });
        Object.defineProperty(file, 'size', { value: testFile.size });
        
        const validation = fileStorageService.validateFile(file, 'audio');
        
        addTestResult(
          `Валидация ${testFile.name}`,
          validation.valid === testFile.valid ? 'success' : 'error',
          validation.valid ? 'Файл валиден' : `Файл невалиден: ${validation.errors.join(', ')}`,
          validation
        );
      }
      
      addTestResult('Тест валидации', 'success', 'Валидация файлов завершена');
      
    } catch (error) {
      addTestResult('Тест валидации', 'error', error.message);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="migration-tester">
      <h2>🧪 Тестер миграции Cloudinary → D-ID</h2>
      
      {/* Статус системы */}
      <div className="system-status">
        <h3>📊 Статус системы</h3>
        
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Инициализация:</span>
            <span className={`status-value ${systemStatus.initialized ? 'success' : 'error'}`}>
              {systemStatus.initialized ? '✅ Готова' : '❌ Не готова'}
            </span>
          </div>
          
          {systemStatus.providers.d_id && (
            <div className="status-item">
              <span className="status-label">D-ID:</span>
              <span className={`status-value ${systemStatus.providers.d_id.available ? 'success' : 'error'}`}>
                {systemStatus.providers.d_id.available ? '✅ Доступен' : '❌ Недоступен'}
              </span>
            </div>
          )}
          
          {systemStatus.providers.cloudinary && (
            <div className="status-item">
              <span className="status-label">Cloudinary:</span>
              <span className={`status-value ${systemStatus.providers.cloudinary.available ? 'success' : 'error'}`}>
                {systemStatus.providers.cloudinary.available ? '✅ Доступен' : '❌ Недоступен'}
              </span>
            </div>
          )}
        </div>
        
        {systemStatus.errors.length > 0 && (
          <div className="system-errors">
            <h4>❌ Ошибки системы:</h4>
            <ul>
              {systemStatus.errors.map((error, index) => (
                <li key={index} className="error-item">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Тестовые кнопки */}
      <div className="test-controls">
        <h3>🔧 Тесты</h3>
        
        <div className="test-buttons">
          <button 
            onClick={testProviderAvailability}
            className="test-btn"
            disabled={!systemStatus.initialized}
          >
            🔍 Тест провайдеров
          </button>
          
          <button 
            onClick={testFallbackMechanism}
            className="test-btn"
            disabled={!systemStatus.initialized}
          >
            🔄 Тест fallback
          </button>
          
          <button 
            onClick={testFileValidation}
            className="test-btn"
            disabled={!systemStatus.initialized}
          >
            ✅ Тест валидации
          </button>
          
          <button 
            onClick={clearTestResults}
            className="clear-btn"
          >
            🗑️ Очистить результаты
          </button>
        </div>
      </div>

      {/* Результаты тестов */}
      <div className="test-results">
        <h3>📋 Результаты тестов</h3>
        
        <div className="results-list">
          {testResults.map((result) => (
            <div key={result.id} className={`result-item result-${result.status}`}>
              <div className="result-header">
                <span className="result-name">{result.testName}</span>
                <span className="result-time">{result.timestamp}</span>
                <span className={`result-status ${result.status}`}>
                  {result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'pending' ? '⏳' : 'ℹ️'}
                </span>
              </div>
              <div className="result-message">{result.message}</div>
              {result.data && (
                <details className="result-details">
                  <summary>Детали</summary>
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Тестер конфигурации */}
      <div className="config-tester-section">
        <h3>⚙️ Тестер конфигурации</h3>
        <ConfigTest />
      </div>

      {/* Интегрированный тестер аудио */}
      <div className="audio-tester-section">
        <h3>🎤 Тестер аудио загрузки</h3>
        <DIdAudioUploadTester />
      </div>

      <style jsx>{`
        .migration-tester {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .system-status {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 4px;
          border: 1px solid #eee;
        }

        .status-label {
          font-weight: bold;
        }

        .status-value.success {
          color: #28a745;
        }

        .status-value.error {
          color: #dc3545;
        }

        .system-errors {
          margin-top: 15px;
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }

        .error-item {
          color: #721c24;
          margin: 5px 0;
        }

        .test-controls {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .test-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .test-btn, .clear-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .test-btn {
          background: #007bff;
          color: white;
        }

        .test-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .clear-btn {
          background: #6c757d;
          color: white;
        }

        .test-results {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .results-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .result-item {
          margin-bottom: 15px;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .result-success {
          background: #d4edda;
          border-left-color: #28a745;
        }

        .result-error {
          background: #f8d7da;
          border-left-color: #dc3545;
        }

        .result-pending {
          background: #fff3cd;
          border-left-color: #ffc107;
        }

        .result-info {
          background: #d1ecf1;
          border-left-color: #17a2b8;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .result-name {
          font-weight: bold;
        }

        .result-time {
          color: #666;
          font-size: 12px;
        }

        .result-message {
          margin-bottom: 10px;
        }

        .result-details {
          margin-top: 10px;
        }

        .result-details summary {
          cursor: pointer;
          font-weight: bold;
        }

        .result-details pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .audio-tester-section {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }
      `}</style>
    </div>
  );
};
