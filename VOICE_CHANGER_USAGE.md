# 🎤 Voice Changer - Real-time Streaming

## ✅ Исправленная архитектура

### 🔧 Что было исправлено:

1. **Правильный ElevenLabs SDK**: Используем официальный Python SDK вместо WebSocket
2. **Бинарная передача данных**: WebSocket отправляет ArrayBuffer вместо base64
3. **Real-time обработка**: Минимальная задержка с правильным streaming
4. **Web Audio API**: Захват сырых PCM данных с микрофона

### 🚀 Как использовать:

1. **Запустите сервер**:
   ```bash
   python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Запустите фронтенд**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Откройте браузер**: http://localhost:5173

4. **Используйте Voice Changer**:
   - Выберите голос из списка
   - Нажмите "Начать запись"
   - Говорите в микрофон
   - Слушайте обработанное аудио в реальном времени

### 🔄 Поток данных:

1. **Микрофон** → Web Audio API → PCM 16-bit
2. **Frontend** → WebSocket → Binary Audio Data
3. **Backend** → ElevenLabs SDK → Streaming Audio
4. **Backend** → WebSocket → Binary Processed Audio
5. **Frontend** → AudioContext → Real-time Playback

### 📁 Ключевые файлы:

- **`frontend/src/components/VoiceChanger.jsx`**: Основной компонент
- **`app/api/v1/endpoints/streaming.py`**: WebSocket эндпоинт
- **`app/services/elevenlabs_service.py`**: ElevenLabs SDK интеграция
- **`test_elevenlabs_sdk.py`**: Тест SDK функциональности

### ⚠️ Важные моменты:

- **API Key**: Убедитесь, что `ELEVENLABS_API_KEY` установлен в `.env`
- **Микрофон**: Разрешите доступ к микрофону в браузере
- **WebSocket**: Соединение должно быть стабильным
- **Аудио**: Обработанное аудио воспроизводится локально

### 🎯 Результат:

- Real-time voice changing с минимальной задержкой
- Потоковая обработка аудио через ElevenLabs
- Современный Web Audio API для захвата
- Эффективная бинарная передача данных

### 🔮 Следующие шаги:

1. **D-ID интеграция**: Добавить анимацию аватара
2. **Speech-to-Speech**: Реализовать настоящий STS
3. **Оптимизация**: Улучшить производительность
4. **UI/UX**: Улучшить интерфейс пользователя
