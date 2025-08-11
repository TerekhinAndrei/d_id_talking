/**
 * Менеджер WebRTC соединений
 * Инкапсулирует логику работы с WebRTC
 */
export class WebRtcManager {
  /**
   * @param {Array} iceServers - ICE серверы
   * @param {Object} eventHandlers - Обработчики событий
   * @param {Function} [eventHandlers.onIceCandidate] - Обработчик ICE кандидатов
   * @param {Function} [eventHandlers.onIceConnectionStateChange] - Обработчик изменения состояния ICE
   * @param {Function} [eventHandlers.onTrack] - Обработчик получения треков
   * @param {Function} [eventHandlers.onConnectionStateChange] - Обработчик изменения состояния соединения
   * @param {Function} [eventHandlers.onSignalingStateChange] - Обработчик изменения состояния сигналинга
   */
  constructor(iceServers, eventHandlers = {}) {
    this.iceServers = iceServers || [];
    this.eventHandlers = eventHandlers;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitialized = false;
  }

  /**
   * Инициализирует WebRTC соединение
   * @returns {RTCPeerConnection} Peer connection
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('WebRTC Manager already initialized');
      return this.peerConnection;
    }

    console.log('🔗 Initializing WebRTC connection with ICE servers:', this.iceServers);
    
    this.peerConnection = new RTCPeerConnection({ 
      iceServers: this.iceServers 
    });

    this.setupEventListeners();
    this.isInitialized = true;

    console.log('✅ WebRTC connection initialized');
    return this.peerConnection;
  }

  /**
   * Настраивает обработчики событий
   * @private
   */
  setupEventListeners() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // ICE кандидаты
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate && this.eventHandlers.onIceCandidate) {
        try {
          console.log('🧊 ICE candidate generated');
          this.eventHandlers.onIceCandidate(event.candidate);
        } catch (error) {
          console.warn('Error in onIceCandidate handler:', error);
        }
      }
    });

    // Изменение состояния ICE соединения
    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('🔗 ICE connection state changed:', state);
      
      if (this.eventHandlers.onIceConnectionStateChange) {
        try {
          this.eventHandlers.onIceConnectionStateChange(state);
        } catch (error) {
          console.warn('Error in onIceConnectionStateChange handler:', error);
        }
      }
    });

    // Изменение состояния соединения
    this.peerConnection.addEventListener('connectionstatechange', () => {
      const state = this.peerConnection.connectionState;
      console.log('🔗 Connection state changed:', state);
      
      if (this.eventHandlers.onConnectionStateChange) {
        try {
          this.eventHandlers.onConnectionStateChange(state);
        } catch (error) {
          console.warn('Error in onConnectionStateChange handler:', error);
        }
      }
    });

    // Изменение состояния сигналинга
    this.peerConnection.addEventListener('signalingstatechange', () => {
      const state = this.peerConnection.signalingState;
      console.log('📡 Signaling state changed:', state);
      
      if (this.eventHandlers.onSignalingStateChange) {
        try {
          this.eventHandlers.onSignalingStateChange(state);
        } catch (error) {
          console.warn('Error in onSignalingStateChange handler:', error);
        }
      }
    });

    // Получение треков
    this.peerConnection.addEventListener('track', (event) => {
      console.log('🎬 Track received:', { 
        kind: event.track.kind, 
        id: event.track.id, 
        streams: event.streams.length 
      });
      
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
      }
      
      if (this.eventHandlers.onTrack) {
        try {
          this.eventHandlers.onTrack(event);
        } catch (error) {
          console.warn('Error in onTrack handler:', error);
        }
      }
    });
  }

  /**
   * Устанавливает удаленное SDP предложение
   * @param {string} sdpOffer - SDP предложение
   * @returns {Promise<void>}
   */
  async setRemoteOffer(sdpOffer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📝 Setting remote offer');
    
    try {
      await this.peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: sdpOffer
      });
      
      console.log('✅ Remote offer set successfully');
    } catch (error) {
      console.error('❌ Error setting remote offer:', error);
      throw error;
    }
  }

  /**
   * Создает SDP ответ и устанавливает его локально
   * @returns {Promise<Object>} SDP ответ
   */
  async createAnswerAndSetLocal() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📝 Creating SDP answer');
    
    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      console.log('✅ SDP answer created and set locally');
      return answer;
    } catch (error) {
      console.error('❌ Error creating SDP answer:', error);
      throw error;
    }
  }

  /**
   * Добавляет аудио трек из потока
   * @param {MediaStream} stream - Аудио поток
   * @returns {MediaStream} Локальный поток
   */
  addAudioTrackFromStream(stream) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('🎤 Adding audio track from stream');
    
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        this.peerConnection.addTrack(audioTrack, stream);
        this.localStream = stream;
        console.log('✅ Audio track added successfully');
      } else {
        console.warn('⚠️ No audio track found in stream');
      }
      
      return stream;
    } catch (error) {
      console.error('❌ Error adding audio track:', error);
      throw error;
    }
  }

  /**
   * Получает доступ к микрофону и добавляет трек
   * @param {Object} [options] - Опции записи
   * @returns {Promise<MediaStream>} Аудио поток
   */
  async addAudioTrackFromMicrophone(options = {}) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('🎤 Getting microphone access');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          ...options
        }
      });

      console.log('✅ Microphone access granted');
      
      this.addAudioTrackFromStream(stream);
      return stream;
    } catch (error) {
      console.error('❌ Error getting microphone access:', error);
      throw error;
    }
  }

  /**
   * Получает текущее состояние соединения
   * @returns {Object} Состояние соединения
   */
  getConnectionState() {
    if (!this.peerConnection) {
      return {
        isInitialized: false,
        iceConnectionState: 'new',
        connectionState: 'new',
        signalingState: 'stable'
      };
    }

    return {
      isInitialized: this.isInitialized,
      iceConnectionState: this.peerConnection.iceConnectionState,
      connectionState: this.peerConnection.connectionState,
      signalingState: this.peerConnection.signalingState,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream
    };
  }

  /**
   * Получает локальный поток
   * @returns {MediaStream|null} Локальный поток
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Получает удаленный поток
   * @returns {MediaStream|null} Удаленный поток
   */
  getRemoteStream() {
    return this.remoteStream;
  }

  /**
   * Останавливает все треки в локальном потоке
   */
  stopLocalStream() {
    if (this.localStream) {
      console.log('🔇 Stopping local stream tracks');
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track stopped:', track.kind);
      });
      this.localStream = null;
    }
  }

  /**
   * Закрывает WebRTC соединение
   */
  close() {
    console.log('🔌 Closing WebRTC connection');
    
    // Останавливаем локальный поток
    this.stopLocalStream();
    
    // Закрываем peer connection
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
        console.log('✅ Peer connection closed');
      } catch (error) {
        console.warn('⚠️ Error closing peer connection:', error);
      }
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.isInitialized = false;
  }

  /**
   * Проверяет, инициализировано ли соединение
   * @returns {boolean} Результат проверки
   */
  isConnectionInitialized() {
    return this.isInitialized && this.peerConnection !== null;
  }

  /**
   * Проверяет, подключено ли соединение
   * @returns {boolean} Результат проверки
   */
  isConnected() {
    return this.isConnectionInitialized() && 
           this.peerConnection.iceConnectionState === 'connected';
  }
}
