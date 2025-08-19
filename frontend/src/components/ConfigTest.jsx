import React, { useState, useEffect } from 'react';
import configManager from '../config/ConfigManager.js';

export const ConfigTest = () => {
  const [configStatus, setConfigStatus] = useState({
    initialized: false,
    testResults: [],
    errors: []
  });

  useEffect(() => {
    testConfigManager();
  }, []);

  const testConfigManager = () => {
    const results = [];
    const errors = [];

    try {
      // Тестируем основные методы
      console.log('🧪 Тестирование ConfigManager...');

      // Тест метода get
      const cloudinaryEnabled = configManager.get('storage.cloudinary.enabled', true);
      results.push(`✅ storage.cloudinary.enabled: ${cloudinaryEnabled}`);

      const didEnabled = configManager.get('storage.d_id.enabled', true);
      results.push(`✅ storage.d_id.enabled: ${didEnabled}`);

      const defaultProvider = configManager.get('storage.defaultProvider', 'd_id');
      results.push(`✅ storage.defaultProvider: ${defaultProvider}`);

      // Тест API ключей
      const didApiKey = configManager.get('storage.d_id.apiKey', '');
      results.push(`✅ D-ID API Key: ${didApiKey ? '✅ Установлен' : '❌ Отсутствует'}`);

      const cloudinaryApiKey = configManager.get('storage.cloudinary.apiKey', '');
      results.push(`✅ Cloudinary API Key: ${cloudinaryApiKey ? '✅ Установлен' : '❌ Отсутствует'}`);

      // Тест переменных окружения
      const envDidKey = import.meta.env.VITE_D_ID_API_KEY;
      results.push(`✅ VITE_D_ID_API_KEY: ${envDidKey ? '✅ Установлен' : '❌ Отсутствует'}`);

      const envCloudinaryKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      results.push(`✅ VITE_CLOUDINARY_API_KEY: ${envCloudinaryKey ? '✅ Установлен' : '❌ Отсутствует'}`);

      // Проверка общей конфигурации
      const storageConfig = configManager.getStorageConfig();
      const availableProviders = Object.keys(storageConfig).filter(key => 
        key.includes('enabled') && storageConfig[key] === true
      ).length;
      results.push(`✅ Доступных провайдеров: ${availableProviders}`);

      // Тест метода set
      configManager.set('storage.test.key', 'test_value');
      const testValue = configManager.get('storage.test.key', 'default');
      results.push(`✅ storage.test.key: ${testValue}`);

      // Тест getStorageConfig
      const storageConfig = configManager.getStorageConfig();
      results.push(`✅ getStorageConfig() возвращает объект с ${Object.keys(storageConfig).length} ключами`);

      // Тест основных URL
      const backendUrl = configManager.getBackendUrl();
      results.push(`✅ Backend URL: ${backendUrl}`);

      const frontendUrl = configManager.getFrontendUrl();
      results.push(`✅ Frontend URL: ${frontendUrl}`);

      const wsUrl = configManager.getWebSocketUrl('/ws/stream');
      results.push(`✅ WebSocket URL: ${wsUrl}`);

      setConfigStatus({
        initialized: true,
        testResults: results,
        errors: errors
      });

    } catch (error) {
      console.error('❌ Ошибка тестирования ConfigManager:', error);
      errors.push(error.message);
      setConfigStatus({
        initialized: false,
        testResults: results,
        errors: errors
      });
    }
  };

  const clearTestConfig = () => {
    localStorage.removeItem('config.storage.test.key');
    testConfigManager();
  };

  return (
    <div className="config-test">
      <h2>🧪 Тест ConfigManager</h2>
      
      <div className="test-status">
        <h3>📊 Статус тестирования</h3>
        <div className={`status-indicator ${configStatus.initialized ? 'success' : 'error'}`}>
          {configStatus.initialized ? '✅ Инициализирован' : '❌ Ошибка инициализации'}
        </div>
      </div>

      {configStatus.testResults.length > 0 && (
        <div className="test-results">
          <h3>✅ Результаты тестов</h3>
          <ul>
            {configStatus.testResults.map((result, index) => (
              <li key={index} className="test-result">{result}</li>
            ))}
          </ul>
        </div>
      )}

      {configStatus.errors.length > 0 && (
        <div className="test-errors">
          <h3>❌ Ошибки</h3>
          <ul>
            {configStatus.errors.map((error, index) => (
              <li key={index} className="test-error">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="test-controls">
        <button onClick={testConfigManager} className="test-btn">
          🔄 Повторить тест
        </button>
        <button onClick={clearTestConfig} className="clear-btn">
          🗑️ Очистить тестовую конфигурацию
        </button>
      </div>

      {/* Инструкции по настройке */}
      <div className="setup-instructions">
        <h3>📋 Инструкции по настройке</h3>
        <div className="instructions-content">
          <h4>Для работы с D-ID:</h4>
          <ol>
            <li>Создайте файл <code>.env</code> в папке <code>frontend/</code></li>
            <li>Добавьте переменную: <code>VITE_D_ID_API_KEY=your-d-id-api-key</code></li>
            <li>Перезапустите сервер разработки</li>
          </ol>
          
          <h4>Для работы с Cloudinary:</h4>
          <ol>
            <li>Добавьте в <code>.env</code>: <code>VITE_CLOUDINARY_API_KEY=your-cloudinary-api-key</code></li>
            <li>Добавьте в <code>.env</code>: <code>VITE_CLOUDINARY_API_SECRET=your-cloudinary-api-secret</code></li>
            <li>Перезапустите сервер разработки</li>
          </ol>
          
          <h4>Пример .env файла:</h4>
          <pre>
{`# D-ID API Settings
VITE_D_ID_API_KEY=your-d-id-api-key-here

# Cloudinary Configuration
VITE_CLOUDINARY_API_KEY=your-cloudinary-api-key-here
VITE_CLOUDINARY_API_SECRET=your-cloudinary-api-secret-here

# Storage Configuration
VITE_STORAGE_DEFAULT_PROVIDER=d_id
VITE_STORAGE_D_ID_ENABLED=true
VITE_STORAGE_CLOUDINARY_ENABLED=true`}
          </pre>
        </div>
      </div>

      <style jsx>{`
        .config-test {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .test-status {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .status-indicator {
          padding: 10px;
          border-radius: 4px;
          font-weight: bold;
        }

        .status-indicator.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-indicator.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .test-results, .test-errors {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .test-results {
          border-left: 4px solid #28a745;
        }

        .test-errors {
          border-left: 4px solid #dc3545;
        }

        .test-result {
          color: #155724;
          margin: 5px 0;
        }

        .test-error {
          color: #721c24;
          margin: 5px 0;
        }

        .test-controls {
          display: flex;
          gap: 10px;
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

        .clear-btn {
          background: #6c757d;
          color: white;
        }

        .setup-instructions {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .instructions-content h4 {
          margin-top: 20px;
          margin-bottom: 10px;
          color: #333;
        }

        .instructions-content ol {
          margin-left: 20px;
          margin-bottom: 20px;
        }

        .instructions-content li {
          margin: 5px 0;
          color: #555;
        }

        .instructions-content code {
          background: #f1f1f1;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          color: #e83e8c;
        }

        .instructions-content pre {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          border: 1px solid #e9ecef;
        }
      `}</style>
    </div>
  );
};
