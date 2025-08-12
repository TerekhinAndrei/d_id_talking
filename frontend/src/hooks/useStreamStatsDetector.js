import { useState, useEffect, useRef } from 'react';

export const useStreamStatsDetector = ({ peerConnection }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const statsIntervalRef = useRef(null);
  const lastBytesReceivedRef = useRef(0);
  const isSpeakingRef = useRef(false); // Ref для доступа к актуальному значению isSpeaking

  useEffect(() => {
    // Если peerConnection нет, ничего не делаем
    if (!peerConnection) {
      // Если было состояние "говорит", сбрасываем его
      if (isSpeakingRef.current) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
      return;
    }

    const onTrack = (event) => {
      if (!event.track || event.track.kind !== 'video') return;

      // Очищаем предыдущий интервал, если он был
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }

      statsIntervalRef.current = setInterval(async () => {
        try {
          const stats = await peerConnection.getStats(event.track);
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const currentBytes = report.bytesReceived;
              const lastBytes = lastBytesReceivedRef.current;

              // Если байты приходят, значит, есть активность
              const speaking = currentBytes > lastBytes;

              // Обновляем состояние, только если оно изменилось
              if (speaking !== isSpeakingRef.current) {
                setIsSpeaking(speaking);
                isSpeakingRef.current = speaking;
              }

              lastBytesReceivedRef.current = currentBytes;
            }
          });
        } catch (error) {
          console.error("Ошибка получения статистики WebRTC:", error);
        }
      }, 500); // Проверяем каждые полсекунды
    };

    // Добавляем слушатель события track
    peerConnection.addEventListener('track', onTrack);

    // Проверяем, есть ли уже треки в peerConnection
    const receivers = peerConnection.getReceivers();
    receivers.forEach((receiver) => {
      if (receiver.track) {
        // Если уже есть видео-трек, запускаем мониторинг
        if (receiver.track.kind === 'video') {
          onTrack({ track: receiver.track, streams: [] });
        }
      }
    });

    // Функция очистки при размонтировании компонента или смене peerConnection
    return () => {
      peerConnection.removeEventListener('track', onTrack);
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      // Сбрасываем состояние
      lastBytesReceivedRef.current = 0;
      if (isSpeakingRef.current) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    };
  }, [peerConnection]); // Убираем isSpeaking из зависимостей, чтобы избежать бесконечного цикла

  return { isSpeaking };
};
