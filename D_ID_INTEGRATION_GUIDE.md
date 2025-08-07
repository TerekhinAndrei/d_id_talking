# D-ID Integration Guide for Voice Changer

## 🎯 Цель
Интегрировать обработанное аудио от ElevenLabs в D-ID для анимации аватара в реальном времени.

## 🔧 Текущая архитектура

### 1. Frontend (React)
- **Web Audio API**: Захват сырых PCM данных с микрофона
- **WebSocket**: Отправка бинарных аудио данных на бэкенд
- **AudioContext**: Воспроизведение обработанного аудио

### 2. Backend (FastAPI)
- **WebSocket Server**: Прием бинарных данных от клиента
- **ElevenLabs WebSocket Client**: Потоковая обработка аудио
- **Binary Relay**: Пересылка обработанного аудио обратно клиенту

### 3. ElevenLabs
- **Streaming API**: Real-time Speech-to-Speech
- **WebSocket Protocol**: Бинарная передача аудио данных

## 🚀 Следующие шаги для D-ID интеграции

### Шаг 1: Создать D-ID WebRTC соединение

```javascript
// В VoiceChanger.jsx
const setupDIdConnection = async () => {
  try {
    // 1. Получить D-ID session
    const response = await fetch('http://localhost:8000/api/v1/webrtc/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_id: 'your-avatar-id',
        voice_id: selectedVoice
      })
    });
    
    const sessionData = await response.json();
    
    // 2. Создать RTCPeerConnection
    const peerConnection = new RTCPeerConnection({
      iceServers: sessionData.ice_servers
    });
    
    // 3. Добавить аудио дорожку для отправки в D-ID
    const audioTrack = new MediaStreamTrack();
    peerConnection.addTrack(audioTrack);
    
    // 4. Установить соединение
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // 5. Отправить offer в D-ID
    const webrtcResponse = await fetch('http://localhost:8000/api/v1/webrtc/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionData.session_id,
        offer: offer
      })
    });
    
    const webrtcData = await webrtcResponse.json();
    await peerConnection.setRemoteDescription(webrtcData.answer);
    
    // 6. Получить видео поток от D-ID
    peerConnection.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    
    dIdPeerConnectionRef.current = peerConnection;
    
  } catch (error) {
    console.error('D-ID connection failed:', error);
  }
};
```

### Шаг 2: Отправить обработанное аудио в D-ID

```javascript
// Обновить processAudioForDId функцию
const processAudioForDId = (audioBuffer) => {
  console.log('Received audio for D-ID:', audioBuffer.byteLength, 'bytes');
  
  if (dIdPeerConnectionRef.current) {
    // 1. Декодировать аудио в AudioBuffer
    audioContextRef.current.decodeAudioData(audioBuffer).then(decodedBuffer => {
      // 2. Создать MediaStream из AudioBuffer
      const audioSource = audioContextRef.current.createBufferSource();
      audioSource.buffer = decodedBuffer;
      
      // 3. Создать MediaStreamDestination
      const destination = audioContextRef.current.createMediaStreamDestination();
      audioSource.connect(destination);
      
      // 4. Получить аудио дорожку
      const audioTrack = destination.stream.getAudioTracks()[0];
      
      // 5. Заменить аудио дорожку в D-ID соединении
      const sender = dIdPeerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'audio'
      );
      
      if (sender) {
        sender.replaceTrack(audioTrack);
      }
      
      // 6. Воспроизвести аудио
      audioSource.start(0);
      
    }).catch(error => {
      console.error('Error processing audio for D-ID:', error);
      // Fallback: локальное воспроизведение
      playLocalAudioChunk(audioBuffer);
    });
  } else {
    // Fallback: локальное воспроизведение
    playLocalAudioChunk(audioBuffer);
  }
};
```

### Шаг 3: Backend WebRTC endpoints

```python
# app/api/v1/endpoints/webrtc.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.webrtc_service import WebRTCService

router = APIRouter()

class CreateSessionRequest(BaseModel):
    avatar_id: str
    voice_id: str

class ConnectRequest(BaseModel):
    session_id: str
    offer: dict

@router.post("/create-session")
async def create_session(request: CreateSessionRequest):
    """Create D-ID WebRTC session"""
    try:
        webrtc_service = WebRTCService()
        session_data = await webrtc_service.create_session(
            avatar_id=request.avatar_id,
            voice_id=request.voice_id
        )
        return session_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/connect")
async def connect_webrtc(request: ConnectRequest):
    """Connect to D-ID WebRTC session"""
    try:
        webrtc_service = WebRTCService()
        answer = await webrtc_service.connect(
            session_id=request.session_id,
            offer=request.offer
        )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🔄 Полный поток данных

1. **Микрофон** → Web Audio API → PCM 16-bit
2. **Frontend** → WebSocket → Binary Audio Data
3. **Backend** → ElevenLabs WebSocket → Processed Audio
4. **Backend** → WebSocket → Binary Processed Audio
5. **Frontend** → D-ID WebRTC → Animated Avatar
6. **D-ID** → WebRTC → Video Stream → Frontend

## ⚠️ Важные моменты

### Синхронизация аудио и видео
- Аудио должно быть синхронизировано с видео потоком от D-ID
- Использовать `audioContext.currentTime` для точной синхронизации

### Обработка ошибок
- Fallback на локальное воспроизведение при ошибках D-ID
- Автоматическое переподключение при разрыве соединения

### Производительность
- Оптимизировать размер аудио чанков для минимальной задержки
- Использовать Web Workers для обработки аудио в фоне

## 🎯 Результат

После полной интеграции пользователь сможет:
1. Говорить в микрофон
2. Слышать свой голос, измененный через ElevenLabs
3. Видеть анимированного аватара D-ID, говорящего измененным голосом
4. Все в реальном времени с минимальной задержкой
