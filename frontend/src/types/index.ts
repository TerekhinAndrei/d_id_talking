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
