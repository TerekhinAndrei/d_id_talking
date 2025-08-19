import { renderHook } from '@testing-library/react';
import { useVideoStreamStatus } from '../useVideoStreamStatus';

// Мокаем DOM API
const mockVideoElement = {
  srcObject: null,
  paused: true,
  ended: false,
  readyState: 0,
  currentTime: 0,
  src: '',
  getVideoTracks: () => []
};

const mockDidStream = {
  active: true,
  getVideoTracks: () => [{
    kind: 'video',
    muted: false
  }]
};

describe('useVideoStreamStatus', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    document.getElementById = jest.fn();
  });

  it('должен возвращать false когда видеоэлемент не найден', () => {
    document.getElementById.mockReturnValue(null);
    
    const { result } = renderHook(() => useVideoStreamStatus('non-existent'));
    
    expect(result.current).toBe(false);
  });

  it('должен возвращать false когда нет D-ID стрима', () => {
    document.getElementById.mockReturnValue(mockVideoElement);
    
    const { result } = renderHook(() => useVideoStreamStatus('main-video-player'));
    
    // Хук может возвращать null в начальном состоянии, поэтому проверяем falsy значение
    expect(result.current).toBeFalsy();
  });

  it('должен возвращать false когда видео приостановлено', () => {
    const videoWithStream = {
      ...mockVideoElement,
      srcObject: mockDidStream,
      paused: true
    };
    document.getElementById.mockReturnValue(videoWithStream);
    
    const { result } = renderHook(() => useVideoStreamStatus('main-video-player'));
    
    expect(result.current).toBe(false);
  });

  it('должен возвращать false когда видео не готово к воспроизведению', () => {
    const videoWithStream = {
      ...mockVideoElement,
      srcObject: mockDidStream,
      paused: false,
      readyState: 0, // HAVE_NOTHING
      currentTime: 0
    };
    document.getElementById.mockReturnValue(videoWithStream);
    
    const { result } = renderHook(() => useVideoStreamStatus('main-video-player'));
    
    expect(result.current).toBe(false);
  });

  it('должен возвращать false когда это placeholder видео', () => {
    const videoWithStream = {
      ...mockVideoElement,
      srcObject: mockDidStream,
      paused: false,
      readyState: 2, // HAVE_CURRENT_DATA
      currentTime: 1,
      src: '/Waiting.mp4'
    };
    document.getElementById.mockReturnValue(videoWithStream);
    
    const { result } = renderHook(() => useVideoStreamStatus('main-video-player'));
    
    expect(result.current).toBe(false);
  });

  it('должен возвращать true когда D-ID стрим воспроизводится', () => {
    const videoWithStream = {
      ...mockVideoElement,
      srcObject: mockDidStream,
      paused: false,
      readyState: 2, // HAVE_CURRENT_DATA
      currentTime: 1,
      src: ''
    };
    document.getElementById.mockReturnValue(videoWithStream);
    
    const { result } = renderHook(() => useVideoStreamStatus('main-video-player'));
    
    expect(result.current).toBe(true);
  });

  it('должен использовать правильный ID видеоэлемента', () => {
    document.getElementById.mockReturnValue(null);
    
    renderHook(() => useVideoStreamStatus('custom-video-id'));
    
    expect(document.getElementById).toHaveBeenCalledWith('custom-video-id');
  });
});
