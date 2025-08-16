// ===== API CONSTANTS =====

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  STREAMS: '/api/v1/streams',
  VOICES: '/api/v1/voices',
  USERS: '/api/v1/users',
  HEALTH: '/api/v1/health',
} as const;

// ===== STREAMING CONSTANTS =====

export const STREAM_STATUS = {
  IDLE: 'idle',
  CREATING: 'creating',
  ACTIVE: 'active',
  ERROR: 'error',
} as const;

export const VOICE_PROVIDERS = {
  ELEVENLABS: 'elevenlabs',
  MICROSOFT: 'microsoft',
  OPENAI: 'openai',
} as const;

// ===== UI CONSTANTS =====

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
} as const;

export const LANGUAGES = {
  EN: 'en',
  RU: 'ru',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
} as const;

// ===== ANIMATION CONSTANTS =====

export const TRANSITIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
} as const;

// ===== ERROR MESSAGES =====

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// ===== SUCCESS MESSAGES =====

export const SUCCESS_MESSAGES = {
  STREAM_CREATED: 'Stream created successfully!',
  STREAM_STARTED: 'Stream started successfully!',
  STREAM_STOPPED: 'Stream stopped successfully!',
  VOICE_SELECTED: 'Voice selected successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ===== DEFAULT VALUES =====

export const DEFAULTS = {
  STREAM_TITLE: 'New Stream',
  STREAM_DESCRIPTION: 'AI-powered video stream',
  IMAGE_URL: 'https://res.cloudinary.com/daeoqig4w/image/upload/v1754601773/ced034aa-4c77-4d02-a762-fb16bcb25d75.jpg',
  VOICE_ID: 'en-US-JennyNeural',
  THEME: THEMES.DARK,
  LANGUAGE: LANGUAGES.EN,
} as const;

// ===== BREAKPOINTS =====

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ===== Z-INDEX =====

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;
