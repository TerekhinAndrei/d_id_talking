import React, { useState } from 'react';
import { useElevenLabsDidBridge } from '../hooks/useElevenLabsDidBridge';

const DidAudioBridgeControls = ({ streamId, sessionId, voiceId }) => {
  const bridge = useElevenLabsDidBridge();
  const [info, setInfo] = useState('');

  const handleStart = async () => {
    try {
      setInfo('Старт моста...');
      await bridge.start({ streamId, sessionId, voiceId });
      setInfo('Мост активен: ElevenLabs → D-ID');
    } catch (e) {
      setInfo(`Ошибка: ${e.message}`);
    }
  };

  const handleStop = () => {
    bridge.stop();
    setInfo('Мост остановлен');
  };

  return (
    <div className="section">
      <h2>Мост ElevenLabs → D-ID</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleStart} disabled={!streamId || !sessionId || !voiceId || bridge.status.active}>Старт моста</button>
        <button className="btn btn-warning" onClick={handleStop} disabled={!bridge.status.active}>Стоп моста</button>
      </div>
      <div className="text-muted" style={{ marginTop: 6 }}>
        {info || (bridge.status.active ? 'Активен' : 'Отключен')}
      </div>
      {bridge.error && <div className="error" style={{ marginTop: 6 }}>⚠️ {bridge.error}</div>}
    </div>
  );
};

export default DidAudioBridgeControls;


