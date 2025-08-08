import React, { useEffect } from 'react';
import ErrorMessage from './ErrorMessage';
import { useElevenLabs } from '../hooks/useElevenLabs';

const VoiceSelector = ({ 
  selectedVoice, 
  voices, 
  loadingVoices, 
  voicesError, 
  isPlaying, 
  onVoiceChange, 
  onPlayVoice,
  onRetryVoices
}) => {
  const { 
    playVoice, 
    playAudioData, 
    isProcessing: isElevenLabsProcessing, 
    error: elevenLabsError,
    audioData,
    clearState 
  } = useElevenLabs();

  // Handle voice preview with ElevenLabs
  const handlePlayVoice = async () => {
    if (!selectedVoice) {
      alert('Сначала выберите голос');
      return;
    }

    try {
      // Call the parent's onPlayVoice first (for UI state)
      if (onPlayVoice) {
        onPlayVoice();
      }

      console.log('🎤 Начинаю воспроизведение голоса:', selectedVoice);

      // Use ElevenLabs to generate voice preview
      const response = await playVoice(selectedVoice);
      
      console.log('📡 Ответ от ElevenLabs:', {
        success: response.success,
        hasAudioData: !!response.audio_data,
        format: response.format,
        dataLength: response.audio_data?.length || 0
      });
      
      if (response && response.success && response.audio_data) {
        console.log('Аудио данные получены, начинаю воспроизведение');
        
        // Play the generated audio
        await playAudioData(response.audio_data, response.format || 'mp3');
        
        console.log('🎵 Воспроизведение завершено успешно');
      } else {
        throw new Error('Не удалось получить аудио данные от сервера');
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения голоса:', error);
      
      // Show more detailed error message
      let errorMessage = 'Ошибка при воспроизведении голоса';
      
      if (error.message.includes('API error')) {
        errorMessage = 'Ошибка API ElevenLabs. Проверьте подключение к серверу.';
      } else if (error.message.includes('decode')) {
        errorMessage = 'Ошибка обработки аудио данных. Попробуйте еще раз.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = `Ошибка: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Clear ElevenLabs state when component unmounts or voice changes
  useEffect(() => {
    return () => {
      clearState();
    };
  }, [clearState]);

  // Show ElevenLabs processing state
  const isActuallyPlaying = isPlaying || isElevenLabsProcessing;

  return (
    <div className="voice-selection-container">
      <div className="voice-controls">
        <div className="voice-dropdown-container">
          <select 
            className="voice-dropdown"
            value={selectedVoice}
            onChange={onVoiceChange}
            disabled={loadingVoices}
          >
            {loadingVoices ? (
              <option value="">Загрузка голосов...</option>
            ) : (
              voices && voices.length > 0 && voices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} - {voice.description}
                </option>
              ))
            )}
          </select>
          {loadingVoices && (
            <div className="loading-indicator">
              <span className="loading-spinner">⏳</span>
            </div>
          )}
        </div>
        
        <button 
          className={`btn btn-success ${isActuallyPlaying ? 'playing' : ''}`}
          onClick={handlePlayVoice}
          disabled={!selectedVoice || isActuallyPlaying || loadingVoices}
          title="Прослушать пример голоса (ElevenLabs)"
        >
          {isActuallyPlaying ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span className="speaker-icon">🔊</span>
          )}
        </button>
      </div>
      
      {/* Show ElevenLabs errors */}
      {elevenLabsError && (
        <ErrorMessage 
          message={`Ошибка ElevenLabs: ${elevenLabsError}`} 
          onRetry={() => clearState()}
        />
      )}
      
      {/* Show voice loading errors */}
      {voicesError && (
        <ErrorMessage 
          message={voicesError} 
          onRetry={onRetryVoices}
        />
      )}
      
      {selectedVoice && (
        <div className="voice-info">
          <p className="selected-voice">
            Выбран: <strong>{voices.find(v => v.voice_id === selectedVoice)?.name}</strong>
          </p>
          {audioData && (
            <p className="voice-preview-status">
              Аудио пример готов к воспроизведению
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
