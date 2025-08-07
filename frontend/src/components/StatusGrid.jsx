import React from 'react';
import ElevenLabsStatus from './ElevenLabsStatus';

const StatusGrid = () => {
  return (
    <div className="status-grid">
      <div className="grid grid-2">
        <div className="section">
          <h3>Backend API</h3>
          <p>REST API для управления стримами, WebRTC соединениями и TTS интеграцией.</p>
          <div className="flex gap-2 mt-3">
            <span className="status status-success">Готов</span>
          </div>
        </div>

        <div className="section">
          <h3>Frontend Interface</h3>
          <p>Современный пользовательский интерфейс для управления стримами.</p>
          <div className="flex gap-2 mt-3">
            <span className="status status-info">В разработке</span>
          </div>
        </div>
      </div>

      {/* ElevenLabs Status Section */}
      <div className="section">
        <ElevenLabsStatus />
      </div>
    </div>
  );
};

export default StatusGrid;
