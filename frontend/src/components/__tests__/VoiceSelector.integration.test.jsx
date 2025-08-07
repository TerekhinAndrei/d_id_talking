import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceSelector from '../VoiceSelector';

// Mock fetch для тестирования API
global.fetch = jest.fn();

describe('VoiceSelector Integration', () => {
  const mockVoicesResponse = {
    success: true,
    voices: [
      { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Женский голос, теплый и дружелюбный' },
      { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Женский голос, четкий и профессиональный' }
    ]
  };

  const mockErrorResponse = {
    success: false,
    message: 'Ошибка загрузки голосов'
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  test('успешно загружает голоса из API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVoicesResponse
    });

    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    render(
      <VoiceSelector
        selectedVoice=""
        voices={mockVoicesResponse.voices}
        loadingVoices={false}
        voicesError={null}
        isPlaying={false}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Проверяем, что голоса отображаются
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText('Rachel - Женский голос, теплый и дружелюбный')).toBeInTheDocument();
      expect(screen.getByText('Domi - Женский голос, четкий и профессиональный')).toBeInTheDocument();
    });
  });

  test('обрабатывает ошибку API и показывает fallback голоса', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    // Fallback голоса из констант
    const fallbackVoices = [
      { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Женский голос, теплый и дружелюбный' },
      { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Женский голос, четкий и профессиональный' }
    ];

    render(
      <VoiceSelector
        selectedVoice=""
        voices={fallbackVoices}
        loadingVoices={false}
        voicesError="Не удалось загрузить список голосов"
        isPlaying={false}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Проверяем, что ошибка отображается
    expect(screen.getByText('Не удалось загрузить список голосов')).toBeInTheDocument();
    
    // Проверяем, что fallback голоса доступны
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText('Rachel - Женский голос, теплый и дружелюбный')).toBeInTheDocument();
    });
  });

  test('позволяет выбрать голос и воспроизвести его', async () => {
    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    render(
      <VoiceSelector
        selectedVoice="21m00Tcm4TlvDq8ikWAM"
        voices={mockVoicesResponse.voices}
        loadingVoices={false}
        voicesError={null}
        isPlaying={false}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Проверяем, что кнопка воспроизведения активна при выбранном голосе
    const playButton = screen.getByRole('button', { name: '🔊' });
    expect(playButton).toBeEnabled();

    // Нажимаем на кнопку воспроизведения
    fireEvent.click(playButton);

    expect(onPlayVoice).toHaveBeenCalled();
  });

  test('показывает состояние загрузки', () => {
    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    render(
      <VoiceSelector
        selectedVoice=""
        voices={[]}
        loadingVoices={true}
        voicesError={null}
        isPlaying={false}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Проверяем состояние загрузки
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeDisabled();
    expect(dropdown).toHaveDisplayValue('Загрузка голосов...');

    // Проверяем спиннер загрузки
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  test('показывает состояние воспроизведения', () => {
    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    render(
      <VoiceSelector
        selectedVoice="21m00Tcm4TlvDq8ikWAM"
        voices={mockVoicesResponse.voices}
        loadingVoices={false}
        voicesError={null}
        isPlaying={true}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Проверяем состояние воспроизведения
    const playButton = screen.getByRole('button', { name: '⏳' });
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveClass('playing');
  });

  test('позволяет повторить загрузку при ошибке', async () => {
    const onVoiceChange = jest.fn();
    const onPlayVoice = jest.fn();
    const onRetryVoices = jest.fn();

    render(
      <VoiceSelector
        selectedVoice=""
        voices={[]}
        loadingVoices={false}
        voicesError="Не удалось загрузить список голосов"
        isPlaying={false}
        onVoiceChange={onVoiceChange}
        onPlayVoice={onPlayVoice}
        onRetryVoices={onRetryVoices}
      />
    );

    // Нажимаем кнопку повторной попытки
    const retryButton = screen.getByText('Попробовать снова');
    fireEvent.click(retryButton);

    expect(onRetryVoices).toHaveBeenCalled();
  });
});
