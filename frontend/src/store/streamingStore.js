import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiService } from '../services/api';
import { DidWebRtcSession } from '../services/webrtc/DidWebRtcSession';

// Store для управления D-ID streaming
export const useStreamingStore = create(
  devtools(
    (set, get) => ({
      // === СОСТОЯНИЕ ===
      
      // Основное состояние стрима
      streamId: null,
      sessionId: null,
      sdpOffer: null,
      iceServers: null,
      
      // WebRTC состояние
      peerConnection: null,
      audioStream: null,
      videoStream: null,
      
      // Статус соединения
      isCreating: false,
      isConnected: false,
      isActive: false,
      status: 'idle', // 'idle' | 'creating' | 'connecting' | 'connected' | 'error'
      
      // Ошибки
      error: null,
      
      // Ссылка на WebRTC сессию
      sessionRef: null,
      
      // === ДЕЙСТВИЯ ===
      
      // Создание стрима
      createStream: async (imageUrl) => {
        set({ isCreating: true, status: 'creating', error: null });
        
        try {
          console.log('🎬 Creating D-ID stream with image:', imageUrl);
          
          const response = await apiService.createStream(imageUrl);
          
          if (response.success) {
            console.log('✅ Stream created successfully:', {
              streamId: response.stream_id,
              sessionId: response.session_id,
              hasSdpOffer: !!response.sdp_offer,
              hasIceServers: !!response.ice_servers
            });
            
            set({
              streamId: response.stream_id,
              sessionId: response.session_id,
              sdpOffer: response.sdp_offer,
              iceServers: response.ice_servers,
              status: 'created',
              isCreating: false
            });
            
            return {
              success: true,
              streamId: response.stream_id,
              sessionId: response.session_id,
              sdpOffer: response.sdp_offer,
              iceServers: response.ice_servers
            };
          } else {
            throw new Error(response.error || 'Failed to create stream');
          }
        } catch (error) {
          console.error('❌ Error creating stream:', error);
          set({
            error: error.message,
            status: 'error',
            isCreating: false
          });
          throw error;
        }
      },
      
      // Запуск стрима
      startStream: async (streamId, sessionId, sdpOffer, iceServers) => {
        const currentStreamId = streamId || get().streamId;
        const currentSessionId = sessionId || get().sessionId;
        const currentSdpOffer = sdpOffer || get().sdpOffer;
        const currentIceServers = iceServers || get().iceServers;

        if (!currentStreamId || !currentSessionId || !currentSdpOffer || !currentIceServers) {
          throw new Error('Missing required stream data');
        }

        console.log('🔗 Starting D-ID stream with WebRTC setup');
        set({ status: 'connecting', error: null });
        
        try {
          // Создаем WebRTC сессию
          const session = new DidWebRtcSession(currentIceServers, {
            onIceCandidate: (candidate) => {
              console.log('🧊 ICE candidate generated');
              get().submitIceCandidate(candidate, currentStreamId, currentSessionId);
            },
            onIceConnectionStateChange: (state) => {
              console.log('🔗 ICE connection state:', state);
              if (state === 'connected') {
                console.log('✅ WebRTC connection established!');
                set({ isConnected: true, isActive: true, status: 'connected' });
              }
            },
            onTrack: (event) => {
              console.log('🎬 Received track:', { 
                kind: event.track.kind, 
                id: event.track.id, 
                streams: event.streams.length 
              });
              if (event.streams[0]) {
                set({ videoStream: event.streams[0] });
              }
            }
          });

          const pc = session.createPeerConnection();

          // Добавляем аудио трек (опционально)
          let audioStream = null;
          try {
            audioStream = await get().addAudioTrack(pc);
          } catch (audioError) {
            console.warn('⚠️ Could not add audio track:', audioError);
          }

          // Применяем remote offer и создаем local answer
          await session.setRemoteOffer(currentSdpOffer);
          const answer = await session.createAnswerAndSetLocal();

          console.log('📝 SDP answer created');

          // Отправляем SDP answer
          const response = await apiService.startDIdStream(currentStreamId, currentSessionId, answer.sdp);
          
          if (response.success) {
            console.log('✅ Stream started successfully');
            
            set({
              streamId: currentStreamId,
              sessionId: response.session_id || currentSessionId,
              status: 'connected',
              isConnected: true,
              isActive: true,
              peerConnection: pc,
              audioStream,
              sessionRef: session
            });

            return { success: true, sessionId: response.session_id };
          } else {
            throw new Error(response.message || 'Failed to start stream');
          }
        } catch (error) {
          console.error('❌ Error starting stream:', error);
          set({
            error: error.message,
            status: 'error'
          });
          throw error;
        }
      },
      
      // Добавление аудио трека
      addAudioTrack: async (peerConnection) => {
        try {
          console.log('🎤 Getting microphone access...');
          
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            } 
          });
          
          console.log('✅ Microphone access granted');
          
          const audioTrack = audioStream.getAudioTracks()[0];
          peerConnection.addTrack(audioTrack, audioStream);
          console.log('✅ Audio track added to peer connection');
          
          return audioStream;
        } catch (error) {
          console.error('❌ Error getting microphone access:', error);
          throw error;
        }
      },
      
      // Отправка ICE кандидата
      submitIceCandidate: async (candidate, streamId, sessionId) => {
        try {
          console.log('🎬 Submitting ICE candidate');
          
          if (!streamId || !sessionId) {
            console.error('❌ Missing streamId or sessionId for ICE candidate');
            return;
          }
          
          const response = await apiService.submitDIdIceCandidate(
            streamId,
            sessionId,
            candidate.candidate,
            candidate.sdpMid,
            candidate.sdpMLineIndex
          );

          if (response.success) {
            console.log('✅ ICE candidate submitted');
          } else {
            console.error('❌ Failed to submit ICE candidate:', response.error);
          }
        } catch (error) {
          console.error('❌ Error submitting ICE candidate:', error);
        }
      },
      
      // Создание talk
      createTalk: async (streamId, sessionId, voice) => {
        try {
          console.log('🎤 Creating talk stream...');
          
          if (!streamId || !sessionId) {
            throw new Error('Missing stream data');
          }
          
          if (!voice) {
            throw new Error('Missing voice data');
          }

          const script = {
            type: "text",
            input: "Hello! This is a test message from D-ID streaming.",
            provider: {
              type: "elevenlabs",
              voice_id: voice.voice_id || voice.id || voice
            }
          };

          const response = await apiService.createDIdTalk(streamId, sessionId, script);

          if (response.success) {
            console.log('✅ Talk stream created successfully!');
            return { success: true };
          } else {
            throw new Error(response.error || 'Failed to create talk');
          }
        } catch (error) {
          console.error('❌ Error creating talk stream:', error);
          return { success: false, error: error.message };
        }
      },
      
      // Закрытие стрима
      closeStream: async () => {
        const { streamId, sessionId, sessionRef, audioStream } = get();
        
        if (!streamId || !sessionId) {
          console.log('⚠️ No active stream to close');
          return;
        }
        
        try {
          console.log('🔚 Closing D-ID stream');
          
          // Останавливаем аудио трек
          if (audioStream) {
            console.log('🔇 Stopping audio track...');
            const tracks = audioStream.getTracks();
            tracks.forEach(track => {
              track.stop();
              console.log('🔇 Audio track stopped:', track);
            });
          }
          
          // Закрываем peer connection
          if (sessionRef) {
            console.log('🔌 Closing peer connection...');
            sessionRef.close();
          } else if (get().peerConnection) {
            try { get().peerConnection.close(); } catch (_) {}
          }
          
          const response = await apiService.closeStream(streamId, sessionId);
          
          if (response.success) {
            console.log('✅ Stream closed successfully');
          } else {
            console.warn('⚠️ Stream close response:', response);
          }
        } catch (error) {
          console.error('❌ Error closing stream:', error);
        } finally {
          // Сбрасываем состояние
          set({
            streamId: null,
            sessionId: null,
            sdpOffer: null,
            iceServers: null,
            peerConnection: null,
            audioStream: null,
            videoStream: null,
            isCreating: false,
            isConnected: false,
            isActive: false,
            status: 'idle',
            error: null,
            sessionRef: null
          });
        }
      },
      
      // Сброс состояния
      reset: () => {
        const { audioStream, sessionRef } = get();
        
        // Останавливаем аудио трек
        if (audioStream) {
          const tracks = audioStream.getTracks();
          tracks.forEach(track => track.stop());
        }
        
        // Закрываем сессию
        if (sessionRef) {
          sessionRef.close();
        }
        
        set({
          streamId: null,
          sessionId: null,
          sdpOffer: null,
          iceServers: null,
          peerConnection: null,
          audioStream: null,
          videoStream: null,
          isCreating: false,
          isConnected: false,
          isActive: false,
          status: 'idle',
          error: null,
          sessionRef: null
        });
      }
    }),
    {
      name: 'streaming-store'
    }
  )
);
