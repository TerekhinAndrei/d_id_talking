import { useCallback, useMemo, useState } from 'react';
import { useDIdAudioWs } from './useDIdAudioWs';
import { useAudioToDidBridge } from './useAudioToDidBridge';
import { useMicrophoneRecording } from './useMicrophoneRecording';

// High-level bridge: Microphone → ElevenLabs (your WS) → base64 audio chunks → re-encode to webm/opus → D-ID WS stream_audio
export const useElevenLabsDidBridge = () => {
  const ws = useDIdAudioWs();
  const bridge = useAudioToDidBridge(ws);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const mic = useMicrophoneRecording({
    onProcessedChunk: (base64) => {
      try {
        // Forward processed audio (from ElevenLabs) into the re-encoder → D-ID
        bridge.ingestBase64(base64);
      } catch (e) {
        // swallow
      }
    }
  });

  const status = useMemo(() => ({
    wsConnected: ws.isConnected,
    streaming: ws.isStreaming,
    active: isActive,
  }), [ws.isConnected, ws.isStreaming, isActive]);

  const start = useCallback(async ({ streamId, sessionId, voiceId }) => {
    if (!streamId || !sessionId) throw new Error('Missing stream/session');
    if (!voiceId) throw new Error('Missing voice');
    try {
      setError(null);
      
      // ВРЕМЕННО ОТКЛЮЧАЕМ WebSocket D-ID для тестирования
      console.log('🔧 Временно отключен WebSocket D-ID для тестирования записи микрофона');
      
      // Запускаем только запись микрофона
      await mic.startRecording(voiceId);
      setIsActive(true);
      console.log('✅ Запись микрофона запущена (без WebSocket моста)');
      
    } catch (e) {
      setError(e.message);
      console.error('❌ Ошибка запуска записи микрофона:', e);
      throw e;
    }
  }, [mic]);

  const stop = useCallback(() => {
    console.log('🛑 Остановка записи микрофона');
    try { mic.stopRecording(); } catch (e) { console.warn('⚠️ Ошибка остановки микрофона:', e); }
    setIsActive(false);
    console.log('✅ Запись микрофона остановлена');
  }, [mic]);

  return { start, stop, status, error };
};


