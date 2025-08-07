# D-ID API Endpoints Responses Guide
## Подробное описание ответов от каждого endpoint D-ID API

### 📋 Содержание
1. [Обзор API](#обзор-api)
2. [Step 1: Create Stream Response](#step-1-create-stream-response)
3. [Step 2: Start Stream Response](#step-2-start-stream-response)
4. [Step 3: Submit ICE Response](#step-3-submit-ice-response)
5. [Step 4: Create Talk Response](#step-4-create-talk-response)
6. [Step 5: Close Stream Response](#step-5-close-stream-response)
7. [Дополнительные Endpoints](#дополнительные-endpoints)
8. [Ошибки и их значения](#ошибки-и-их-значения)

---

## Обзор API

D-ID Streaming API предоставляет 5 основных endpoints для создания интерактивных видео-стримов. Каждый endpoint возвращает специфические данные, необходимые для следующего шага процесса.

---

## Step 1: Create Stream Response

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams
```

### 📊 Полный ответ (Status: 201)
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

### 🔍 Детальное описание полей

#### `id` (string)
- **Описание:** Уникальный идентификатор стрима
- **Формат:** `strm_` + случайная строка + `_EKS`
- **Пример:** `"strm_nTs8RxTqoGr7LHF9-g7pY_EKS"`
- **Использование:** Передается во всех последующих запросах как `{stream_id}`

#### `offer` (object)
- **Описание:** SDP (Session Description Protocol) offer для WebRTC соединения
- **Содержит:**
  - `type`: Всегда `"offer"`
  - `sdp`: Полное SDP описание в текстовом формате

##### SDP структура включает:
- **Медиа секции:** audio, video, application
- **ICE параметры:** ufrag, pwd, candidates
- **Кодеки:** opus для аудио, H264 для видео
- **Сетевые настройки:** IP адреса, порты, протоколы

#### `ice_servers` (array)
- **Описание:** Список STUN/TURN серверов для ICE соединения
- **Каждый сервер содержит:**
  - `urls`: Массив URL серверов (STUN/TURN)
  - `username`: Уникальное имя пользователя для TURN
  - `credential`: Пароль для TURN сервера

##### Типы серверов:
- **STUN:** `stun:stun.cloudflare.com:3478` - для обнаружения публичного IP
- **TURN:** `turn:turn.cloudflare.com:3478?transport=udp` - для NAT traversal
- **TURNS:** `turns:turn.cloudflare.com:5349?transport=tcp` - защищенный TURN

#### `session_id` (string)
- **Описание:** Идентификатор сессии AWS ALB (Application Load Balancer)
- **Формат:** AWS cookie с временем истечения
- **Использование:** Передается во всех последующих запросах
- **Время жизни:** Обычно 5 минут

---

## Step 2: Start Stream Response

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}/sdp
```

### 📊 Полный ответ (Status: 200)
```json
{
  "session_id": "AWSALB=QfZUlDobPKlWY0c9z38OND8ZoWQG3yi5aSAmvX+e/gAaYT8P0TVQ86+L+lw3Yjjs0VtIBHD+mM/D59Jh3kNX1sqM3bcWEa8Lic2oAvf5ZjTtPZY2Rx11cIGYrUZI; Expires=Thu, 14 Aug 2025 15:15:55 GMT; Path=/; AWSALBCORS=QfZUlDobPKlWY0c9z38OND8ZoWQG3yi5aSAmvX+e/gAaYT8P0TVQ86+L+lw3Yjjs0VtIBHD+mM/D59Jh3kNX1sqM3bcWEa8Lic2oAvf5ZjTtPZY2Rx11cIGYrUZI; Expires=Thu, 14 Aug 2025 15:15:55 GMT; Path=/; SameSite=None; Secure"
}
```

### 🔍 Детальное описание полей

#### `session_id` (string)
- **Описание:** Обновленный идентификатор сессии
- **Формат:** AWS ALB cookie с новым временем истечения
- **Использование:** Заменяет предыдущий session_id в последующих запросах
- **Время жизни:** Обновляется при каждом запросе

### ⚠️ Важные моменты
- **Статус 200** означает успешное установление WebRTC соединения
- **Session ID обновляется** - используйте новый в следующих запросах
- **Соединение готово** для передачи медиа данных

---

## Step 3: Submit ICE Response

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}/ice
```

### 📊 Полный ответ (Status: 200)
```json
{
  "status": "created",
  "session_id": "AWSALB=TUFXx21Mn8x3AXgYz5+et3NIiIJD03QhFUueulYPbAdar04i8qHzKvfqTI69V2UhNGsutuuSivkXwWpac4TLm/WkouDuF9qw1MXUiE1tg2GclJdU9wWYGCr7VbWr; Expires=Thu, 14 Aug 2025 15:15:56 GMT; Path=/; AWSALBCORS=TUFXx21Mn8x3AXgYz5+et3NIiIJD03QhFUueulYPbAdar04i8qHzKvfqTI69V2UhNGsutuuSivkXwWpac4TLm/WkouDuF9qw1MXUiE1tg2GclJdU9wWYGCr7VbWr; Expires=Thu, 14 Aug 2025 15:15:56 GMT; Path=/; SameSite=None; Secure"
}
```

### 🔍 Детальное описание полей

#### `status` (string)
- **Описание:** Статус обработки ICE candidate
- **Возможные значения:**
  - `"created"` - ICE candidate успешно обработан
  - `"updated"` - ICE candidate обновлен
  - `"failed"` - Ошибка обработки ICE candidate

#### `session_id` (string)
- **Описание:** Обновленный идентификатор сессии
- **Использование:** Заменяет предыдущий session_id
- **Время жизни:** Обновляется при каждом запросе

### ⚠️ Важные моменты
- **Статус "created"** означает успешную обработку ICE candidate
- **Session ID обновляется** при каждом ICE запросе
- **Соединение укрепляется** с каждым новым ICE candidate

---

## Step 4: Create Talk Response

### 📡 Endpoint
```
POST https://api.d-id.com/talks/streams/{stream_id}
```

### 📊 Полный ответ (Status: 200)
```json
{
  "status": "started",
  "video_id": "tlk_uZ0XLz1M1tzdQkeT_wQM1"
}
```

### 🔍 Детальное описание полей

#### `status` (string)
- **Описание:** Статус создания talk стрима
- **Возможные значения:**
  - `"started"` - Talk стрим успешно создан и запущен
  - `"processing"` - Talk в процессе обработки
  - `"failed"` - Ошибка создания talk
  - `"completed"` - Talk завершен

#### `video_id` (string)
- **Описание:** Уникальный идентификатор видео
- **Формат:** `tlk_` + случайная строка
- **Пример:** `"tlk_uZ0XLz1M1tzdQkeT_wQM1"`
- **Использование:** Для отслеживания статуса видео, получения метаданных

### 🎯 Дополнительные возможные поля

#### При ошибке (Status: 400/403)
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

#### При успешном создании с дополнительными данными
```json
{
  "status": "started",
  "video_id": "tlk_uZ0XLz1M1tzdQkeT_wQM1",
  "duration": 15.5,
  "size": 2048576,
  "format": "mp4"
}
```

---

## Step 5: Close Stream Response

### 📡 Endpoint
```
DELETE https://api.d-id.com/talks/streams/{stream_id}
```

### 📊 Полный ответ (Status: 200)
```json
""
```

### 🔍 Детальное описание

#### Пустой ответ
- **Описание:** Подтверждение успешного закрытия стрима
- **Значение:** Пустая строка `""`
- **Статус:** 200 OK

### ⚠️ Важные моменты
- **Пустой ответ** означает успешное закрытие
- **Ресурсы освобождены** на сервере
- **WebRTC соединение разорвано**
- **Сессия завершена**

---

## Дополнительные Endpoints

### 📊 Get Stream Status

#### Endpoint
```
GET https://api.d-id.com/talks/streams/{stream_id}
```

#### Response (Status: 200)
```json
{
  "id": "strm_nTs8RxTqoGr7LHF9-g7pY_EKS",
  "status": "active",
  "created_at": "2025-08-07T15:15:53Z",
  "updated_at": "2025-08-07T15:15:55Z",
  "session_id": "AWSALB=...",
  "video_id": "tlk_uZ0XLz1M1tzdQkeT_wQM1"
}
```

### 📊 Get Talk Status

#### Endpoint
```
GET https://api.d-id.com/talks/{video_id}
```

#### Response (Status: 200)
```json
{
  "id": "tlk_uZ0XLz1M1tzdQkeT_wQM1",
  "status": "done",
  "created_at": "2025-08-07T15:15:55Z",
  "updated_at": "2025-08-07T15:16:10Z",
  "result_url": "https://d-id-talks-prod.s3.amazonaws.com/...",
  "duration": 15.5,
  "size": 2048576
}
```

---

## Ошибки и их значения

### 🔴 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```
**Причина:** Неверный API ключ или формат авторизации
**Решение:** Проверить API ключ и headers

### 🔴 400 Bad Request
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
**Причина:** Неверный формат payload
**Решение:** Проверить структуру запроса согласно документации

### 🔴 403 Forbidden
```json
{
  "message": "Authorization header requires 'Credential' parameter"
}
```
**Причина:** Неверный формат Authorization header
**Решение:** Использовать правильный формат Basic Auth

### 🔴 404 Not Found
```json
{
  "message": "Stream not found"
}
```
**Причина:** Неверный stream_id
**Решение:** Проверить правильность ID стрима

### 🔴 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```
**Причина:** Ошибка на стороне сервера
**Решение:** Повторить запрос позже

---

## 📊 Сводная таблица ответов

| Endpoint | Status | Основные поля | Описание |
|----------|--------|---------------|----------|
| `POST /talks/streams` | 201 | `id`, `offer`, `ice_servers`, `session_id` | Создание стрима |
| `POST /talks/streams/{id}/sdp` | 200 | `session_id` | Запуск стрима |
| `POST /talks/streams/{id}/ice` | 200 | `status`, `session_id` | ICE candidate |
| `POST /talks/streams/{id}` | 200 | `status`, `video_id` | Создание talk |
| `DELETE /talks/streams/{id}` | 200 | `""` | Закрытие стрима |
| `GET /talks/streams/{id}` | 200 | `status`, `video_id`, `session_id` | Статус стрима |
| `GET /talks/{video_id}` | 200 | `status`, `result_url`, `duration` | Статус talk |

---

## 🎯 Практические рекомендации

### 📝 Обработка ответов
1. **Всегда проверяйте статус код** перед обработкой данных
2. **Сохраняйте session_id** между запросами
3. **Обрабатывайте ошибки** согласно их типам
4. **Используйте video_id** для отслеживания прогресса

### 🔄 Session Management
1. **Session ID обновляется** при каждом запросе
2. **Используйте последний полученный** session_id
3. **Сессия истекает** через 5 минут неактивности
4. **Всегда закрывайте стримы** после использования

### 📡 WebRTC Best Practices
1. **SDP offer** содержит полную информацию о медиа
2. **ICE servers** необходимы для NAT traversal
3. **ICE candidates** укрепляют соединение
4. **Соединение готово** после Step 2

---

*Документ создан на основе реального тестирования D-ID API*  
*Последнее обновление: Август 2025*
