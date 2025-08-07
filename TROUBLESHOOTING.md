# 🔧 Troubleshooting - Voice Changer

## 🎯 Проблема: Аудио не воспроизводится

### ✅ Что было исправлено:

1. **Добавлено подробное логирование** для отслеживания потока данных
2. **Проверка уровня аудио** - отправка только при наличии звука
3. **Накопление чанков** - воспроизведение каждые 5 чанков
4. **Улучшенная обработка ошибок**

### 🔍 Как отладить:

#### 1. Откройте консоль браузера (F12):
Ищите сообщения с эмодзи:
- 🔌 Connecting to WebSocket
- ✅ WebSocket connected
- 📤 Sending config
- 📥 Received message
- 🎤 Audio level
- 📤 Sending audio chunk
- 🎵 Received audio chunk
- 🔊 Playing combined audio

#### 2. Проверьте последовательность логов:

**Правильная последовательность:**
```
🔌 Connecting to WebSocket: ws://localhost:8000/api/v1/streaming/ws/stream-audio/...
✅ WebSocket connected to backend
📤 Sending config: {type: "config", ...}
📥 Received message: {type: "status", message: "Configuration received, ready for audio"}
🎤 Audio level: 0.1234
📤 Sending audio chunk: 8192 bytes
🎵 Received audio chunk: 1024 bytes
📦 Audio chunks in queue: 1
🎵 Received audio chunk: 1024 bytes
📦 Audio chunks in queue: 2
...
🔊 Playing combined audio: 5120 bytes
✅ Audio ready to play
🎵 Audio playback started successfully!
```

#### 3. Возможные проблемы:

**A. Нет логов аудио уровня:**
- Проверьте разрешения микрофона
- Говорите громче
- Проверьте настройки браузера

**B. Нет отправки аудио чанков:**
- Проверьте WebSocket соединение
- Проверьте уровень аудио (должен быть > 0.01)

**C. Нет получения аудио чанков:**
- Проверьте логи сервера
- Проверьте API ключ ElevenLabs

**D. Аудио не воспроизводится:**
- Проверьте настройки звука браузера
- Проверьте, что звук включен
- Попробуйте другой браузер

### 🧪 Тесты:

#### Тест WebSocket:
```bash
python3 test_websocket_connection.py
```

#### Тест полного потока:
```bash
python3 test_audio_streaming.py
```

#### Тест ElevenLabs:
```bash
python3 test_elevenlabs_sdk.py
```

### 📝 Проверьте:

1. **API ключ**: `grep ELEVENLABS_API_KEY .env`
2. **Сервер**: `curl -X GET http://localhost:8000/api/v1/streaming/health`
3. **Браузер**: Chrome или Firefox
4. **Микрофон**: Разрешите доступ
5. **Звук**: Включите звук в браузере

### 🎯 Решение:

Если проблема остается:

1. **Проверьте консоль браузера** на ошибки
2. **Проверьте логи сервера** на ошибки
3. **Запустите тесты** выше
4. **Сообщите конкретные ошибки** из консоли

### 📞 Следующие шаги:

1. Откройте консоль браузера (F12)
2. Нажмите "Начать запись"
3. Говорите в микрофон
4. Проверьте логи в консоли
5. Сообщите, какие логи вы видите
