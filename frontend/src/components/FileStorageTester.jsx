import React, { useState, useEffect } from 'react';
import { fileService } from '../services/FileService.js';

const FileStorageTester = () => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);

  const addTestResult = (testName, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: crypto.randomUUID(),
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testConnection = async () => {
    setIsTesting(true);
    addTestResult('Подключение', 'info', 'Тестирование подключения к сервисам...');
    
    try {
      const result = await fileService.testConnection();
      
      if (result.success) {
        addTestResult('Подключение', 'success', 'Подключение успешно', result);
        setConnectionInfo(result);
      } else {
        addTestResult('Подключение', 'error', `Ошибка подключения: ${result.error}`, result);
      }
    } catch (error) {
      addTestResult('Подключение', 'error', `Ошибка: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testProvidersInfo = () => {
    addTestResult('Информация о провайдерах', 'info', 'Получение информации о провайдерах...');
    
    try {
      const providersInfo = fileService.getProvidersInfo();
      addTestResult('Информация о провайдерах', 'success', 'Информация получена', providersInfo);
    } catch (error) {
      addTestResult('Информация о провайдерах', 'error', `Ошибка: ${error.message}`);
    }
  };

  const testCurrentAvatar = async () => {
    addTestResult('Текущий аватар', 'info', 'Получение информации о текущем аватаре...');
    
    try {
      const avatarInfo = await fileService.getCurrentAvatar();
      
      if (avatarInfo && avatarInfo.success) {
        addTestResult('Текущий аватар', 'success', 'Аватар найден', avatarInfo.data);
        setCurrentAvatar(avatarInfo.data);
      } else {
        addTestResult('Текущий аватар', 'warning', 'Аватар не найден');
        setCurrentAvatar(null);
      }
    } catch (error) {
      addTestResult('Текущий аватар', 'error', `Ошибка: ${error.message}`);
    }
  };

  const testImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addTestResult('Загрузка изображения', 'info', `Загрузка файла: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    try {
      const result = await fileService.uploadImage(file);
      
      if (result.success) {
        addTestResult('Загрузка изображения', 'success', 'Изображение загружено успешно', result.data);
        
        // Обновляем информацию о текущем аватаре
        setTimeout(() => {
          testCurrentAvatar();
        }, 1000);
      } else {
        addTestResult('Загрузка изображения', 'error', 'Ошибка загрузки изображения', result);
      }
    } catch (error) {
      addTestResult('Загрузка изображения', 'error', `Ошибка: ${error.message}`);
    }
  };

  const testAudioUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addTestResult('Загрузка аудио', 'info', `Загрузка файла: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    try {
      const result = await fileService.uploadAudio(file);
      
      if (result.success) {
        addTestResult('Загрузка аудио', 'success', 'Аудио загружено успешно (будет автоматически удалено через 10 секунд)', result.data);
      } else {
        addTestResult('Загрузка аудио', 'error', 'Ошибка загрузки аудио', result);
      }
    } catch (error) {
      addTestResult('Загрузка аудио', 'error', `Ошибка: ${error.message}`);
    }
  };

  const testFileValidation = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addTestResult('Валидация файла', 'info', `Валидация файла: ${file.name}`);
    
    try {
      const validation = fileService.validateFile(file);
      
      if (validation.valid) {
        addTestResult('Валидация файла', 'success', 'Файл прошел валидацию', validation);
      } else {
        addTestResult('Валидация файла', 'error', `Ошибки валидации: ${validation.errors.join(', ')}`, validation);
      }
    } catch (error) {
      addTestResult('Валидация файла', 'error', `Ошибка валидации: ${error.message}`);
    }
  };

  useEffect(() => {
    // Автоматически тестируем подключение при загрузке компонента
    testConnection();
    testProvidersInfo();
    testCurrentAvatar();
  }, []);

  return (
    <div className="file-storage-tester">
      <h3>Тестирование системы файлового хранилища</h3>
      
      {/* Информация о подключении */}
      {connectionInfo && (
        <div className="connection-info">
          <h4>Информация о подключении</h4>
          <p><strong>Окружение:</strong> {connectionInfo.environment}</p>
          <p><strong>Провайдер:</strong> {connectionInfo.provider}</p>
          <p><strong>Бэкенд:</strong> {connectionInfo.backend ? '✅ Подключен' : '❌ Не подключен'}</p>
        </div>
      )}

      {/* Текущий аватар */}
      {currentAvatar && (
        <div className="current-avatar">
          <h4>Текущий аватар</h4>
          <img src={currentAvatar.url} alt="Current avatar" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          <p><strong>Файл:</strong> {currentAvatar.filename}</p>
          <p><strong>Размер:</strong> {(currentAvatar.size / 1024).toFixed(1)} KB</p>
          <p><strong>Тип:</strong> {currentAvatar.content_type}</p>
        </div>
      )}

      {/* Кнопки тестирования */}
      <div className="test-controls">
        <h4>Тестирование</h4>
        
        <div className="test-buttons">
          <button onClick={testConnection} disabled={isTesting}>
            {isTesting ? 'Тестирование...' : 'Тест подключения'}
          </button>
          
          <button onClick={testProvidersInfo} disabled={isTesting}>
            Информация о провайдерах
          </button>
          
          <button onClick={testCurrentAvatar} disabled={isTesting}>
            Получить текущий аватар
          </button>
          
          <button onClick={clearResults} disabled={isTesting}>
            Очистить результаты
          </button>
        </div>

        <div className="file-uploads">
          <h5>Загрузка файлов</h5>
          
          <div className="upload-section">
            <label>
              Загрузить изображение:
              <input
                type="file"
                accept="image/*"
                onChange={testImageUpload}
                disabled={isTesting}
              />
            </label>
          </div>
          
          <div className="upload-section">
            <label>
              Загрузить аудио:
              <input
                type="file"
                accept="audio/*"
                onChange={testAudioUpload}
                disabled={isTesting}
              />
            </label>
          </div>
          
          <div className="upload-section">
            <label>
              Тест валидации файла:
              <input
                type="file"
                onChange={testFileValidation}
                disabled={isTesting}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Результаты тестов */}
      <div className="test-results">
        <h4>Результаты тестов</h4>
        
        {testResults.length === 0 ? (
          <p>Нет результатов тестирования</p>
        ) : (
          <div className="results-list">
            {testResults.map(result => (
              <div key={result.id} className={`test-result ${result.success}`}>
                <div className="result-header">
                  <span className="test-name">{result.testName}</span>
                  <span className="result-status">
                    {result.success === 'success' && '✅'}
                    {result.success === 'error' && '❌'}
                    {result.success === 'warning' && '⚠️'}
                    {result.success === 'info' && 'ℹ️'}
                  </span>
                  <span className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="result-message">{result.message}</div>
                {result.data && (
                  <details className="result-data">
                    <summary>Данные</summary>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

export default FileStorageTester;
