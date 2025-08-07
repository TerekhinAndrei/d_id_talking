import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceSelector from '../VoiceSelector';

// Mock компонента ErrorMessage
jest.mock('../ErrorMessage', () => {
  return function MockErrorMessage({ message, onRetry }) {
    return (
      <div data-testid="error-message">
        <p>{message}</p>
        {onRetry && (
          <button data-testid="retry-button" onClick={onRetry}>
            Попробовать снова
          </button>
        )}
      </div>
    );
  };
});

describe('VoiceSelector', () => {
  const mockVoices = [
    { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Женский голос, теплый и дружелюбный' },
    { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Женский голос, четкий и профессиональный' },
    { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Женский голос, мягкий и естественный' }
  ];

  const defaultProps = {
    selectedVoice: '',
    voices: mockVoices,
    loadingVoices: false,
    voicesError: null,
    isPlaying: false,
    onVoiceChange: jest.fn(),
    onPlayVoice: jest.fn(),
    onRetryVoices: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает dropdown с голосами', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveValue('');
  });

  test('показывает placeholder при загрузке', () => {
    render(<VoiceSelector {...defaultProps} loadingVoices={true} />);
    
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeDisabled();
    expect(dropdown).toHaveDisplayValue('Загрузка голосов...');
  });

  test('показывает placeholder когда голоса не выбраны', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toHaveDisplayValue('Выберите голос');
  });

  test('отображает список голосов в dropdown', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);
    
    // Проверяем, что все голоса отображаются
    expect(screen.getByText('Rachel - Женский голос, теплый и дружелюбный')).toBeInTheDocument();
    expect(screen.getByText('Domi - Женский голос, четкий и профессиональный')).toBeInTheDocument();
    expect(screen.getByText('Bella - Женский голос, мягкий и естественный')).toBeInTheDocument();
  });

  test('вызывает onVoiceChange при выборе голоса', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: '21m00Tcm4TlvDq8ikWAM' } });
    
    expect(defaultProps.onVoiceChange).toHaveBeenCalled();
  });

  test('отображает кнопку воспроизведения', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    const playButton = screen.getByRole('button', { name: '🔊' });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toBeDisabled(); // Кнопка должна быть неактивна без выбранного голоса
  });

  test('кнопка воспроизведения активна при выбранном голосе', () => {
    render(<VoiceSelector {...defaultProps} selectedVoice="21m00Tcm4TlvDq8ikWAM" />);
    
    const playButton = screen.getByRole('button', { name: '🔊' });
    expect(playButton).toBeEnabled();
  });

  test('кнопка воспроизведения неактивна при загрузке голосов', () => {
    render(<VoiceSelector {...defaultProps} loadingVoices={true} />);
    
    const playButton = screen.getByRole('button', { name: '🔊' });
    expect(playButton).toBeDisabled();
  });

  test('вызывает onPlayVoice при нажатии на кнопку воспроизведения', () => {
    render(<VoiceSelector {...defaultProps} selectedVoice="21m00Tcm4TlvDq8ikWAM" />);
    
    const playButton = screen.getByRole('button', { name: '🔊' });
    fireEvent.click(playButton);
    
    expect(defaultProps.onPlayVoice).toHaveBeenCalled();
  });

  test('показывает спиннер при воспроизведении', () => {
    render(<VoiceSelector {...defaultProps} selectedVoice="21m00Tcm4TlvDq8ikWAM" isPlaying={true} />);
    
    const playButton = screen.getByRole('button', { name: '⏳' });
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveClass('playing');
  });

  test('отображает информацию о выбранном голосе', () => {
    render(<VoiceSelector {...defaultProps} selectedVoice="21m00Tcm4TlvDq8ikWAM" />);
    
    expect(screen.getByText('Выбран:')).toBeInTheDocument();
    expect(screen.getByText('Rachel')).toBeInTheDocument();
  });

  test('отображает ошибку при наличии voicesError', () => {
    const errorMessage = 'Не удалось загрузить список голосов';
    render(<VoiceSelector {...defaultProps} voicesError={errorMessage} />);
    
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('вызывает onRetryVoices при нажатии на кнопку повторной попытки', () => {
    const errorMessage = 'Не удалось загрузить список голосов';
    render(<VoiceSelector {...defaultProps} voicesError={errorMessage} />);
    
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);
    
    expect(defaultProps.onRetryVoices).toHaveBeenCalled();
  });

  test('не отображает информацию о выбранном голосе когда голос не выбран', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    expect(screen.queryByText(/Выбран:/)).not.toBeInTheDocument();
  });

  test('не отображает ошибку когда voicesError равен null', () => {
    render(<VoiceSelector {...defaultProps} />);
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  test('показывает спиннер загрузки в dropdown при loadingVoices', () => {
    render(<VoiceSelector {...defaultProps} loadingVoices={true} />);
    
    const loadingIndicator = screen.getByText('⏳');
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveClass('loading-spinner');
  });
});
