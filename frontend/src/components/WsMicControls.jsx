import React, { useState } from 'react';
import { useDIdAudioWs } from '../hooks/useDIdAudioWs';
import { useAudioToDidBridge } from '../hooks/useAudioToDidBridge';

const WsMicControls = ({ streamId, sessionId }) => {
  const ws = useDIdAudioWs();
  const bridge = useAudioToDidBridge(ws);
  const [info, setInfo] = useState('');

  const handleConnect = async () => {
    try {
      setInfo('Подключение к WS...');
      await ws.connect();
      setInfo('WS подключен');
    } catch (e) {
      setInfo(`Ошибка: ${e.message}`);
    }
  };

  const handleStart = async () => {
    try {
      setInfo('Старт стрима...');
      await ws.connect();
      await ws.beginExternalStreaming(streamId, sessionId);
      // We will use external chunks (e.g., ElevenLabs). If you prefer mic, call ws.startMicrophoneStreaming
      bridge.start(streamId, sessionId);
      setInfo('Идёт стрим аудио');
    } catch (e) {
      setInfo(`Ошибка: ${e.message}`);
    }
  };

  const handleStop = () => {
    bridge.stop();
    ws.endExternalStreaming?.();
    setInfo('Стрим остановлен');
  };

  const handleDisconnect = () => {
    ws.disconnect();
    setInfo('WS отключен');
  };

  return (
    <div className="section">
      <h2>WS стрим микрофона → D-ID</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleConnect} disabled={ws.isConnected}>Подключить WS</button>
        <button className="btn btn-primary" onClick={handleStart} disabled={!ws.isConnected || ws.isStreaming || !streamId || !sessionId}>Старт стрима</button>
        <button className="btn btn-warning" onClick={handleStop} disabled={!ws.isStreaming}>Стоп</button>
        <button className="btn btn-danger" onClick={handleDisconnect} disabled={!ws.isConnected}>Отключить WS</button>
      </div>
      <div className="text-muted" style={{ marginTop: 6 }}>
        {info || (ws.isConnected ? (ws.isStreaming ? 'Идёт поток' : 'Подключено') : 'Отключено')}
      </div>
      {ws.error && <div className="error" style={{ marginTop: 6 }}>⚠️ {ws.error}</div>}
    </div>
  );
};

export default WsMicControls;


