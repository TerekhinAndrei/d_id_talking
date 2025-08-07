import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [sdpData, setSdpData] = useState(null);
  const [sdpLoading, setSdpLoading] = useState(false);
  const [startingStream, setStartingStream] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [connectionState, setConnectionState] = useState('');
  const [iceCandidates, setIceCandidates] = useState([]);
  const [talkText, setTalkText] = useState('Привет! Это тестовое сообщение для аватара.');
  const [creatingTalk, setCreatingTalk] = useState(false);
  const [talkCreated, setTalkCreated] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [connectionReady, setConnectionReady] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel по умолчанию
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [textToProcess, setTextToProcess] = useState('');
  const [processingText, setProcessingText] = useState(false);
  
  const peerConnectionRef = useRef(null);
  const videoRef = useRef(null);

  // Загружаем голоса при монтировании компонента
  useEffect(() => {
    loadVoices();
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/streaming/elevenlabs-voices');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.voices) {
        setVoices(data.voices);
      } else {
        console.error('Failed to load voices:', data.error);
        // Устанавливаем голос по умолчанию если загрузка не удалась
        setVoices([{
          voice_id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          category: 'premade',
          description: 'Default voice'
        }]);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      // Устанавливаем голос по умолчанию при ошибке
      setVoices([{
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'premade',
        description: 'Default voice (fallback)'
      }]);
    } finally {
      setLoadingVoices(false);
    }
  };

  const startMicrophone = async () => {
    try {
      console.log('🎤 Starting microphone...');
      
      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      setMicrophoneStream(stream);
      setIsMicrophoneActive(true);
      
      // Создаем AudioContext для обработки аудио
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);
      
      // Создаем MediaRecorder для записи аудио
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setMediaRecorder(recorder);
      
      // Настраиваем обработку аудио данных
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Конвертируем в base64 для отправки на сервер
          const arrayBuffer = await event.data.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          // Отправляем аудио на сервер для обработки
          await sendAudioToServer(base64Audio);
        }
      };
      
      // Запускаем запись с интервалом 1 секунда
      recorder.start(1000);
      
      console.log('✅ Microphone started successfully');
      
    } catch (error) {
      console.error('❌ Error starting microphone:', error);
      alert('Ошибка доступа к микрофону. Пожалуйста, разрешите доступ к микрофону.');
    }
  };

  const stopMicrophone = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    setIsMicrophoneActive(false);
    setMicrophoneStream(null);
    setAudioContext(null);
    setMediaRecorder(null);
    
    console.log('🛑 Microphone stopped');
  };

  const sendAudioToServer = async (base64Audio) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/streaming/process-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          voice_id: selectedVoice
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Audio processed successfully');
        // Здесь можно добавить логику для воспроизведения обработанного аудио
      } else {
        console.error('❌ Audio processing failed:', data.error);
        // Не показываем ошибку пользователю, если это временная проблема с API
        if (!data.error.includes('ElevenLabs API error')) {
          console.warn('Audio processing temporarily unavailable');
        }
      }
    } catch (error) {
      console.error('❌ Error sending audio to server:', error);
    }
  };

  const processTextWithStreaming = async (text) => {
    setProcessingText(true);
    try {
      console.log('🎤 Processing text with streaming TTS...', text);
      
      const response = await fetch('http://localhost:8000/api/v1/streaming/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_id: selectedVoice,
          model_id: "eleven_multilingual_v2"
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.audio_data) {
        console.log('✅ Text processed with streaming TTS successfully');
        
        // Конвертируем base64 аудио в Blob и воспроизводим
        const audioBytes = atob(data.audio_data);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Создаем и воспроизводим аудио
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error('Error playing processed audio:', error);
        });
        
        // Очищаем URL после воспроизведения
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
      } else {
        console.warn('Text processing temporarily unavailable');
      }
    } catch (error) {
      console.error('Error processing text with streaming TTS:', error);
    } finally {
      setProcessingText(false);
    }
  };

  const handleTextProcessing = async () => {
    if (textToProcess.trim()) {
      await processTextWithStreaming(textToProcess.trim());
    }
  };

  const createStream = async () => {
    setLoading(true);
    setResult('');
    setStreamData(null);
    setSdpData(null);
    setStreamStarted(false);
    setConnectionState('');
    setIceCandidates([]);
    setTalkCreated(false);
    setVideoStream(null);
    setIsVideoPlaying(false);
    
    try {
      const requestBody = {
        source_url: imageUrl
      };
      
      if (uploadedImage && imageUrl === uploadedImage) {
        requestBody.image_data = uploadedImage;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/streaming/create-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      if (data.success) {
        setStreamData(data);
      }
    } catch (error) {
      setResult(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSdpData = async () => {
    if (!streamData || !streamData.sdp_offer || !streamData.ice_servers) {
      setResult('Ошибка: Нет SDP данных для создания WebRTC соединения');
      return;
    }

    setSdpLoading(true);
    setSdpData(null);
    
    try {
      // Используем SDP данные из Create Stream
      const sdpData = {
        success: true,
        sdp_offer: streamData.sdp_offer,
        ice_servers: streamData.ice_servers
      };
      
      setSdpData(sdpData);
      
      // Сразу запускаем WebRTC соединение
      await startWebRTCConnection(sdpData);
      
    } catch (error) {
      console.error('Error processing SDP data:', error);
      setResult(`Ошибка обработки SDP данных: ${error.message}`);
    } finally {
      setSdpLoading(false);
    }
  };

  const submitIceCandidate = async (candidate, sdpMid, sdpMLineIndex) => {
    if (!streamData || !streamData.stream_id) {
      console.error('No stream_id available for ICE candidate submission');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/streaming/submit-ice-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamData.stream_id,
          session_id: streamData.session_id,
          candidate: candidate,
          sdpMid: sdpMid,
          sdpMLineIndex: sdpMLineIndex
        })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('ICE candidate submitted successfully');
      } else {
        console.error('Failed to submit ICE candidate:', data.error);
      }
    } catch (error) {
      console.error('Error submitting ICE candidate:', error);
    }
  };

  const createTalkStream = async () => {
    if (!streamData || !streamData.stream_id) {
      setResult('Ошибка: Нет stream_id для создания talk stream');
      return;
    }

    setCreatingTalk(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/streaming/create-talk-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamData.stream_id,
          session_id: streamData.session_id,
          script: {
            type: "text",
            provider: { 
              type: "elevenlabs",
              voice_id: selectedVoice
            },
            ssml: "false",
            input: talkText
          },
          config: {
            fluent: "false",
            pad_audio: "0.0"
          },
          audio_optimization: "2"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTalkCreated(true);
        setResult(JSON.stringify({
          stream_creation: streamData,
          sdp_data: sdpData,
          stream_started: { success: true, message: "Stream started" },
          talk_stream: data
        }, null, 2));
      } else {
        setResult(`Ошибка создания talk stream: ${data.error}`);
      }
      
    } catch (error) {
      setResult(`Ошибка создания talk stream: ${error.message}`);
    } finally {
      setCreatingTalk(false);
    }
  };

  const startWebRTCConnection = async (sdpData) => {
    if (!streamData || !sdpData || !sdpData.success) {
      setResult('Ошибка: Нет данных для запуска WebRTC соединения');
      return;
    }

    setStartingStream(true);
    
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: sdpData.ice_servers || []
      });
      
      peerConnectionRef.current = peerConnection;
      
      // Обработчик для получения медиа потоков
      peerConnection.ontrack = (event) => {
        console.log('🎥 Track received:', event.track);
        console.log('📹 Streams:', event.streams);
        
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          setVideoStream(stream);
          
          // Привязываем поток к video элементу
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().then(() => {
              setIsVideoPlaying(true);
              setConnectionState('🎬 Видео поток активен!');
            }).catch(error => {
              console.error('Error playing video:', error);
              // Игнорируем AbortError - это нормально при переключении потоков
              if (error.name !== 'AbortError') {
                setConnectionState('❌ Ошибка воспроизведения видео');
              }
            });
          }
        }
      };
      
      peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log('ICE gathering state:', peerConnection.iceGatheringState);
        setConnectionState(`ICE gathering: ${peerConnection.iceGatheringState}`);
      });
      
      peerConnection.addEventListener('icecandidate', (event) => {
        console.log('ICE candidate:', event.candidate);
        if (event.candidate) {
          const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
          setIceCandidates(prev => [...prev, { candidate, sdpMid, sdpMLineIndex }]);
          submitIceCandidate(candidate, sdpMid, sdpMLineIndex);
        }
      });
      
      peerConnection.addEventListener('iceconnectionstatechange', () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        setConnectionState(`ICE connection: ${peerConnection.iceConnectionState}`);
        
                 if (peerConnection.iceConnectionState === 'connected' || 
             peerConnection.iceConnectionState === 'completed') {
           setConnectionState('🟢 WebRTC connection established!');
           // Разрешаем создание Talk Stream только после установки соединения
           setConnectionReady(true);
           
           // Автоматически запускаем микрофон после установки соединения
           if (!isMicrophoneActive) {
             console.log('🎤 Auto-starting microphone after connection...');
             startMicrophone().catch(error => {
               console.error('Error starting microphone:', error);
             });
           }
         }
      });
      
      peerConnection.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', peerConnection.connectionState);
        setConnectionState(`Connection: ${peerConnection.connectionState}`);
      });
      
      peerConnection.addEventListener('signalingstatechange', () => {
        console.log('Signaling state:', peerConnection.signalingState);
        setConnectionState(`Signaling: ${peerConnection.signalingState}`);
      });
      
      const offer = {
        type: 'offer',
        sdp: sdpData.sdp_offer
      };
      
      await peerConnection.setRemoteDescription(offer);
      
      const sessionClientAnswer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(sessionClientAnswer);
      
      const response = await fetch('http://localhost:8000/api/v1/streaming/submit-sdp-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamData.stream_id,
          session_id: streamData.session_id,
          answer: sessionClientAnswer
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStreamStarted(true);
        setResult(JSON.stringify({
          stream_creation: streamData,
          sdp_data: sdpData,
          stream_started: data,
          ice_candidates_count: iceCandidates.length
        }, null, 2));
      } else {
        setResult(`Ошибка запуска стрима: ${data.error}`);
      }
      
    } catch (error) {
      setResult(`Ошибка запуска стрима: ${error.message}`);
    } finally {
      setStartingStream(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>D-ID Stream Test</h1>
        
        <div className="image-section">
          <h3>Выберите изображение:</h3>
          
          <div className="image-options">
            <div className="option">
              <label>
                <input 
                  type="radio" 
                  name="imageSource" 
                  value="default" 
                  defaultChecked 
                  onChange={() => {
                    setImageUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face');
                    setUploadedImage(null);
                  }}
                />
                Использовать предустановленное изображение
              </label>
            </div>
            
            <div className="option">
              <label>
                <input 
                  type="radio" 
                  name="imageSource" 
                  value="upload" 
                  onChange={() => {
                    if (uploadedImage) {
                      setImageUrl(uploadedImage);
                    }
                  }}
                />
                Загрузить свое изображение
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="file-input"
              />
            </div>
          </div>
          
          {imageUrl && (
            <div className="image-preview">
              <h4>Предварительный просмотр:</h4>
              <img 
                src={imageUrl} 
                alt="Preview" 
                style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ccc' }}
              />
            </div>
          )}
        </div>
        
        <div className="talk-section">
          <h3>Создать разговор:</h3>
          
          <div className="voice-selection">
            <label>
              Выберите голос:
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={loadingVoices}
              >
                {loadingVoices ? (
                  <option>Загрузка голосов...</option>
                ) : (
                  voices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} - {voice.description}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
          
          <div className="talk-input">
            <label>
              Текст для аватара:
              <textarea
                value={talkText}
                onChange={(e) => setTalkText(e.target.value)}
                placeholder="Введите текст для аватара..."
                rows={3}
              />
            </label>
          </div>
        </div>
        
        <div className="button-group">
          <button 
            onClick={createStream} 
            disabled={loading}
            className="create-button"
          >
            {loading ? 'Создание стрима...' : 'Create a new stream'}
          </button>
          
          <button 
            onClick={getSdpData} 
            disabled={sdpLoading || !streamData}
            className="sdp-button"
          >
            {sdpLoading ? 'Создание WebRTC...' : 'Start Stream'}
          </button>
          
          <button 
            onClick={createTalkStream} 
            disabled={creatingTalk || !connectionReady}
            className="talk-button"
          >
            {creatingTalk ? 'Создание разговора...' : connectionReady ? 'Create Talk Stream' : '⏳ Wait for connection...'}
          </button>
        </div>
        
                       {streamStarted && (
                 <div className="stream-status">
                   <span className="status-indicator">🟢 Стрим запущен</span>
                 </div>
               )}
               
               {connectionReady && (
                 <div className="stream-status">
                   <span className="status-indicator">🟢 WebRTC соединение готово</span>
                 </div>
               )}
               
               {isMicrophoneActive && (
                 <div className="microphone-status">
                   <span className="status-indicator">🎤 Микрофон активен - слушаю...</span>
                   <button 
                     onClick={stopMicrophone}
                     className="stop-microphone-button"
                   >
                     Остановить микрофон
                   </button>
                 </div>
               )}
               
               <div className="text-processing-section">
                 <h4>🎤 Тестирование Streaming Text-to-Speech</h4>
                 <div className="text-input-group">
                   <textarea
                     value={textToProcess}
                     onChange={(e) => setTextToProcess(e.target.value)}
                     placeholder="Введите текст для обработки через ElevenLabs streaming API..."
                     rows={3}
                     className="text-input"
                   />
                   <button 
                     onClick={handleTextProcessing}
                     disabled={processingText || !textToProcess.trim()}
                     className="process-text-button"
                   >
                     {processingText ? 'Обработка...' : 'Обработать текст'}
                   </button>
                 </div>
               </div>
        
        {talkCreated && (
          <div className="stream-status">
            <span className="status-indicator">🎤 Разговор создан</span>
          </div>
        )}
        
        {connectionState && (
          <div className="connection-status">
            <h4>Состояние соединения:</h4>
            <div className="status-text">{connectionState}</div>
            {iceCandidates.length > 0 && (
              <div className="ice-info">
                <small>ICE candidates отправлено: {iceCandidates.length}</small>
              </div>
            )}
          </div>
        )}
        
        {/* Video Player */}
        <div className="video-section">
          <h3>Видео поток:</h3>
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={false}
              controls
              className="video-player"
              style={{
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
                border: '2px solid #4CAF50',
                borderRadius: '10px',
                backgroundColor: '#000'
              }}
            />
            {!isVideoPlaying && streamStarted && (
              <div className="video-placeholder">
                <p>⏳ Ожидание видео потока...</p>
                <p>После создания talk stream здесь появится видео аватара</p>
              </div>
            )}
            {isVideoPlaying && (
              <div className="video-status">
                <span className="video-status-indicator">🎬 Видео активно</span>
              </div>
            )}
          </div>
        </div>
        
        {result && (
          <div className="result">
            <h3>Результат:</h3>
            <pre>{result}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
