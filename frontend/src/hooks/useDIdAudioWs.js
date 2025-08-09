import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIdAudioClient } from '../services/audio/DIdAudioClient';

// WebSocket audio streaming to D-ID via backend proxy
export const useDIdAudioWs = () => {
  const clientRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    try {
      if (!clientRef.current) clientRef.current = new DIdAudioClient((url) => new WebSocket(url));
      const loc = window.location;
      const scheme = loc.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${scheme}://${loc.host}/ws/did/streams`;
      await clientRef.current.connect(url);
      setIsConnected(true);
      return clientRef.current;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const startMicrophoneStreaming = useCallback(async (streamId, sessionId) => {
    try {
      if (!clientRef.current || !clientRef.current.isConnected) {
        throw new Error('WebSocket not connected');
      }
      if (!streamId || !sessionId) throw new Error('Missing stream/session');

      clientRef.current.begin(streamId, sessionId);

      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      const mr = new MediaRecorder(mic, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = async (e) => {
        if (e.data.size > 0 && clientRef.current?.isConnected) await clientRef.current.sendBlob(e.data);
      };
      mr.start(50);
      setIsStreaming(true);
      return mr;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Begin external streaming (e.g., ElevenLabs chunks)
  const beginExternalStreaming = useCallback((streamId, sessionId) => {
    if (!clientRef.current || !clientRef.current.isConnected) throw new Error('WebSocket not connected');
    clientRef.current.begin(streamId, sessionId);
    setIsStreaming(true);
  }, []);

  // Send a single base64 webm/opus chunk (40–60ms) from external source
  const sendExternalChunk = useCallback((base64Chunk) => {
    if (!clientRef.current || !clientRef.current.isConnected) throw new Error('WebSocket not connected');
    if (!base64Chunk || typeof base64Chunk !== 'string') throw new Error('Invalid chunk');
    clientRef.current.sendBase64Chunk(base64Chunk);
  }, []);

  // End external streaming (keeps WS connected)
  const endExternalStreaming = useCallback(() => {
    try { clientRef.current?.end(); } catch (_) {}
    setIsStreaming(false);
  }, []);

  const stopStreaming = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsStreaming(false);
    } catch (_) {}
  }, []);

  const disconnect = useCallback(() => {
    try {
      stopStreaming();
      clientRef.current?.disconnect();
      setIsConnected(false);
    } catch (_) {}
  }, [stopStreaming]);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    isConnected,
    isStreaming,
    error,
    connect,
    startMicrophoneStreaming,
    stopStreaming,
    disconnect,
    beginExternalStreaming,
    sendExternalChunk,
    endExternalStreaming
  };
};


