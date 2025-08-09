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
      await ws.connect();
      await ws.beginExternalStreaming(streamId, sessionId);
      await bridge.start(streamId, sessionId);
      await mic.startRecording(voiceId);
      setIsActive(true);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, [ws, bridge, mic]);

  const stop = useCallback(() => {
    try { mic.stopRecording(); } catch (_) {}
    try { bridge.stop(); } catch (_) {}
    try { ws.endExternalStreaming?.(); } catch (_) {}
    setIsActive(false);
  }, [mic, bridge, ws]);

  return { start, stop, status, error };
};


