import React, { useState } from 'react';
import { apiService } from '../services/api';

const ManualTalkControls = ({ streamId, sessionId, voiceId }) => {
  const [text, setText] = useState('Привет! Проверка ручного воспроизведения.');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');

  const handleSpeak = async () => {
    try {
      setIsSending(true);
      setError(null);
      setInfo('Отправка talk...');
      if (!streamId || !sessionId) throw new Error('Нет активного стрима');
      const script = {
        type: 'text',
        input: text,
        provider: { type: 'elevenlabs', voice_id: voiceId }
      };
      const resp = await apiService.createDIdTalk(streamId, sessionId, script);
      if (!resp?.success) throw new Error(resp?.error || 'Не удалось создать talk');
      setInfo('Готово: talk создан');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="section">
      <h2>Произнести текст (Create Talk)</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} style={{ width: '100%', padding: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className={`btn btn-primary ${isSending ? 'creating' : ''}`} disabled={isSending || !streamId || !sessionId} onClick={handleSpeak}>
          {isSending ? 'Отправка...' : 'Произнести'}
        </button>
      </div>
      {info && <div className="text-muted" style={{ marginTop: 6 }}>{info}</div>}
      {error && <div className="error" style={{ marginTop: 6 }}>⚠️ {error}</div>}
    </div>
  );
};

export default ManualTalkControls;


