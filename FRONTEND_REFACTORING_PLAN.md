# План рефакторинга фронтенда в соответствии с принципами ООП и SOLID

## Анализ текущего состояния

### Проблемы архитектуры

#### 1. Нарушение принципа единственной ответственности (SRP)
- **DIdStreamingTester.jsx** (747 строк) - выполняет множество задач:
  - Управление состоянием стрима
  - WebRTC логика
  - UI рендеринг
  - Логирование
  - Обработка ошибок
  - Управление видео плеером

- **App.jsx** (434 строки) - содержит:
  - Управление состоянием приложения
  - Логику загрузки изображений
  - Интеграцию с API
  - UI компоненты

#### 2. Нарушение принципа открытости/закрытости (OCP)
- Класс `ApiService` содержит множество методов для разных доменов
- Хуки содержат жестко закодированную логику
- Отсутствует возможность расширения без изменения существующего кода

#### 3. Нарушение принципа подстановки Лисков (LSP)
- Отсутствуют интерфейсы для сервисов
- Нет абстракций для различных типов стриминга

#### 4. Нарушение принципа разделения интерфейса (ISP)
- `ApiService` имеет один большой интерфейс
- Хуки экспортируют множество методов, не все из которых используются

#### 5. Нарушение принципа инверсии зависимостей (DIP)
- Компоненты напрямую зависят от конкретных сервисов
- Отсутствует инъекция зависимостей

### Проблемы кода

#### 1. Дублирование кода
- Логика создания стрима дублируется в `DIdStreamingTester` и `useDIdStreaming`
- Обработка ошибок повторяется во многих местах
- Логика WebRTC разбросана по разным файлам

#### 2. Сложность компонентов
- Монолитные компоненты с множеством состояний
- Смешение UI и бизнес-логики
- Отсутствие разделения на презентационные и контейнерные компоненты

#### 3. Проблемы с состоянием
- Глобальное состояние разбросано по разным хукам
- Отсутствует централизованное управление состоянием
- Сложная синхронизация между компонентами

## План рефакторинга

### Этап 1: Создание архитектурных основ

#### 1.1 Создание слоя абстракций

```typescript
// src/core/interfaces/IStreamingService.ts
interface IStreamingService {
  createStream(config: StreamConfig): Promise<StreamResult>;
  startStream(streamId: string, sessionId: string): Promise<void>;
  createTalk(streamId: string, sessionId: string, script: TalkScript): Promise<void>;
  closeStream(streamId: string, sessionId: string): Promise<void>;
}

// src/core/interfaces/IVoiceService.ts
interface IVoiceService {
  getVoices(): Promise<Voice[]>;
  playVoice(voiceId: string, text: string): Promise<AudioResult>;
  validateVoice(voiceId: string): Promise<boolean>;
}

// src/core/interfaces/IAudioService.ts
interface IAudioService {
  recordAudio(): Promise<AudioStream>;
  processAudio(audioData: AudioData): Promise<ProcessedAudio>;
  playAudio(audioData: AudioData): Promise<void>;
}
```

#### 1.2 Создание фабрик и провайдеров

```typescript
// src/core/factories/ServiceFactory.ts
class ServiceFactory {
  static createStreamingService(type: 'did' | 'custom'): IStreamingService {
    switch (type) {
      case 'did':
        return new DIdStreamingService();
      default:
        throw new Error(`Unknown streaming service type: ${type}`);
    }
  }
  
  static createVoiceService(type: 'elevenlabs' | 'custom'): IVoiceService {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsVoiceService();
      default:
        throw new Error(`Unknown voice service type: ${type}`);
    }
  }
}
```

### Этап 2: Рефакторинг сервисов

#### 2.1 Разделение ApiService

```typescript
// src/services/streaming/DIdStreamingService.ts
class DIdStreamingService implements IStreamingService {
  constructor(private apiClient: IApiClient) {}
  
  async createStream(config: StreamConfig): Promise<StreamResult> {
    // Логика создания стрима D-ID
  }
  
  async startStream(streamId: string, sessionId: string): Promise<void> {
    // Логика запуска стрима
  }
  
  // ... остальные методы
}

// src/services/voice/ElevenLabsVoiceService.ts
class ElevenLabsVoiceService implements IVoiceService {
  constructor(private apiClient: IApiClient) {}
  
  async getVoices(): Promise<Voice[]> {
    // Логика получения голосов
  }
  
  // ... остальные методы
}

// src/services/audio/AudioProcessingService.ts
class AudioProcessingService implements IAudioService {
  async recordAudio(): Promise<AudioStream> {
    // Логика записи аудио
  }
  
  // ... остальные методы
}
```

#### 2.2 Создание WebRTC менеджера

```typescript
// src/services/webrtc/WebRtcManager.ts
class WebRtcManager {
  private peerConnection: RTCPeerConnection | null = null;
  private eventHandlers: WebRtcEventHandlers;
  
  constructor(iceServers: RTCIceServer[], handlers: WebRtcEventHandlers) {
    this.eventHandlers = handlers;
    this.initializePeerConnection(iceServers);
  }
  
  private initializePeerConnection(iceServers: RTCIceServer[]): void {
    this.peerConnection = new RTCPeerConnection({ iceServers });
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    if (!this.peerConnection) return;
    
    this.peerConnection.addEventListener('icecandidate', this.handleIceCandidate);
    this.peerConnection.addEventListener('track', this.handleTrack);
    this.peerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionStateChange);
  }
  
  async setRemoteOffer(sdpOffer: string): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: sdpOffer });
  }
  
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }
  
  addAudioTrack(stream: MediaStream): void {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      this.peerConnection.addTrack(audioTrack, stream);
    }
  }
  
  close(): void {
    this.peerConnection?.close();
    this.peerConnection = null;
  }
}
```

### Этап 3: Рефакторинг хуков

#### 3.1 Создание специализированных хуков

```typescript
// src/hooks/streaming/useStreamingManager.ts
export const useStreamingManager = (serviceType: 'did' | 'custom') => {
  const [state, dispatch] = useReducer(streamingReducer, initialState);
  const streamingService = useMemo(() => 
    ServiceFactory.createStreamingService(serviceType), 
    [serviceType]
  );
  
  const createStream = useCallback(async (config: StreamConfig) => {
    dispatch({ type: 'CREATE_STREAM_START' });
    try {
      const result = await streamingService.createStream(config);
      dispatch({ type: 'CREATE_STREAM_SUCCESS', payload: result });
      return result;
    } catch (error) {
      dispatch({ type: 'CREATE_STREAM_ERROR', payload: error });
      throw error;
    }
  }, [streamingService]);
  
  // ... остальные методы
  
  return {
    state,
    createStream,
    startStream,
    createTalk,
    closeStream
  };
};

// src/hooks/voice/useVoiceManager.ts
export const useVoiceManager = (serviceType: 'elevenlabs' | 'custom') => {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const voiceService = useMemo(() => 
    ServiceFactory.createVoiceService(serviceType), 
    [serviceType]
  );
  
  // ... методы управления голосами
};

// src/hooks/audio/useAudioManager.ts
export const useAudioManager = () => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioService = useMemo(() => new AudioProcessingService(), []);
  
  // ... методы управления аудио
};
```

#### 3.2 Создание композитных хуков

```typescript
// src/hooks/composite/useStreamingSession.ts
export const useStreamingSession = () => {
  const streamingManager = useStreamingManager('did');
  const voiceManager = useVoiceManager('elevenlabs');
  const audioManager = useAudioManager();
  
  const startSession = useCallback(async (config: SessionConfig) => {
    // Координация между всеми менеджерами
  }, [streamingManager, voiceManager, audioManager]);
  
  return {
    streaming: streamingManager,
    voice: voiceManager,
    audio: audioManager,
    startSession
  };
};
```

### Этап 4: Рефакторинг компонентов

#### 4.1 Разделение на презентационные и контейнерные компоненты

```typescript
// src/components/streaming/StreamingTesterContainer.tsx
const StreamingTesterContainer = () => {
  const { streaming, voice, audio } = useStreamingSession();
  
  return (
    <StreamingTester
      streamingState={streaming.state}
      voiceState={voice.state}
      audioState={audio.state}
      onCreateStream={streaming.createStream}
      onStartStream={streaming.startStream}
      onCreateTalk={streaming.createTalk}
      onCloseStream={streaming.closeStream}
      onVoiceChange={voice.selectVoice}
      onPlayVoice={voice.playVoice}
    />
  );
};

// src/components/streaming/StreamingTester.tsx (презентационный)
const StreamingTester = ({
  streamingState,
  voiceState,
  audioState,
  onCreateStream,
  onStartStream,
  onCreateTalk,
  onCloseStream,
  onVoiceChange,
  onPlayVoice
}) => {
  // Только UI логика, без бизнес-логики
  return (
    <div className="streaming-tester">
      <StreamingControls
        state={streamingState}
        onCreateStream={onCreateStream}
        onStartStream={onStartStream}
        onCreateTalk={onCreateTalk}
        onCloseStream={onCloseStream}
      />
      <VoiceControls
        state={voiceState}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
      />
      <AudioControls
        state={audioState}
      />
      <StreamingStatus state={streamingState} />
      <StreamingLogs logs={streamingState.logs} />
    </div>
  );
};
```

#### 4.2 Создание специализированных компонентов

```typescript
// src/components/streaming/StreamingControls.tsx
const StreamingControls = ({ state, onCreateStream, onStartStream, onCreateTalk, onCloseStream }) => {
  return (
    <div className="streaming-controls">
      <button 
        onClick={onCreateStream}
        disabled={state.isCreating}
        className="btn btn-primary"
      >
        {state.isCreating ? 'Creating...' : 'Create Stream'}
      </button>
      
      <button 
        onClick={onStartStream}
        disabled={!state.canStart}
        className="btn btn-success"
      >
        Start Stream
      </button>
      
      {/* ... остальные кнопки */}
    </div>
  );
};

// src/components/streaming/StreamingStatus.tsx
const StreamingStatus = ({ state }) => {
  return (
    <div className="streaming-status">
      <StatusIndicator 
        label="Connection"
        status={state.connectionStatus}
        icon={getConnectionIcon(state.connectionStatus)}
      />
      <StatusIndicator 
        label="Stream"
        status={state.streamStatus}
        icon={getStreamIcon(state.streamStatus)}
      />
      {/* ... остальные индикаторы */}
    </div>
  );
};

// src/components/streaming/StreamingLogs.tsx
const StreamingLogs = ({ logs }) => {
  return (
    <div className="streaming-logs">
      <h3>Logs</h3>
      <div className="logs-container">
        {logs.map((log, index) => (
          <LogEntry key={index} log={log} />
        ))}
      </div>
    </div>
  );
};
```

### Этап 5: Создание системы управления состоянием

#### 5.1 Создание контекстов

```typescript
// src/contexts/StreamingContext.tsx
const StreamingContext = createContext<StreamingContextType | null>(null);

export const StreamingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(streamingReducer, initialState);
  
  const value = useMemo(() => ({
    state,
    dispatch,
    actions: {
      createStream: (config) => dispatch({ type: 'CREATE_STREAM', payload: config }),
      startStream: (streamId) => dispatch({ type: 'START_STREAM', payload: streamId }),
      // ... остальные действия
    }
  }), [state]);
  
  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
};

// src/contexts/VoiceContext.tsx
const VoiceContext = createContext<VoiceContextType | null>(null);

export const VoiceProvider = ({ children }) => {
  // Аналогично StreamingProvider
};

// src/contexts/AudioContext.tsx
const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }) => {
  // Аналогично StreamingProvider
};
```

#### 5.2 Создание композитного провайдера

```typescript
// src/contexts/AppProvider.tsx
export const AppProvider = ({ children }) => {
  return (
    <StreamingProvider>
      <VoiceProvider>
        <AudioProvider>
          {children}
        </AudioProvider>
      </VoiceProvider>
    </StreamingProvider>
  );
};
```

### Этап 6: Создание системы обработки ошибок

#### 6.1 Создание ErrorBoundary

```typescript
// src/components/error/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

#### 6.2 Создание системы обработки ошибок

```typescript
// src/utils/errorHandling/ErrorHandler.ts
class ErrorHandler {
  static handle(error: Error, context: string): void {
    console.error(`Error in ${context}:`, error);
    
    // Логирование ошибки
    this.logError(error, context);
    
    // Уведомление пользователя
    this.notifyUser(error, context);
    
    // Отправка в систему мониторинга
    this.reportToMonitoring(error, context);
  }
  
  private static logError(error: Error, context: string): void {
    // Логирование в консоль или файл
  }
  
  private static notifyUser(error: Error, context: string): void {
    // Показ уведомления пользователю
  }
  
  private static reportToMonitoring(error: Error, context: string): void {
    // Отправка в систему мониторинга
  }
}
```

### Этап 7: Создание системы логирования

#### 7.1 Создание Logger

```typescript
// src/utils/logging/Logger.ts
class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  log(level: LogLevel, message: string, context?: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };
    
    this.logs.push(logEntry);
    this.outputToConsole(logEntry);
  }
  
  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }
  
  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }
  
  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }
  
  private outputToConsole(logEntry: LogEntry): void {
    const { timestamp, level, message, context, data } = logEntry;
    const prefix = `[${timestamp.toISOString()}] [${level.toUpperCase()}]`;
    const contextStr = context ? ` [${context}]` : '';
    
    switch (level) {
      case 'info':
        console.log(`${prefix}${contextStr} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix}${contextStr} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix}${contextStr} ${message}`, data || '');
        break;
    }
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  clearLogs(): void {
    this.logs = [];
  }
}
```

### Этап 8: Создание системы конфигурации

#### 8.1 Создание ConfigManager

```typescript
// src/config/ConfigManager.ts
class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  private loadConfig(): AppConfig {
    return {
      api: {
        baseUrl: process.env.REACT_APP_API_BASE_URL || '/api/v1',
        timeout: 30000
      },
      streaming: {
        defaultImageUrl: '/default_avatar.jpg',
        defaultVoiceId: 'en-US-JennyNeural',
        chunkDuration: 2000
      },
      audio: {
        sampleRate: 48000,
        channels: 1,
        bitrate: 128000
      },
      webrtc: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    };
  }
  
  getConfig(): AppConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
```

### Этап 9: Создание системы тестирования

#### 9.1 Создание моков для тестирования

```typescript
// src/__mocks__/services/MockStreamingService.ts
export class MockStreamingService implements IStreamingService {
  async createStream(config: StreamConfig): Promise<StreamResult> {
    return {
      success: true,
      streamId: 'mock-stream-id',
      sessionId: 'mock-session-id',
      sdpOffer: 'mock-sdp-offer',
      iceServers: []
    };
  }
  
  // ... остальные методы
}

// src/__mocks__/services/MockVoiceService.ts
export class MockVoiceService implements IVoiceService {
  async getVoices(): Promise<Voice[]> {
    return [
      { voice_id: 'mock-voice-1', name: 'Mock Voice 1', description: 'Test voice' }
    ];
  }
  
  // ... остальные методы
}
```

#### 9.2 Создание тестовых утилит

```typescript
// src/utils/testing/TestUtils.ts
export const createMockStreamingState = (overrides = {}): StreamingState => ({
  isCreating: false,
  isConnected: false,
  isActive: false,
  streamId: null,
  sessionId: null,
  error: null,
  status: 'idle',
  ...overrides
});

export const createMockVoiceState = (overrides = {}): VoiceState => ({
  voices: [],
  selectedVoice: null,
  loading: false,
  error: null,
  ...overrides
});

export const renderWithProviders = (component: ReactElement, providers = {}) => {
  return render(
    <AppProvider {...providers}>
      {component}
    </AppProvider>
  );
};
```

### Этап 10: Документация и типизация

#### 10.1 Создание TypeScript типов

```typescript
// src/types/streaming.ts
export interface StreamConfig {
  imageUrl: string;
  description?: string;
  resolution?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface StreamResult {
  success: boolean;
  streamId: string;
  sessionId: string;
  sdpOffer: string;
  iceServers: RTCIceServer[];
  error?: string;
}

export interface TalkScript {
  type: 'text' | 'audio';
  input: string;
  provider: {
    type: 'elevenlabs' | 'microsoft';
    voice_id: string;
  };
}

// src/types/voice.ts
export interface Voice {
  voice_id: string;
  name: string;
  description: string;
  language?: string;
  gender?: 'male' | 'female';
}

export interface AudioResult {
  success: boolean;
  audio_data: string;
  format: string;
  sample_rate: number;
  bitrate: string;
}

// src/types/audio.ts
export interface AudioData {
  data: ArrayBuffer;
  format: string;
  sampleRate: number;
  channels: number;
}

export interface ProcessedAudio {
  data: AudioData;
  duration: number;
  size: number;
}
```

#### 10.2 Создание документации

```markdown
# Архитектура приложения

## Принципы проектирования

### SOLID принципы
- **S** - Single Responsibility Principle: каждый класс имеет одну ответственность
- **O** - Open/Closed Principle: классы открыты для расширения, закрыты для модификации
- **L** - Liskov Substitution Principle: подклассы могут заменять базовые классы
- **I** - Interface Segregation Principle: клиенты не зависят от неиспользуемых интерфейсов
- **D** - Dependency Inversion Principle: зависимости от абстракций, а не от конкретных классов

### Архитектурные паттерны
- **Dependency Injection**: инъекция зависимостей через фабрики
- **Factory Pattern**: создание объектов через фабрики
- **Strategy Pattern**: различные стратегии для разных сервисов
- **Observer Pattern**: реактивное обновление UI через контексты
- **Command Pattern**: инкапсуляция запросов в команды

## Структура проекта

```
src/
├── core/                    # Ядро приложения
│   ├── interfaces/         # Интерфейсы
│   ├── factories/          # Фабрики
│   └── types/             # Общие типы
├── services/              # Сервисы
│   ├── streaming/         # Сервисы стриминга
│   ├── voice/            # Сервисы голоса
│   ├── audio/            # Сервисы аудио
│   └── webrtc/           # WebRTC сервисы
├── hooks/                 # React хуки
│   ├── streaming/        # Хуки стриминга
│   ├── voice/           # Хуки голоса
│   ├── audio/           # Хуки аудио
│   └── composite/       # Композитные хуки
├── components/           # React компоненты
│   ├── streaming/       # Компоненты стриминга
│   ├── voice/          # Компоненты голоса
│   ├── audio/          # Компоненты аудио
│   └── common/         # Общие компоненты
├── contexts/            # React контексты
├── utils/              # Утилиты
│   ├── errorHandling/  # Обработка ошибок
│   ├── logging/        # Логирование
│   └── testing/        # Тестовые утилиты
└── config/             # Конфигурация
```

## Руководство по использованию

### Создание нового сервиса
1. Создать интерфейс в `core/interfaces/`
2. Реализовать сервис в `services/`
3. Добавить в фабрику в `core/factories/`
4. Создать хук в `hooks/`
5. Написать тесты

### Создание нового компонента
1. Определить, презентационный или контейнерный
2. Создать в соответствующей папке
3. Использовать контексты для состояния
4. Добавить обработку ошибок
5. Написать тесты

### Добавление новой функциональности
1. Создать интерфейсы
2. Реализовать сервисы
3. Создать хуки
4. Создать компоненты
5. Интегрировать в приложение
6. Написать тесты
```

## Преимущества рефакторинга

### 1. Улучшение поддерживаемости
- Четкое разделение ответственности
- Легкое добавление новых функций
- Простое тестирование
- Читаемый код

### 2. Улучшение расширяемости
- Возможность добавления новых сервисов
- Легкая замена компонентов
- Гибкая конфигурация
- Модульная архитектура

### 3. Улучшение тестируемости
- Изолированные компоненты
- Моки для сервисов
- Unit тесты для каждого слоя
- Интеграционные тесты

### 4. Улучшение производительности
- Оптимизированные ре-рендеры
- Мемоизация вычислений
- Ленивая загрузка компонентов
- Эффективное управление состоянием

### 5. Улучшение разработки
- Четкая структура проекта
- Документированные интерфейсы
- Типизация TypeScript
- Автоматизированные тесты

## План внедрения

### Фаза 1 (1-2 недели): Основы архитектуры
- Создание интерфейсов и типов
- Реализация базовых сервисов
- Создание фабрик

### Фаза 2 (2-3 недели): Рефакторинг сервисов
- Разделение ApiService
- Создание WebRTC менеджера
- Реализация системы ошибок

### Фаза 3 (2-3 недели): Рефакторинг хуков
- Создание специализированных хуков
- Реализация композитных хуков
- Создание контекстов

### Фаза 4 (2-3 недели): Рефакторинг компонентов
- Разделение на презентационные и контейнерные
- Создание специализированных компонентов
- Интеграция с новой архитектурой

### Фаза 5 (1-2 недели): Тестирование и документация
- Написание тестов
- Создание документации
- Финальная проверка

## Риски и митигация

### Риски
1. **Временные затраты**: Рефакторинг займет 8-13 недель
2. **Сложность**: Новая архитектура может быть сложнее для понимания
3. **Ошибки**: Возможны ошибки при миграции

### Митигация
1. **Поэтапное внедрение**: Рефакторинг по фазам
2. **Тестирование**: Обширное тестирование на каждом этапе
3. **Документация**: Подробная документация архитектуры
4. **Обучение**: Обучение команды новой архитектуре

## Заключение

Предложенный план рефакторинга обеспечивает:
- Соответствие принципам SOLID
- Модульную и расширяемую архитектуру
- Улучшенную тестируемость
- Лучшую поддерживаемость кода
- Готовность к масштабированию

Рефакторинг следует проводить поэтапно с тщательным тестированием на каждом этапе для минимизации рисков и обеспечения стабильности приложения.
