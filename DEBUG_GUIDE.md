# 🔧 Debug Guide - Voice Changer

## 🎯 Проблема: Аудио не воспроизводится на фронтенде

### ✅ Что было исправлено:

1. **Накопление аудио чанков**: Теперь чанки накапливаются перед воспроизведением
2. **Правильный формат**: Используется MP3 формат от ElevenLabs
3. **Blob воспроизведение**: Аудио воспроизводится через Blob и Audio элемент
4. **Улучшенное логирование**: Добавлено подробное логирование для отладки

### 🔍 Как отладить:

#### 1. Проверьте консоль браузера:
- Откройте Developer Tools (F12)
- Перейдите на вкладку Console
- Ищите сообщения с эмодзи: 🎵, 🔊, ✅, ❌

#### 2. Проверьте WebSocket соединение:
```javascript
// В консоли браузера
const ws = new WebSocket('ws://localhost:8000/api/v1/streaming/ws/stream-audio/21m00Tcm4TlvDq8ikWAM');
ws.onopen = () => console.log('✅ Connected');
ws.onmessage = (e) => console.log('📥 Received:', e.data);
```

#### 3. Проверьте API ключ:
```bash
grep ELEVENLABS_API_KEY .env
```

#### 4. Проверьте сервер:
```bash
curl -X GET http://localhost:8000/api/v1/streaming/health
```

### 🧪 Тесты:

#### Тест ElevenLabs SDK:
```bash
python3 test_elevenlabs_sdk.py
```

#### Тест WebSocket:
```bash
python3 test_websocket_connection.py
```

#### Тест аудио формата:
```bash
python3 test_elevenlabs_audio_format.py
```

#### Тест браузера:
Откройте `test_audio_playback.html` в браузере

### 🔧 Возможные проблемы:

1. **API ключ не установлен**: Проверьте `.env` файл
2. **WebSocket не подключается**: Проверьте, что сервер запущен
3. **Аудио не воспроизводится**: Проверьте консоль браузера
4. **Микрофон не работает**: Разрешите доступ к микрофону

### 📝 Логи для проверки:

#### В консоли браузера должны быть:
```
🔌 Connecting to WebSocket: ws://localhost:8000/api/v1/streaming/ws/stream-audio/21m00Tcm4TlvDq8ikWAM
✅ WebSocket connected to backend
📤 Sending config: {type: "config", ...}
📥 Received message: {type: "status", message: "Configuration received, ready for audio"}
🎵 Received audio chunk: 1024 bytes
🔊 Playing audio blob: 5120 bytes
✅ Audio ready to play
🎵 Audio playback started successfully!
```

#### В логах сервера должны быть:
```
INFO: Processing 1 audio chunks, total size: 1024 bytes
INFO: Sending processed audio chunk 1: 1024 bytes
INFO: Completed processing 1 audio chunks
```

### 🎯 Решение:

Если аудио все еще не воспроизводится:

1. **Проверьте браузер**: Используйте Chrome или Firefox
2. **Проверьте настройки**: Убедитесь, что звук включен
3. **Проверьте микрофон**: Разрешите доступ к микрофону
4. **Проверьте сеть**: Убедитесь, что WebSocket соединение стабильно

### 📞 Следующие шаги:

1. Запустите тесты выше
2. Проверьте консоль браузера
3. Проверьте логи сервера
4. Сообщите о конкретных ошибках
