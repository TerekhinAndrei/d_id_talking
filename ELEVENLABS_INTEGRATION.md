# ElevenLabs Integration Documentation

## Обзор

Данная документация описывает интеграцию сервисов ElevenLabs бэкенда в фронтенд приложения. Интеграция включает в себя Text-to-Speech (TTS), Speech-to-Speech (STS), управление голосами и тестирование аутентификации.

## Архитектура интеграции

### Бэкенд API Endpoints

Все ElevenLabs функции доступны через следующие эндпоинты:

- `POST /api/v1/generation/tts` - Text-to-Speech
- `POST /api/v1/generation/sts` - Speech-to-Speech  
- `POST /api/v1/generation/play-voice` - Воспроизведение голоса
- `GET /api/v1/generation/voices` - Получение списка голосов
- `GET /api/v1/generation/voices/{voice_id}` - Получение информации о голосе
- `GET /api/v1/generation/voices/validate/{voice_id}` - Валидация голоса
- `GET /api/v1/generation/test-auth` - Тестирование аутентификации

### Фронтенд компоненты

#### 1. API Service (`frontend/src/services/api.js`)

Расширенный сервис для работы с ElevenLabs API:

```javascript
// Основные методы
- textToSpeech(text, voiceId, settings)
- speechToSpeech(audioFile, voiceId, settings)
- playVoice(voiceId, previewText)
- validateVoice(voiceId)
- getVoice(voiceId)
- testElevenLabsAuth()
```

#### 2. ElevenLabs Hook (`frontend/src/hooks/useElevenLabs.js`)

React хук для управления состоянием и функциями ElevenLabs:

```javascript
const {
  textToSpeech,
  speechToSpeech,
  playVoice,
  validateVoice,
  testAuth,
  isProcessing,
  error,
  audioData,
  playAudioData,
  clearState
} = useElevenLabs();
```

#### 3. VoiceSelector Component

Обновленный компонент выбора голоса с интеграцией ElevenLabs:

- Автоматическое воспроизведение голосов через ElevenLabs API
- Обработка ошибок и состояний загрузки
- Интеграция с существующим интерфейсом

#### 4. ElevenLabsTester Component

Компонент для тестирования всех функций ElevenLabs:

- Тестирование аутентификации
- Тестирование TTS с пользовательским текстом
- Тестирование STS с загруженным аудио файлом
- Валидация голосов
- Отображение результатов тестов

#### 5. ElevenLabsStatus Component

Компонент для отображения статуса ElevenLabs сервисов:

- Проверка аутентификации
- Отображение количества доступных голосов
- Время последней проверки
- Обработка ошибок подключения

## Использование

### Базовое использование TTS

```javascript
import { useElevenLabs } from './hooks/useElevenLabs';

const MyComponent = () => {
  const { textToSpeech, playAudioData, isProcessing, error } = useElevenLabs();

  const handleTTS = async () => {
    try {
      const response = await textToSpeech(
        "Привет! Это тест ElevenLabs.", 
        "21m00Tcm4TlvDq8ikWAM"
      );
      
      if (response.success) {
        await playAudioData(response.audio_data, response.format);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  return (
    <button onClick={handleTTS} disabled={isProcessing}>
      {isProcessing ? 'Обработка...' : 'Преобразовать в речь'}
    </button>
  );
};
```

### Тестирование аутентификации

```javascript
const { testAuth } = useElevenLabs();

const checkAuth = async () => {
  try {
    const response = await testAuth();
    if (response.success) {
      console.log('ElevenLabs подключен успешно');
    }
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
  }
};
```

### Валидация голоса

```javascript
const { validateVoice } = useElevenLabs();

const validateVoiceId = async (voiceId) => {
  try {
    const response = await validateVoice(voiceId);
    if (response.valid) {
      console.log('Голос валиден');
    } else {
      console.log('Голос не найден');
    }
  } catch (error) {
    console.error('Ошибка валидации:', error);
  }
};
```

## Обработка ошибок

Все функции ElevenLabs включают обработку ошибок:

1. **API ошибки** - автоматически обрабатываются в `apiService`
2. **Состояние ошибок** - управляется через `useElevenLabs` хук
3. **UI отображение** - ошибки показываются через `ErrorMessage` компонент

### Типы ошибок

- `ConfigurationError` - ошибки конфигурации
- `APIError` - ошибки API запросов
- `ServiceError` - общие ошибки сервиса
- `NetworkError` - сетевые ошибки

## Состояния загрузки

Все асинхронные операции ElevenLabs имеют состояния загрузки:

```javascript
const { isProcessing, error, audioData } = useElevenLabs();

// isProcessing - true во время выполнения операции
// error - содержит ошибку, если она возникла
// audioData - содержит результат TTS/STS операции
```

## Стилизация

Все компоненты ElevenLabs имеют соответствующие CSS стили:

- `.elevenlabs-tester` - стили для тестера
- `.elevenlabs-status` - стили для статуса
- `.test-btn` - стили для кнопок тестирования
- `.test-result` - стили для результатов тестов

## Безопасность

1. **API ключи** - хранятся только на бэкенде
2. **Валидация** - все входные данные валидируются
3. **Обработка ошибок** - чувствительная информация не передается в UI
4. **HTTPS** - все запросы выполняются через защищенное соединение

## Тестирование

### Автоматические тесты

```bash
# Запуск тестов фронтенда
cd frontend
npm test

# Запуск тестов бэкенда
cd ..
python -m pytest tests/test_elevenlabs_service.py
```

### Ручное тестирование

1. Откройте приложение в браузере
2. Перейдите к секции "ElevenLabs API Тестирование"
3. Нажмите "Показать Тестер"
4. Выполните тесты аутентификации, TTS, STS и валидации

## Конфигурация

### Переменные окружения

```bash
# ElevenLabs API
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_DEFAULT_MODEL=eleven_monolingual_v1
ELEVENLABS_STS_MODEL=eleven_multilingual_v2
```

### Настройка голосов

По умолчанию используются следующие голоса:

- Rachel (21m00Tcm4TlvDq8ikWAM) - женский голос
- Domi (AZnzlk1XvdvUeBnXmlld) - женский голос
- Bella (EXAVITQu4vr4xnSDxMaL) - женский голос
- Antoni (ErXwobaYiN019PkySvjV) - мужской голос

## Производительность

### Оптимизации

1. **Кэширование** - голоса кэшируются после первой загрузки
2. **Ленивая загрузка** - компоненты загружаются по требованию
3. **Очистка состояния** - автоматическая очистка неиспользуемых данных
4. **Обработка ошибок** - graceful degradation при сбоях

### Мониторинг

- Логирование всех API вызовов
- Отслеживание времени ответа
- Мониторинг ошибок
- Статистика использования

## Будущие улучшения

1. **WebSocket поддержка** - для real-time обновлений
2. **Офлайн режим** - кэширование для работы без интернета
3. **Продвинутые настройки голоса** - pitch, speed, emotion
4. **Batch обработка** - массовое преобразование текста
5. **Интеграция с D-ID** - прямая связь с видео генерацией

## Поддержка

При возникновении проблем:

1. Проверьте консоль браузера на наличие ошибок
2. Убедитесь, что API ключ ElevenLabs корректный
3. Проверьте сетевое подключение
4. Используйте компонент ElevenLabsTester для диагностики
5. Обратитесь к логам сервера для детальной информации
