// Updated test for ElevenLabs integration with fixes
// Run this in browser console to test the API

async function testElevenLabsIntegration() {
  console.log('🧪 Начинаю обновленный тест интеграции ElevenLabs...');
  
  try {
    // Test 1: Check if API is accessible
    console.log('📡 Тест 1: Проверка доступности API...');
    const healthResponse = await fetch('/api/v1/health');
    console.log('Health check status:', healthResponse.status);
    
    // Test 2: Get voices
    console.log('📡 Тест 2: Получение списка голосов...');
    const voicesResponse = await fetch('/api/v1/generation/voices');
    const voicesData = await voicesResponse.json();
    console.log('Voices response:', voicesData);
    
    if (voicesData.success && voicesData.voices && voicesData.voices.length > 0) {
      const testVoiceId = voicesData.voices[0].voice_id;
      console.log('✅ Найден тестовый голос:', testVoiceId);
      
      // Test 3: Test voice preview with detailed logging
      console.log('📡 Тест 3: Тест воспроизведения голоса...');
      const playResponse = await fetch('/api/v1/generation/play-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_id: testVoiceId,
          preview_text: 'Привет! Это тест.'
        })
      });
      
      console.log('Play response status:', playResponse.status);
      console.log('Play response headers:', Object.fromEntries(playResponse.headers.entries()));
      
      const playData = await playResponse.json();
      console.log('Play voice response:', {
        success: playData.success,
        hasAudioData: !!playData.audio_data,
        format: playData.format,
        dataLength: playData.audio_data?.length || 0,
        message: playData.message
      });
      
      if (playData.success && playData.audio_data) {
        console.log('✅ Аудио данные получены успешно!');
        
        // Test 4: Try to decode base64 with detailed error handling
        try {
          console.log('🔍 Проверка формата base64...');
          
          // Check if it's valid base64
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(playData.audio_data)) {
            console.error('❌ Неверный формат base64 данных');
            return;
          }
          
          const decoded = atob(playData.audio_data);
          console.log('✅ Base64 декодирование успешно, размер:', decoded.length, 'байт');
          
          // Check if it looks like audio data (should have some non-zero bytes)
          const hasAudioContent = Array.from(decoded).some(byte => byte !== 0);
          if (hasAudioContent) {
            console.log('✅ Аудио данные содержат контент');
          } else {
            console.warn('⚠️ Аудио данные могут быть пустыми');
          }
          
          // Test 5: Try to create audio blob
          try {
            const blob = new Blob([decoded], { type: `audio/${playData.format || 'mp3'}` });
            console.log('✅ Blob создан успешно, размер:', blob.size, 'байт');
            
            if (blob.size > 0) {
              console.log('✅ Аудио файл готов к воспроизведению');
            } else {
              console.error('❌ Созданный blob пуст');
            }
          } catch (blobError) {
            console.error('❌ Ошибка создания blob:', blobError);
          }
          
        } catch (decodeError) {
          console.error('❌ Ошибка декодирования base64:', decodeError);
          console.error('Первые 100 символов base64:', playData.audio_data.substring(0, 100));
        }
      } else {
        console.error('❌ Не удалось получить аудио данные');
        console.error('Ответ сервера:', playData);
      }
    } else {
      console.error('❌ Не найдены голоса для тестирования');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Additional test for TTS endpoint
async function testTTSEndpoint() {
  console.log('🎤 Тестирование TTS эндпоинта...');
  
  try {
    const ttsResponse = await fetch('/api/v1/generation/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Тест TTS',
        voice_id: '21m00Tcm4TlvDq8ikWAM'
      })
    });
    
    const ttsData = await ttsResponse.json();
    console.log('TTS response:', {
      success: ttsData.success,
      hasAudioData: !!ttsData.audio_data,
      format: ttsData.format,
      dataLength: ttsData.audio_data?.length || 0
    });
    
    if (ttsData.success && ttsData.audio_data) {
      console.log('✅ TTS работает корректно');
    } else {
      console.error('❌ TTS не работает');
    }
  } catch (error) {
    console.error('❌ Ошибка TTS теста:', error);
  }
}

// Run the tests
console.log('🚀 Запуск тестов ElevenLabs...');
testElevenLabsIntegration().then(() => {
  console.log('📋 Основной тест завершен');
  return testTTSEndpoint();
}).then(() => {
  console.log('📋 TTS тест завершен');
  console.log('✅ Все тесты завершены');
}).catch(error => {
  console.error('❌ Ошибка в тестах:', error);
});
