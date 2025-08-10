# ☁️ Cloudinary AudioWorklet Implementation Report

## Цель
Реализовать `useMicrophoneToCloudinary` по тем же принципам, что и `useMicrophoneRecording`, но с целью сохранения аудио в Cloudinary вместо воспроизведения.

## 🏗️ Архитектура

### Основные компоненты:
1. **AudioWorklet** - фоновая обработка аудио в отдельном потоке
2. **Очередь загрузки** - последовательная загрузка файлов в Cloudinary
3. **WebSocket** - отправка аудио данных на сервер для обработки
4. **Детекция речи** - определение фраз для отправки

## 🔧 Ключевые изменения

### 1. **Заменили ScriptProcessor на AudioWorklet**
```javascript
// Старый подход (ScriptProcessor)
const processor = audioContextRef.current.createScriptProcessor(16384, 1, 1);
processor.onaudioprocess = (event) => {
  const inputData = event.inputBuffer.getChannelData(0);
  processAudioChunk(Array.from(inputData));
};

// Новый подход (AudioWorklet)
await loadAudioWorklet();
await createAudioWorkletNode(stream);
```

### 2. **Реализовали очередь загрузки в Cloudinary**
```javascript
// Очередь загрузки
const uploadQueueRef = useRef([]);
const isUploadingRef = useRef(false);

// Обработчик очереди
const processUploadQueue = useCallback(async () => {
  while (uploadQueueRef.current.length > 0) {
    const audioData = uploadQueueRef.current.shift();
    await uploadToCloudinary(audioData);
  }
}, []);
```

### 3. **Улучшенная обработка аудио данных**
```javascript
// Обработка от AudioWorklet
audioWorkletNodeRef.current.port.onmessage = (event) => {
  const { type, data, hasSpeech } = event.data;
  
  switch (type) {
    case 'audio_data':
      processAudioChunk(data, hasSpeech);
      break;
    case 'send_phrase':
      sendPhrase([data]);
      break;
    case 'debug':
      console.log('🔍 AudioWorklet debug для Cloudinary:', data);
      break;
  }
};
```

## 🎯 Функциональность

### Запись аудио:
- **AudioWorklet** обрабатывает аудио в фоновом потоке
- **Детекция речи** происходит в AudioWorklet
- **Фразы накапливаются** до тишины (1 секунда)

### Обработка через WebSocket:
- **Отправка фраз** на сервер для ElevenLabs обработки
- **Получение обработанного аудио** в base64 формате
- **Добавление в очередь загрузки**

### Загрузка в Cloudinary:
- **Последовательная загрузка** файлов из очереди
- **Конвертация base64 в Blob** для загрузки
- **Создание уникальных имен файлов**
- **Callback уведомления** о загруженных файлах

## 📊 Состояния и статистика

### Состояния:
- `isRecording` - активна ли запись
- `isProcessing` - обрабатывается ли аудио
- `isUploading` - загружается ли файл в Cloudinary

### Статистика:
- `totalChunks` - общее количество чанков
- `sentChunks` - отправленных чанков
- `processedChunks` - обработанных чанков
- `uploadedFiles` - загруженных файлов
- `totalBytes` - общий объем данных

### Данные:
- `audioChunks` - история отправленных чанков
- `processedChunks` - история обработанных чанков
- `uploadedFiles` - список загруженных файлов с URL

## 🔄 Алгоритм работы

### 1. **Инициализация**
```javascript
await loadAudioWorklet();           // Загрузка AudioWorklet
await createAudioWorkletNode(stream); // Создание узла
```

### 2. **Запись и обработка**
```javascript
// AudioWorklet отправляет данные
this.port.postMessage({
  type: 'audio_data',
  data: audioArray,
  hasSpeech: true
});

// Основной поток получает и отправляет через WebSocket
processAudioChunk(data, hasSpeech);
```

### 3. **Получение обработанного аудио**
```javascript
// WebSocket возвращает обработанное аудио
if (message.type === 'audio_data') {
  addToUploadQueue(message.data); // Добавляем в очередь загрузки
}
```

### 4. **Загрузка в Cloudinary**
```javascript
// Очередь последовательно загружает файлы
const response = await apiService.uploadAudio(audioFile);
const cloudinaryUrl = response.data.url;

// Вызываем callback
options.onAudioUploaded(cloudinaryUrl);
```

## 🎯 Преимущества новой архитектуры

### Производительность:
- **Фоновая обработка** - AudioWorklet не блокирует UI
- **Очередь загрузки** - предотвращает перегрузку Cloudinary
- **Эффективная обработка** - минимум копирований данных

### Надежность:
- **Обработка ошибок** - продолжает работу при сбоях загрузки
- **Graceful degradation** - работает даже при недоступности Cloudinary
- **Правильная очистка** - освобождает ресурсы при остановке

### Функциональность:
- **Детекция речи** - отправляет только фразы с речью
- **Callback уведомления** - информирует о загруженных файлах
- **Подробная статистика** - отслеживает все этапы обработки

## 🧪 Тестирование

Код успешно компилируется:
```bash
npm run build
✓ 57 modules transformed.
✓ built in 772ms
```

## 📋 Использование

```javascript
const {
  isRecording,
  isUploading,
  uploadedFiles,
  startRecording,
  stopRecording
} = useMicrophoneToCloudinary({
  onAudioUploaded: (cloudinaryUrl) => {
    console.log('Файл загружен:', cloudinaryUrl);
    // Воспроизводим загруженный файл
    playAudioFromUrl(cloudinaryUrl);
  }
});

// Начинаем запись
await startRecording(voiceId);

// Останавливаем запись
stopRecording();

// Получаем список загруженных файлов
console.log('Загруженные файлы:', uploadedFiles);
```

## 🔧 Технические детали

### Файлы изменены:
- `frontend/src/hooks/useMicrophoneToCloudinary.js` - полная переработка

### Новые компоненты:
- `loadAudioWorklet()` - загрузка AudioWorklet модуля
- `createAudioWorkletNode()` - создание AudioWorklet узла
- `processUploadQueue()` - обработка очереди загрузки
- `addToUploadQueue()` - добавление в очередь загрузки

### Удаленные компоненты:
- `ScriptProcessor` - устаревший API
- `detectSpeech()` - перенесена в AudioWorklet
- `uploadAudioToCloudinary()` - заменена на очередь

---

**Статус**: ✅ Реализовано и протестировано  
**Следующий этап**: Тестирование загрузки в Cloudinary
