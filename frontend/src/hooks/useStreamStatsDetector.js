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

      console.log('🎬 Обнаружен видео-трек. Запускаем мониторинг статистики.');
      console.log('🎬 Track details:', {
        trackId: event.track.id,
        trackKind: event.track.kind,
        trackEnabled: event.track.enabled,
        trackReadyState: event.track.readyState,
        streamsCount: event.streams.length
      });

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

              // Подробное логирование байтов
              console.log('📊 WebRTC Stats Check:', {
                currentBytes,
                lastBytes,
                bytesDifference: currentBytes - lastBytes,
                isReceivingData: currentBytes > lastBytes,
                currentTime: new Date().toLocaleTimeString()
              });

              // Если байты приходят, значит, есть активность
              const speaking = currentBytes > lastBytes;

              // Обновляем состояние, только если оно изменилось
              if (speaking !== isSpeakingRef.current) {
                console.log('🎯 isSpeaking changed:', {
                  from: isSpeakingRef.current,
                  to: speaking,
                  reason: speaking ? 'Receiving bytes' : 'No bytes received',
                  currentTime: new Date().toLocaleTimeString()
                });
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
    console.log('🎯 Adding track event listener to peerConnection');
    peerConnection.addEventListener('track', onTrack);

    // Проверяем, есть ли уже треки в peerConnection
    const receivers = peerConnection.getReceivers();
    console.log('🎯 Current receivers in peerConnection:', receivers.length);
    receivers.forEach((receiver, index) => {
      if (receiver.track) {
        console.log(`🎯 Receiver ${index}:`, {
          trackId: receiver.track.id,
          trackKind: receiver.track.kind,
          trackEnabled: receiver.track.enabled,
          trackReadyState: receiver.track.readyState
        });
        // Если уже есть видео-трек, запускаем мониторинг
        if (receiver.track.kind === 'video') {
          console.log('🎯 Found existing video track, starting monitoring');
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
      console.log('🧹 Cleaning up useStreamStatsDetector');
      lastBytesReceivedRef.current = 0;
      if (isSpeakingRef.current) {
        console.log('🔄 Resetting isSpeaking to false during cleanup');
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    };
  }, [peerConnection]); // Убираем isSpeaking из зависимостей, чтобы избежать бесконечного цикла

  return { isSpeaking };
};
