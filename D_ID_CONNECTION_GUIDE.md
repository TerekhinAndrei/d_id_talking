# D-ID API Connection Guide
## Полное руководство по подключению к D-ID Streaming API

### 📋 Содержание
1. [Обзор](#обзор)
2. [Настройка авторизации](#настройка-авторизации)
3. [Step 1: Create a new stream](#step-1-create-a-new-stream)
4. [Step 2: Starting the stream](#step-2-starting-the-stream)
5. [Step 3: Submit network information](#step-3-submit-network-information)
6. [Step 4: Create a talk stream](#step-4-create-a-talk-stream)
7. [Step 5: Closing the stream](#step-5-closing-the-stream)
8. [Примеры кода](#примеры-кода)
9. [Обработка ошибок](#обработка-ошибок)
10. [Лучшие практики](#лучшие-практики)

---

## Обзор

D-ID Streaming API позволяет создавать интерактивные видео-стримы с анимированными аватарами. Процесс состоит из 5 основных шагов, каждый из которых должен быть выполнен последовательно.

### 🔑 Ключевые особенности
- **WebRTC соединение** для реального времени
- **Поддержка различных TTS провайдеров** (ElevenLabs, Microsoft)
- **Гибкая конфигурация** стримов
- **Автоматическое управление сессиями**

---

## Настройка авторизации

### API Key Format
D-ID API использует Basic Authentication с base64-кодированным API ключом.

```python
import base64

# Формат API ключа: username:password
api_key_raw = "username:password"
api_key_encoded = base64.b64encode(api_key_raw.encode()).decode()

headers = {
    "accept": "application/json",
    "content-type": "application/json", 
    "authorization": f"Basic {api_key_encoded}"
}
```

### 🔧 Конфигурация
```python
BASE_URL = "https://api.d-id.com"
API_KEY = "your_username:your_password"  # Из .env файла
```

---

## Step 1: Create a new stream

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams
```

### 📦 Request Payload
```json
{
  "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
}
```

### 📊 Response (Status: 201)
```json
{
  "id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "offer": {
    "type": "offer",
    "sdp": "v=0\r\no=- 1754579753355781 1 IN IP4 34.211.231.128\r\ns=Mountpoint 5323444364835420\r\nt=0 0\r\na=group:BUNDLE a v d\r\na=ice-options:trickle\r\na=fingerprint:sha-256 C6:F0:4D:15:99:C8:62:EA:52:B0:BB:BD:CD:B9:4C:5E:0C:25:DC:99:F8:32:5A:23:E3:00:41:FD:19:08:CA:AA\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS *\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 34.211.231.128\r\na=sendonly\r\na=mid:a\r\na=rtcp-mux\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=msid:janus janusa\r\na=ssrc:1074925109 cname:janus\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\nm=video 9 UDP/TLS/RTP/SAVPF 102 103\r\nc=IN IP4 34.211.231.128\r\na=sendonly\r\na=mid:v\r\na=rtcp-mux\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=ssrc-group:FID 1921864265 4135579043\r\na=msid:janus janusv\r\na=ssrc:1921864265 cname:janus\r\na=ssrc:4135579043 cname:janus\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 34.211.231.128\r\na=sendrecv\r\na=mid:d\r\na=sctp-port:5000\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\n"
  },
  "ice_servers": [
    {
      "urls": [
        "stun:stun.cloudflare.com:3478",
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turn:turn.cloudflare.com:3478?transport=tcp",
        "turns:turn.cloudflare.com:5349?transport=tcp",
        "turn:turn.cloudflare.com:80?transport=tcp",
        "turns:turn.cloudflare.com:443?transport=tcp"
      ],
      "username": "g0ae145e29b47ed282809217f470f0a9fb90d85af12ba24f461cceb51d113e03",
      "credential": "ff6f9cb4c36bb043bbe752e7c90a81299ec932c12b037125f1211d93602ec726"
    }
  ],
  "session_id": "AWSALB=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; AWSALBCORS=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; SameSite=None; Secure"
}
```

### 🔍 Важные поля ответа
- **`id`** - уникальный идентификатор стрима
- **`offer.sdp`** - SDP offer для WebRTC
- **`ice_servers`** - серверы для ICE соединения
- **`session_id`** - идентификатор сессии (используется в последующих запросах)

---

## Step 2: Starting the stream

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}/sdp
```

### 📦 Request Payload
```json
{
  "answer": {
    "type": "answer",
    "sdp": "v=0\r\no=- 1754579753355781 1 IN IP4 34.211.231.128\r\ns=Mountpoint 5323444364835420\r\nt=0 0\r\na=group:BUNDLE a v d\r\na=ice-options:trickle\r\na=fingerprint:sha-256 C6:F0:4D:15:99:C8:62:EA:52:B0:BB:BD:CD:B9:4C:5E:0C:25:DC:99:F8:32:5A:23:E3:00:41:FD:19:08:CA:AA\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS *\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 34.211.231.128\r\na=recvonly\r\na=mid:a\r\na=rtcp-mux\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=msid:janus janusa\r\na=ssrc:1074925109 cname:janus\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\nm=video 9 UDP/TLS/RTP/SAVPF 102 103\r\nc=IN IP4 34.211.231.128\r\na=recvonly\r\na=mid:v\r\na=rtcp-mux\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=ssrc-group:FID 1921864265 4135579043\r\na=msid:janus janusv\r\na=ssrc:1921864265 cname:janus\r\na=ssrc:4135579043 cname:janus\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 34.211.231.128\r\na=sendrecv\r\na=mid:d\r\na=sctp-port:5000\r\na=ice-ufrag:4xNR\r\na=ice-pwd:o8AGLQsp+BsVm9uOsYhw2A\r\na=ice-options:trickle\r\na=setup:actpass\r\na=candidate:1 1 udp 2015363327 34.211.231.128 63959 typ host\r\na=candidate:2 1 udp 2015363583 34.211.231.128 45571 typ host\r\na=end-of-candidates\r\n"
  },
  "session_id": "AWSALB=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; AWSALBCORS=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; SameSite=None; Secure"
}
```

### 📊 Response (Status: 200)
```json
{
  "session_id": "AWSALB=QfZUlDobPKlWY0c9z38OND8ZoWQG3yi5aSAmvX+e/gAaYT8P0TVQ86+L+lw3Yjjs0VtIBHD+mM/D59Jh3kNX1sqM3bcWEa8Lic2oAvf5ZjTtPZY2Rx11cIGYrUZI; Expires=Thu, 14 Aug 2025 15:15:55 GMT; Path=/; AWSALBCORS=QfZUlDobPKlWY0c9z38OND8ZoWQG3yi5aSAmvX+e/gAaYT8P0TVQ86+L+lw3Yjjs0VtIBHD+mM/D59Jh3kNX1sqM3bcWEa8Lic2oAvf5ZjTtPZY2Rx11cIGYrUZI; Expires=Thu, 14 Aug 2025 15:15:55 GMT; Path=/; SameSite=None; Secure"
}
```

### ⚠️ Важные моменты
- SDP answer должен быть **объектом** с полями `type` и `sdp`
- Замените `a=sendonly` на `a=recvonly` в SDP
- Обязательно передавайте `session_id`

---

## Step 3: Submit network information

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}/ice
```

### 📦 Request Payload
```json
{
  "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
  "sdpMid": "0",
  "sdpMLineIndex": 0,
  "session_id": "AWSALB=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; AWSALBCORS=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; SameSite=None; Secure"
}
```

### 📊 Response (Status: 200)
```json
{
  "status": "created",
  "session_id": "AWSALB=TUFXx21Mn8x3AXgYz5+et3NIiIJD03QhFUueulYPbAdar04i8qHzKvfqTI69V2UhNGsutuuSivkXwWpac4TLm/WkouDuF9qw1MXUiE1tg2GclJdU9wWYGCr7VbWr; Expires=Thu, 14 Aug 2025 15:15:56 GMT; Path=/; AWSALBCORS=TUFXx21Mn8x3AXgYz5+et3NIiIJD03QhFUueulYPbAdar04i8qHzKvfqTI69V2UhNGsutuuSivkXwWpac4TLm/WkouDuF9qw1MXUiE1tg2GclJdU9wWYGCr7VbWr; Expires=Thu, 14 Aug 2025 15:15:56 GMT; Path=/; SameSite=None; Secure"
}
```

### 🔍 Поля ICE candidate
- **`candidate`** - строка ICE candidate
- **`sdpMid`** - идентификатор медиа-секции
- **`sdpMLineIndex`** - индекс медиа-линии
- **`session_id`** - идентификатор сессии

---

## Step 4: Create a talk stream

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}
```

### 📦 Request Payload
```json
{
  "script": {
    "type": "text",
    "provider": {
      "type": "elevenlabs",
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "input": "Hello! This is a test of the D-ID streaming API."
  },
  "config": {
    "fluent": "false",
    "pad_audio": "0.0"
  },
  "session_id": "AWSALB=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; AWSALBCORS=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; SameSite=None; Secure"
}
```

### 📊 Response (Status: 200)
```json
{
  "status": "started",
  "video_id": "tlk_uZ0XLz1M1tzdQkeT_wQM1"
}
```

### 🎯 Поддерживаемые провайдеры TTS

#### ElevenLabs
```json
{
  "type": "elevenlabs",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

#### Microsoft
```json
{
  "type": "microsoft",
  "voice_id": "en-US-JennyNeural"
}
```

#### Google
```json
{
  "type": "google",
  "voice_id": "en-US-Standard-A"
}
```

### ⚙️ Конфигурация
- **`fluent`** - плавность речи (true/false)
- **`pad_audio`** - пауза в секундах (0.0-10.0)

---

## Step 5: Closing the stream

### 📡 Endpoint
```
DELETE https://api.d-id.com/talks/streams/{stream_id}
```

### 📦 Request Payload
```json
{
  "session_id": "AWSALB=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; AWSALBCORS=fNF18bvj9qBkveSGtacl4h7SxABz0Z+HGRE6oLFLp6GTudnlFI0X2o/seaWsjqFT/g3MzTMOglDI+3fhH27fe4Nl2B+L3WCd/+ee2VvWPZEsqtV/oK5J2VDjBory; Expires=Thu, 14 Aug 2025 15:15:53 GMT; Path=/; SameSite=None; Secure"
}
```

### 📊 Response (Status: 200)
```json
""
```

---

## Примеры кода

### Python Implementation
```python
import requests
import base64
import json
from dotenv import load_dotenv
import os

load_dotenv()

class DIdStreamingClient:
    def __init__(self):
        self.base_url = "https://api.d-id.com"
        self.api_key = os.getenv("D_ID_API_KEY")
        
        # Encode API key
        if self.api_key and ":" in self.api_key:
            self.api_key_encoded = base64.b64encode(self.api_key.encode()).decode()
        else:
            self.api_key_encoded = self.api_key
            
        self.headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Basic {self.api_key_encoded}"
        }
        
        self.stream_id = None
        self.session_id = None
    
    def create_stream(self, image_url):
        """Step 1: Create a new stream"""
        url = f"{self.base_url}/talks/streams"
        payload = {"source_url": image_url}
        
        response = requests.post(url, json=payload, headers=self.headers)
        
        if response.status_code == 201:
            data = response.json()
            self.stream_id = data["id"]
            self.session_id = data["session_id"]
            return {
                "success": True,
                "stream_id": self.stream_id,
                "session_id": self.session_id,
                "sdp_offer": data["offer"]["sdp"],
                "ice_servers": data["ice_servers"]
            }
        else:
            return {"success": False, "error": response.text}
    
    def start_stream(self, sdp_answer):
        """Step 2: Start the stream"""
        url = f"{self.base_url}/talks/streams/{self.stream_id}/sdp"
        payload = {
            "answer": {
                "type": "answer",
                "sdp": sdp_answer
            },
            "session_id": self.session_id
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        return response.status_code == 200
    
    def submit_ice_candidate(self, candidate, sdp_mid, sdp_m_line_index):
        """Step 3: Submit ICE candidate"""
        url = f"{self.base_url}/talks/streams/{self.stream_id}/ice"
        payload = {
            "candidate": candidate,
            "sdpMid": sdp_mid,
            "sdpMLineIndex": sdp_m_line_index,
            "session_id": self.session_id
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        return response.status_code == 200
    
    def create_talk(self, text, voice_id="21m00Tcm4TlvDq8ikWAM"):
        """Step 4: Create talk stream"""
        url = f"{self.base_url}/talks/streams/{self.stream_id}"
        payload = {
            "script": {
                "type": "text",
                "provider": {
                    "type": "elevenlabs",
                    "voice_id": voice_id
                },
                "input": text
            },
            "config": {
                "fluent": "false",
                "pad_audio": "0.0"
            },
            "session_id": self.session_id
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "status": data["status"],
                "video_id": data["video_id"]
            }
        else:
            return {"success": False, "error": response.text}
    
    def close_stream(self):
        """Step 5: Close the stream"""
        url = f"{self.base_url}/talks/streams/{self.stream_id}"
        payload = {"session_id": self.session_id}
        
        response = requests.delete(url, json=payload, headers=self.headers)
        return response.status_code == 200

# Usage example
client = DIdStreamingClient()

# Step 1: Create stream
result = client.create_stream("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face")
if result["success"]:
    print(f"Stream created: {result['stream_id']}")
    
    # Step 2: Start stream (simplified SDP answer)
    sdp_answer = result["sdp_offer"].replace("a=sendonly", "a=recvonly")
    if client.start_stream(sdp_answer):
        print("Stream started")
        
        # Step 3: Submit ICE candidate
        if client.submit_ice_candidate("candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host", "0", 0):
            print("ICE candidate submitted")
            
            # Step 4: Create talk
            talk_result = client.create_talk("Hello! This is a test.")
            if talk_result["success"]:
                print(f"Talk created: {talk_result['video_id']}")
                
                # Step 5: Close stream
                if client.close_stream():
                    print("Stream closed")
```

### JavaScript Implementation
```javascript
class DIdStreamingClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.d-id.com';
        this.apiKey = btoa(apiKey); // Base64 encode
        this.streamId = null;
        this.sessionId = null;
    }
    
    async createStream(imageUrl) {
        const response = await fetch(`${this.baseUrl}/talks/streams`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source_url: imageUrl
            })
        });
        
        if (response.status === 201) {
            const data = await response.json();
            this.streamId = data.id;
            this.sessionId = data.session_id;
            return data;
        } else {
            throw new Error(`Failed to create stream: ${response.statusText}`);
        }
    }
    
    async startStream(sdpAnswer) {
        const response = await fetch(`${this.baseUrl}/talks/streams/${this.streamId}/sdp`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answer: {
                    type: 'answer',
                    sdp: sdpAnswer
                },
                session_id: this.sessionId
            })
        });
        
        return response.status === 200;
    }
    
    async submitIceCandidate(candidate, sdpMid, sdpMLineIndex) {
        const response = await fetch(`${this.baseUrl}/talks/streams/${this.streamId}/ice`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                candidate,
                sdpMid,
                sdpMLineIndex,
                session_id: this.sessionId
            })
        });
        
        return response.status === 200;
    }
    
    async createTalk(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
        const response = await fetch(`${this.baseUrl}/talks/streams/${this.streamId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                script: {
                    type: 'text',
                    provider: {
                        type: 'elevenlabs',
                        voice_id: voiceId
                    },
                    input: text
                },
                config: {
                    fluent: 'false',
                    pad_audio: '0.0'
                },
                session_id: this.sessionId
            })
        });
        
        if (response.status === 200) {
            return await response.json();
        } else {
            throw new Error(`Failed to create talk: ${response.statusText}`);
        }
    }
    
    async closeStream() {
        const response = await fetch(`${this.baseUrl}/talks/streams/${this.streamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: this.sessionId
            })
        });
        
        return response.status === 200;
    }
}

// Usage example
const client = new DIdStreamingClient('username:password');

async function runStreamingExample() {
    try {
        // Step 1: Create stream
        const streamData = await client.createStream('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face');
        console.log('Stream created:', streamData.id);
        
        // Step 2: Start stream
        const sdpAnswer = streamData.offer.sdp.replace(/a=sendonly/g, 'a=recvonly');
        const started = await client.startStream(sdpAnswer);
        console.log('Stream started:', started);
        
        // Step 3: Submit ICE candidate
        const iceSubmitted = await client.submitIceCandidate(
            'candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host',
            '0',
            0
        );
        console.log('ICE candidate submitted:', iceSubmitted);
        
        // Step 4: Create talk
        const talkResult = await client.createTalk('Hello! This is a test.');
        console.log('Talk created:', talkResult);
        
        // Step 5: Close stream
        const closed = await client.closeStream();
        console.log('Stream closed:', closed);
        
    } catch (error) {
        console.error('Error:', error);
    }
}
```

---

## Обработка ошибок

### 🔴 Common Error Codes

#### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```
**Решение:** Проверьте правильность API ключа и его формат.

#### 400 Bad Request
```json
{
  "kind": "ValidationError",
  "description": "validation failed",
  "details": {
    "body.script": {
      "message": "Could not match the union against any of the items"
    }
  }
}
```
**Решение:** Проверьте формат payload согласно документации.

#### 403 Forbidden
```json
{
  "message": "Authorization header requires 'Credential' parameter"
}
```
**Решение:** Убедитесь, что используете правильный формат headers.

#### 404 Not Found
```json
{
  "message": "Stream not found"
}
```
**Решение:** Проверьте правильность stream_id.

### 🛡️ Error Handling Best Practices

```python
def handle_d_id_error(response):
    """Handle D-ID API errors"""
    if response.status_code == 401:
        raise Exception("Authentication failed. Check your API key.")
    elif response.status_code == 400:
        error_data = response.json()
        raise Exception(f"Validation error: {error_data.get('description', 'Unknown error')}")
    elif response.status_code == 403:
        raise Exception("Access forbidden. Check your API permissions.")
    elif response.status_code == 404:
        raise Exception("Resource not found. Check your stream ID.")
    elif response.status_code >= 500:
        raise Exception("Server error. Try again later.")
    else:
        raise Exception(f"Unexpected error: {response.status_code} - {response.text}")
```

---

## Лучшие практики

### 🔧 Configuration
1. **Храните API ключи в переменных окружения**
2. **Используйте правильный формат авторизации**
3. **Проверяйте статус ответов**

### 🔄 Session Management
1. **Сохраняйте session_id между запросами**
2. **Всегда закрывайте стримы после использования**
3. **Обрабатывайте таймауты сессий (5 минут)**

### 📡 WebRTC Best Practices
1. **Используйте правильный формат SDP**
2. **Обрабатывайте ICE candidates корректно**
3. **Проверяйте состояние соединения**

### 🎯 Performance Tips
1. **Используйте connection pooling**
2. **Кэшируйте ICE servers**
3. **Обрабатывайте ошибки сети**

### 🔒 Security
1. **Никогда не логируйте API ключи**
2. **Используйте HTTPS для всех запросов**
3. **Валидируйте входные данные**

---

## 📚 Дополнительные ресурсы

- [D-ID API Documentation](https://docs.d-id.com/)
- [WebRTC Specification](https://webrtc.org/specs/)
- [SDP Format Guide](https://tools.ietf.org/html/rfc4566)
- [ICE Protocol](https://tools.ietf.org/html/rfc5245)

---

*Последнее обновление: Август 2025*
