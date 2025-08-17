import { apiService } from '../api/ApiService';

export interface StreamingStatus {
  step: 'idle' | 'creating' | 'starting' | 'connected' | 'talking' | 'closing' | 'error';
  streamId?: string;
  sessionId?: string;
  sdpOffer?: string;
  iceServers?: any[];
  isConnected: boolean;
  error?: string;
}

export interface VideoStream {
  stream: MediaStream | null;
  url: string | null;
}

class DIdStreamingService {
  private status: StreamingStatus = {
    step: 'idle',
    isConnected: false
  };
  
  private peerConnection: RTCPeerConnection | null = null;
  private videoStream: VideoStream = { stream: null, url: null };
  
  private statusCallbacks: ((status: StreamingStatus) => void)[] = [];
  private videoCallbacks: ((stream: VideoStream) => void)[] = [];

  // Подписка на изменения статуса
  onStatusChange(callback: (status: StreamingStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  // Подписка на изменения видео потока
  onVideoStreamChange(callback: (stream: VideoStream) => void) {
    this.videoCallbacks.push(callback);
    return () => {
      this.videoCallbacks = this.videoCallbacks.filter(cb => cb !== callback);
    };
  }

  // Обновление статуса
  private updateStatus(updates: Partial<StreamingStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  // Обновление видео потока
  private updateVideoStream(stream: MediaStream | null, url: string | null) {
    this.videoStream = { stream, url };
    this.videoCallbacks.forEach(callback => callback(this.videoStream));
  }

  // Создание стрима
  async createStream(imageUrl: string, description: string = 'Stream from frontend'): Promise<boolean> {
    console.log('🔍 DIdStreamingService.createStream called with:', { imageUrl, description });
    
    try {
      this.updateStatus({ step: 'creating', error: undefined });

      console.log('🔍 Calling apiService.createDIdStream...');
      const response = await apiService.createDIdStream(imageUrl, description);
      console.log('🔍 apiService.createDIdStream response:', response);
      
      if (response.success) {
        console.log('🔍 Stream created successfully, updating status...');
        this.updateStatus({
          step: 'creating',
          streamId: response.stream_id,
          sessionId: response.session_id,
          sdpOffer: response.sdp_offer,
          iceServers: response.ice_servers,
          error: undefined
        });
        console.log('🔍 Status updated, returning true');
        return true;
      } else {
        console.log('🔍 Stream creation failed:', response.error);
        this.updateStatus({ step: 'error', error: response.error || 'Failed to create stream' });
        return false;
      }
    } catch (error) {
      console.log('🔍 Stream creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateStatus({ step: 'error', error: errorMessage });
      return false;
    }
  }

  // Запуск стрима (WebRTC setup)
  async startStream(): Promise<boolean> {
    try {
      if (!this.status.streamId || !this.status.sessionId) {
        this.updateStatus({ step: 'error', error: 'Stream not created' });
        return false;
      }

      this.updateStatus({ step: 'starting', error: undefined });

      // Создаем WebRTC соединение
      this.peerConnection = new RTCPeerConnection({ 
        iceServers: this.status.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Настройка обработчиков событий
      this.peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          this.submitIceCandidate(event.candidate);
        }
      });

      this.peerConnection.addEventListener('iceconnectionstatechange', () => {
        if (this.peerConnection?.iceConnectionState === 'connected') {
          this.updateStatus({ step: 'connected', isConnected: true });
        }
      });

      this.peerConnection.addEventListener('track', (event) => {
        if (event.streams[0]) {
          this.updateVideoStream(event.streams[0], null);
        }
      });

      // Устанавливаем remote description (SDP offer из созданного стрима)
      if (!this.status.sdpOffer) {
        this.updateStatus({ step: 'error', error: 'No SDP offer available' });
        return false;
      }

      await this.peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: this.status.sdpOffer
      });

      // Создаем answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Проверяем наличие streamId и sessionId
      if (!this.status.streamId || !this.status.sessionId) {
        this.updateStatus({ step: 'error', error: 'Stream ID or Session ID not available' });
        return false;
      }

      const streamId = this.status.streamId as string;
      const sessionId = this.status.sessionId as string;

      // Отправляем SDP answer
      const sdpResponse = await apiService.startDIdStream(
        streamId,
        sessionId,
        answer.sdp
      );

      if (sdpResponse.success) {
        this.updateStatus({ step: 'connected', isConnected: true });
        return true;
      } else {
        this.updateStatus({ step: 'error', error: sdpResponse.error || 'Failed to start stream' });
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateStatus({ step: 'error', error: errorMessage });
      return false;
    }
  }

  // Отправка ICE candidate
  private async submitIceCandidate(candidate: RTCIceCandidate) {
    try {
      if (!this.status.streamId || !this.status.sessionId) return;

      await apiService.submitDIdIceCandidate(
        this.status.streamId,
        this.status.sessionId,
        candidate.candidate,
        candidate.sdpMid,
        candidate.sdpMLineIndex
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to submit ICE candidate:', errorMessage);
    }
  }

  // Создание talk с текстом
  async createTalkWithText(text: string, voiceId: string = 'en-US-JennyNeural'): Promise<boolean> {
    try {
      if (!this.status.streamId || !this.status.sessionId) {
        this.updateStatus({ step: 'error', error: 'Stream not connected' });
        return false;
      }

      this.updateStatus({ step: 'talking', error: undefined });

      const textScript = {
        type: "text",
        input: text,
        provider: {
          type: "microsoft",
          voice_id: voiceId
        }
      };

      const response = await apiService.createDIdStreamTalk(
        this.status.streamId!,
        this.status.sessionId!,
        textScript
      );

      if (response.success) {
        return true;
      } else {
        this.updateStatus({ step: 'error', error: response.error || 'Failed to create talk' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateStatus({ step: 'error', error: errorMessage });
      return false;
    }
  }

  // Создание talk с аудио файлом
  async createTalkWithAudio(audioUrl: string, voiceId: string = 'en-US-JennyNeural'): Promise<boolean> {
    try {
      if (!this.status.streamId || !this.status.sessionId) {
        this.updateStatus({ step: 'error', error: 'Stream not connected' });
        return false;
      }

      this.updateStatus({ step: 'talking', error: undefined });

      const response = await apiService.createDIdStreamTalkAudio(
        this.status.streamId!,
        this.status.sessionId!,
        audioUrl,
        voiceId
      );

      if (response.success) {
        return true;
      } else {
        this.updateStatus({ step: 'error', error: response.error || 'Failed to create talk with audio' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateStatus({ step: 'error', error: errorMessage });
      return false;
    }
  }

  // Закрытие стрима
  async closeStream(): Promise<boolean> {
    try {
      this.updateStatus({ step: 'closing', error: undefined });

      if (this.status.streamId && this.status.sessionId) {
        const response = await apiService.closeDIdStream(
          this.status.streamId,
          this.status.sessionId
        );

        if (!response.success) {
          this.updateStatus({ step: 'error', error: response.error });
          return false;
        }
      }

      // Закрываем WebRTC соединение
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Очищаем видео поток
      this.updateVideoStream(null, null);

      // Сбрасываем статус
      this.updateStatus({
        step: 'idle',
        streamId: undefined,
        sessionId: undefined,
        isConnected: false,
        error: undefined
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateStatus({ step: 'error', error: errorMessage });
      return false;
    }
  }

  // Получение текущего статуса
  getStatus(): StreamingStatus {
    return { ...this.status };
  }

  // Получение текущего видео потока
  getVideoStream(): VideoStream {
    return { ...this.videoStream };
  }
}

export const dIdStreamingService = new DIdStreamingService();
