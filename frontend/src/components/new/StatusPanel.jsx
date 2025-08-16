import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store';
import { useStreamingStore } from '../../store/streamingStore';
import { useVoices } from '../../api/queries';

const StatusPanel = () => {
  // Получаем состояние из stores
  const {
    selectedImage,
    selectedVoice,
    isCreating,
    showElevenLabsTester,
    showDIdStreamingTester
  } = useAppStore();

  const {
    streamId,
    sessionId,
    isConnected,
    isActive,
    status,
    error: streamingError
  } = useStreamingStore();

  const { voices, loadingVoices, voicesError } = useVoices();

  return (
    <motion.div 
      className="status-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>🔄 Статус новой архитектуры</h3>
      
      <div className="status-grid">
        {/* Zustand Store Status */}
        <div className="status-section">
          <h4>📦 Zustand Store</h4>
          <div className="status-item">
            <span className="label">Изображение:</span>
            <span className="value">{selectedImage ? '✅ Выбрано' : '❌ Не выбрано'}</span>
          </div>
          <div className="status-item">
            <span className="label">Голос:</span>
            <span className="value">{selectedVoice ? '✅ Выбран' : '❌ Не выбран'}</span>
          </div>
          <div className="status-item">
            <span className="label">Создание:</span>
            <span className="value">{isCreating ? '⏳ В процессе' : '✅ Готово'}</span>
          </div>
        </div>

        {/* Streaming Status */}
        <div className="status-section">
          <h4>🎬 Streaming</h4>
          <div className="status-item">
            <span className="label">Stream ID:</span>
            <span className="value">{streamId || 'N/A'}</span>
          </div>
          <div className="status-item">
            <span className="label">Session ID:</span>
            <span className="value">
              {sessionId ? 
                sessionId.length > 30 ? 
                  `${sessionId.substring(0, 30)}...` : 
                  sessionId 
                : 'N/A'
              }
            </span>
          </div>
          <div className="status-item">
            <span className="label">Статус:</span>
            <span className="value">{status}</span>
          </div>
          <div className="status-item">
            <span className="label">Подключен:</span>
            <span className="value">{isConnected ? '✅ Да' : '❌ Нет'}</span>
          </div>
          <div className="status-item">
            <span className="label">Активен:</span>
            <span className="value">{isActive ? '✅ Да' : '❌ Нет'}</span>
          </div>
        </div>

        {/* React Query Status */}
        <div className="status-section">
          <h4>🔍 React Query</h4>
          <div className="status-item">
            <span className="label">Голоса:</span>
            <span className="value">
              {loadingVoices ? '⏳ Загрузка...' : 
               voicesError ? '❌ Ошибка' : 
               `✅ ${voices.length} голосов`
              }
            </span>
          </div>
          <div className="status-item">
            <span className="label">Кэш голосов:</span>
            <span className="value">{voices.length > 0 ? '✅ Активен' : '❌ Пуст'}</span>
          </div>
        </div>

        {/* UI Status */}
        <div className="status-section">
          <h4>🎨 UI Состояние</h4>
          <div className="status-item">
            <span className="label">ElevenLabs Tester:</span>
            <span className="value">{showElevenLabsTester ? '👁️ Показан' : '🙈 Скрыт'}</span>
          </div>
          <div className="status-item">
            <span className="label">D-ID Tester:</span>
            <span className="value">{showDIdStreamingTester ? '👁️ Показан' : '🙈 Скрыт'}</span>
          </div>
        </div>
      </div>

      {/* Ошибки */}
      {(streamingError || voicesError) && (
        <motion.div 
          className="error-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h4>❌ Ошибки</h4>
          {streamingError && (
            <div className="error-item">
              <span className="label">Streaming:</span>
              <span className="value">{streamingError}</span>
            </div>
          )}
          {voicesError && (
            <div className="error-item">
              <span className="label">Voices:</span>
              <span className="value">{voicesError}</span>
            </div>
          )}
        </motion.div>
      )}

      <style jsx>{`
        .status-panel {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }

        .status-section {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
        }

        .status-section h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 14px;
          font-weight: 600;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .status-item:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: #6c757d;
        }

        .value {
          font-weight: 600;
          color: #212529;
        }

        .error-section {
          margin-top: 20px;
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
        }

        .error-section h4 {
          margin: 0 0 10px 0;
          color: #721c24;
          font-size: 14px;
          font-weight: 600;
        }

        .error-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .error-item .label {
          font-weight: 500;
          color: #721c24;
        }

        .error-item .value {
          font-weight: 600;
          color: #721c24;
        }
      `}</style>
    </motion.div>
  );
};

export default StatusPanel;
