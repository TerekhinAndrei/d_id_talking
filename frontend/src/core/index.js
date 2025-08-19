/**
 * Экспорт всех компонентов системы хранения файлов
 */

// Типы и enum'ы
export {
  StorageProvider,
  FileType,
  UploadStatus,
  UploadStrategy,
  FileMetadata,
  UploadResult,
  UploadOptions,
  ValidationConfig,
  UploadStats,
  ProviderConfig
} from './types/storage.js';

// Интерфейсы
export {
  IStorageProvider,
  IFileService,
  IStorageConfig
} from './interfaces/IStorageProvider.js';

// Конфигурация
export {
  StorageConfig,
  storageConfig
} from './config/StorageConfig.js';

// Базовые классы
export {
  BaseStorageProvider
} from './providers/BaseStorageProvider.js';

// Провайдеры
export {
  CloudinaryProvider
} from './providers/CloudinaryProvider.js';

export {
  DIdProvider
} from './providers/DIdProvider.js';

// Главный сервис
export {
  FileStorageService,
  fileStorageService
} from './services/FileStorageService.js';

// Утилиты для работы с файлами
export const FileUtils = {
  /**
   * Определение типа файла по MIME-типу
   */
  getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  },

  /**
   * Форматирование размера файла
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Проверка, является ли файл изображением
   */
  isImage(file) {
    return file.type.startsWith('image/');
  },

  /**
   * Проверка, является ли файл аудио
   */
  isAudio(file) {
    return file.type.startsWith('audio/');
  },

  /**
   * Проверка, является ли файл видео
   */
  isVideo(file) {
    return file.type.startsWith('video/');
  },

  /**
   * Создание превью для изображения
   */
  createImagePreview(file, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file)) {
        reject(new Error('File is not an image'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Вычисляем размеры превью
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Рисуем изображение
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в blob
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Создание аудио превью (волновая форма)
   */
  createAudioPreview(file) {
    return new Promise((resolve, reject) => {
      if (!this.isAudio(file)) {
        reject(new Error('File is not an audio file'));
        return;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Получаем данные канала
          const channelData = audioBuffer.getChannelData(0);
          const samples = 100; // Количество точек для волновой формы
          const blockSize = Math.floor(channelData.length / samples);
          const waveform = [];

          for (let i = 0; i < samples; i++) {
            const start = blockSize * i;
            let sum = 0;
            
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channelData[start + j]);
            }
            
            waveform.push(sum / blockSize);
          }

          resolve({
            waveform,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }
};

// Хуки для React (если нужно)
export const useFileStorage = () => {
  return {
    uploadFile: fileStorageService.uploadFile.bind(fileStorageService),
    uploadImage: fileStorageService.uploadImage.bind(fileStorageService),
    uploadAudio: fileStorageService.uploadAudio.bind(fileStorageService),
    uploadVideo: fileStorageService.uploadVideo.bind(fileStorageService),
    deleteFile: fileStorageService.deleteFile.bind(fileStorageService),
    validateFile: fileStorageService.validateFile.bind(fileStorageService),
    getUploadStats: () => fileStorageService.getUploadStats(),
    getAvailableProviders: () => fileStorageService.getAvailableProviders(),
    testProvider: fileStorageService.testProvider.bind(fileStorageService)
  };
};
