// ===== CORE TYPES =====

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Stream {
  id: string;
  title: string;
  status: 'idle' | 'creating' | 'active' | 'error';
  streamId?: string;
  sessionId?: string;
  imageUrl?: string;
  voiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Voice {
  id: string;
  name: string;
  voice_id: string;
  provider: 'elevenlabs' | 'microsoft' | 'openai';
  language: string;
  gender: 'male' | 'female' | 'neutral';
  preview_url?: string;
}

// ===== API TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateStreamRequest {
  imageUrl: string;
  description?: string;
}

export interface CreateStreamResponse {
  stream_id: string;
  session_id: string;
  sdp_offer: string;
  ice_servers: any[];
}

export interface StartStreamRequest {
  streamId: string;
  sessionId: string;
  sdpAnswer: string;
}

export interface CreateTalkRequest {
  streamId: string;
  sessionId: string;
  script: {
    type: 'text';
    input: string;
    provider: {
      type: string;
      voice_id: string;
    };
  };
}

// ===== COMPONENT PROPS =====

export interface VideoPlayerProps {
  defaultVideoSrc?: string;
  streamVideoSrc?: string | null;
  isStreamActive?: boolean;
  className?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// ===== STATE TYPES =====

export interface AppState {
  user: User | null;
  currentStream: Stream | null;
  selectedVoice: Voice | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface StreamingState {
  isCreating: boolean;
  isConnected: boolean;
  isActive: boolean;
  streamId: string | null;
  sessionId: string | null;
  sdpOffer: string | null;
  iceServers: any[] | null;
  peerConnection: RTCPeerConnection | null;
  videoStream: MediaStream | null;
  error: string | null;
}

// ===== UTILITY TYPES =====

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'dark' | 'light';

export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de';

// ===== EVENT TYPES =====

export interface StreamEvent {
  type: 'created' | 'started' | 'stopped' | 'error';
  streamId: string;
  data?: any;
  timestamp: Date;
}

export interface VoiceEvent {
  type: 'selected' | 'changed' | 'preview';
  voiceId: string;
  data?: any;
  timestamp: Date;
}

// ===== D-ID API TYPES =====

export interface DIdFileUploadResponse {
  file_id: string;
  url: string;
  created_at: string;
  expires_at?: string;
}

export interface DIdStreamResponse {
  success: boolean;
  stream_id: string;
  session_id: string;
  sdp_offer: string;
  ice_servers: any[];
  error?: string;
}

export interface DIdTalkResponse {
  success: boolean;
  talk_id?: string;
  status?: string;
  error?: string;
}

export interface DIdIceCandidateResponse {
  success: boolean;
  stream_id: string;
  message?: string;
  error?: string;
}

export interface DIdAuthenticationResponse {
  authenticated: boolean;
  message: string;
  data?: any;
}

// ===== D-ID TALKS API TYPES =====

export interface DIdTalkRequest {
  source_url: string;
  script: {
    type: 'audio' | 'text';
    audio_url?: string;
    input?: string;
    provider?: {
      type: string;
      voice_id: string;
    };
  };
  config?: {
    stitch?: boolean;
    result_format?: string;
    [key: string]: any;
  };
  driver_url?: string;
  webhook?: string;
  presenter_id?: string;
  session_id?: string;
}

export interface DIdTalkCreateResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    created_at: string;
  };
}

export interface DIdTalkStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    result_url?: string;
    audio_url?: string;
    source_url?: string;
    created_at: string;
    modified_at?: string;
    started_at?: string;
    duration?: number;
    metadata?: {
      driver_url?: string;
      mouth_open?: boolean;
      num_faces?: number;
      num_frames?: number;
      processing_fps?: number;
      resolution?: number[];
      size_kib?: number;
    };
    face?: {
      mask_confidence?: number;
      detection?: number[];
      overlap?: string;
      size?: number;
      top_left?: number[];
      face_id?: number;
      detect_confidence?: number;
    };
    config?: {
      stitch?: boolean;
      pad_audio?: number;
      align_driver?: boolean;
      sharpen?: boolean;
      auto_match?: boolean;
      normalization_factor?: number;
      logo?: {
        url: string;
        position: number[];
      };
      motion_factor?: number;
      result_format?: string;
      fluent?: boolean;
      align_expand_factor?: number;
    };
    error?: {
      message?: string;
      code?: string;
    };
  };
}

export interface DIdWebhookPayload {
  id: string;
  status: string;
  result_url?: string;
  audio_url?: string;
  source_url?: string;
  created_at: string;
  modified_at?: string;
  started_at?: string;
  duration?: number;
  metadata?: {
    driver_url?: string;
    mouth_open?: boolean;
    num_faces?: number;
    num_frames?: number;
    processing_fps?: number;
    resolution?: number[];
    size_kib?: number;
  };
  face?: {
    mask_confidence?: number;
    detection?: number[];
    overlap?: string;
    size?: number;
    top_left?: number[];
    face_id?: number;
    detect_confidence?: number;
  };
  config?: {
    stitch?: boolean;
    pad_audio?: number;
    align_driver?: boolean;
    sharpen?: boolean;
    auto_match?: boolean;
    normalization_factor?: number;
    logo?: {
      url: string;
      position: number[];
    };
    motion_factor?: number;
    result_format?: string;
    fluent?: boolean;
    align_expand_factor?: number;
  };
  created_by?: string;
  user_id?: string;
  driver_url?: string;
  error?: {
    message?: string;
    code?: string;
  };
}
