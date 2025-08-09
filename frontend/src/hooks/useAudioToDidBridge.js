import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioReencoder } from '../services/audio/AudioReencoder';

// Bridge: take arbitrary base64 audio (mp3/wav/ogg), decode to PCM, re-encode to webm/opus via MediaRecorder, and send to D-ID WS
export const useAudioToDidBridge = (wsAudio) => {
  const reencoderRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const ensureReencoder = useCallback(() => {
    if (!reencoderRef.current) reencoderRef.current = new AudioReencoder();
  }, []);

  const start = useCallback(async (streamId, sessionId) => {
    await wsAudio?.connect?.();
    wsAudio?.beginExternalStreaming?.(streamId, sessionId);
    ensureReencoder();
    reencoderRef.current.start((b64) => {
      try { wsAudio?.sendExternalChunk?.(b64); } catch (_) {}
    });
    setIsActive(true);
  }, [ensureReencoder, wsAudio]);

  const ingestBase64 = useCallback(async (audioBase64) => {
    if (!isActive) return;
    ensureReencoder();
    try { await reencoderRef.current.ingestBase64(audioBase64); } catch (_) {}
  }, [ensureReencoder, isActive]);

  const stop = useCallback(() => {
    try { reencoderRef.current?.stop(); } catch (_) {}
    setIsActive(false);
  }, []);

  useEffect(() => () => {
    try { reencoderRef.current?.dispose?.(); } catch (_) {}
    reencoderRef.current = null;
  }, []);

  return { isActive, start, ingestBase64, stop };
};


