import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Store для управления состоянием приложения
export const useAppStore = create(
  devtools(
    (set, get) => ({
      // === СОСТОЯНИЕ ===
      
      // Изображения
      selectedImage: null,
      previewUrl: null,
      uploadedImageUrl: null,
      uploadError: null,
      
      // Голоса
      selectedVoice: null,
      voices: [],
      loadingVoices: false,
      voicesError: null,
      
      // Стриминг
      isCreating: false,
      isPlaying: false,
      isVideoReady: false,
      
      // UI состояние
      showElevenLabsTester: false,
      showDIdStreamingTester: false,
      
      // === ДЕЙСТВИЯ ===
      
      // Изображения
      setSelectedImage: (image) => set({ selectedImage: image }),
      setPreviewUrl: (url) => set({ previewUrl: url }),
      setUploadedImageUrl: (url) => set({ uploadedImageUrl: url }),
      setUploadError: (error) => set({ uploadError: error }),
      clearImage: () => set({ 
        selectedImage: null, 
        previewUrl: null, 
        uploadedImageUrl: null, 
        uploadError: null 
      }),
      
      // Голоса
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
      setVoices: (voices) => set({ voices }),
      setLoadingVoices: (loading) => set({ loadingVoices: loading }),
      setVoicesError: (error) => set({ voicesError: error }),
      
      // Стриминг
      setCreating: (creating) => set({ isCreating: creating }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setVideoReady: (ready) => set({ isVideoReady: ready }),
      
      // UI
      toggleElevenLabsTester: () => set((state) => ({ 
        showElevenLabsTester: !state.showElevenLabsTester 
      })),
      toggleDIdStreamingTester: () => set((state) => ({ 
        showDIdStreamingTester: !state.showDIdStreamingTester 
      })),
      
      // Сброс состояния
      reset: () => set({
        selectedImage: null,
        previewUrl: null,
        uploadedImageUrl: null,
        uploadError: null,
        selectedVoice: null,
        isCreating: false,
        isPlaying: false,
        isVideoReady: false,
        showElevenLabsTester: false,
        showDIdStreamingTester: false
      })
    }),
    {
      name: 'app-store'
    }
  )
);
