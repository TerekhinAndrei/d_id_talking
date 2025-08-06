import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (sessionId) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const wsUrl = `ws://localhost:8000/ws/stream-simple`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket подключен');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
        
        if (data.type === 'audio_data') {
          // Обработка аудио данных
          handleAudioData(data.data);
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
      }
    };

    websocket.onerror = (error) => {
      setError('Ошибка WebSocket соединения');
      console.error('WebSocket error:', error);
    };

    websocket.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket отключен:', event.code, event.reason);
      
      // Автоматическое переподключение при неожиданном закрытии
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Попытка переподключения...');
          connect();
        }, 3000);
      }
    };

    setWs(websocket);
  }, [sessionId]);

  const sendMessage = useCallback((message) => {
    if (ws && isConnected) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        setError('Ошибка отправки сообщения');
        return false;
      }
    } else {
      console.warn('WebSocket не подключен');
      return false;
    }
  }, [ws, isConnected]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close(1000, 'Пользователь отключился');
    }
  }, [ws]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const handleAudioData = useCallback((audioData) => {
    // Здесь можно добавить логику для воспроизведения аудио
    console.log('Получены аудио данные:', audioData.substring(0, 50) + '...');
  }, []);

  useEffect(() => {
    if (sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    messages,
    error,
    disconnect,
    clearMessages,
    reconnect: connect
  };
};
