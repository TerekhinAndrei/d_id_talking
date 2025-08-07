import React from 'react';

const Features = () => {
  return (
    <div className="section">
      <h2>Возможности</h2>
      <div className="grid grid-3">
        <div>
          <h3>🎥 Видео Стримы</h3>
          <p>Создание и управление интерактивными видео-стримами в реальном времени.</p>
        </div>
        <div>
          <h3>🗣️ TTS Интеграция</h3>
          <p>Поддержка различных TTS провайдеров (ElevenLabs, Microsoft, Google).</p>
        </div>
        <div>
          <h3>🌐 WebRTC</h3>
          <p>Прямое соединение для передачи медиа данных с минимальной задержкой.</p>
        </div>
      </div>
    </div>
  );
};

export default Features;
