/**
 * Пример использования системы хранения файлов
 */

import {
  fileStorageService,
  StorageProvider,
  UploadStrategy,
  UploadOptions,
  FileUtils
} from '../core/index.js';

/**
 * Пример загрузки изображения
 */
export async function uploadImageExample() {
  try {
    // Создаем файл для примера
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Test Image', 100, 100);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

    console.log('📤 Uploading image...');

    // Загрузка с автоматическим выбором провайдера
    const result = await fileStorageService.uploadImage(file);
    
    if (result.success) {
      console.log('✅ Image uploaded successfully:', result);
      return result.fileMetadata;
    } else {
      console.error('❌ Upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
}

/**
 * Пример загрузки аудио файла
 */
export async function uploadAudioExample() {
  try {
    // Создаем простой аудио файл для примера
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
    
    // Получаем аудио данные
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    oscillator.connect(mediaStreamDestination);
    
    const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const file = new File([blob], 'test-audio.wav', { type: 'audio/wav' });

      console.log('📤 Uploading audio...');

      // Загрузка в D-ID с fallback на Cloudinary
      const options = new UploadOptions({
        provider: StorageProvider.D_ID,
        strategy: UploadStrategy.FALLBACK,
        onProgress: (progress) => console.log('Upload progress:', progress),
        onSuccess: (result) => console.log('✅ Audio uploaded successfully:', result),
        onError: (error) => console.error('❌ Audio upload failed:', error)
      });

      const result = await fileStorageService.uploadAudio(file, options);
      
      if (result.success) {
        console.log('✅ Audio uploaded successfully:', result);
        return result.fileMetadata;
      } else {
        console.error('❌ Upload failed:', result.error);
        return null;
      }
    };
    
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 1000);
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
}

/**
 * Пример гибридной загрузки
 */
export async function uploadHybridExample() {
  try {
    // Создаем файл для примера
    const text = 'This is a test file for hybrid upload';
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'test-file.txt', { type: 'text/plain' });

    console.log('📤 Uploading file with hybrid strategy...');

    // Загрузка во все доступные провайдеры
    const options = new UploadOptions({
      strategy: UploadStrategy.HYBRID,
      onSuccess: (result) => console.log('✅ File uploaded successfully:', result),
      onError: (error) => console.error('❌ Upload failed:', error)
    });

    const result = await fileStorageService.uploadFile(file, options);
    
    if (result.success) {
      console.log('✅ Hybrid upload completed:', result);
      return result.fileMetadata;
    } else {
      console.error('❌ Hybrid upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
}

/**
 * Пример валидации файла
 */
export function validateFileExample(file) {
  console.log('🔍 Validating file:', file.name);
  
  const validation = fileStorageService.validateFile(file);
  
  if (validation.valid) {
    console.log('✅ File is valid');
    console.log('File type:', validation.fileType);
    console.log('File size:', FileUtils.formatFileSize(validation.size));
  } else {
    console.error('❌ File validation failed:');
    validation.errors.forEach(error => console.error('  -', error));
  }
  
  return validation;
}

/**
 * Пример получения статистики
 */
export function getStatsExample() {
  const stats = fileStorageService.getUploadStats();
  
  console.log('📊 Upload Statistics:');
  console.log('Total uploads:', stats.totalUploads);
  console.log('Successful uploads:', stats.successfulUploads);
  console.log('Failed uploads:', stats.failedUploads);
  console.log('Success rate:', stats.getSuccessRate().toFixed(2) + '%');
  console.log('Total bytes uploaded:', FileUtils.formatFileSize(stats.totalBytes));
  console.log('Average duration:', stats.averageDuration.toFixed(2) + 'ms');
  
  console.log('Provider statistics:');
  Object.entries(stats.providerStats).forEach(([provider, providerStats]) => {
    console.log(`  ${provider}:`);
    console.log(`    Total: ${providerStats.total}`);
    console.log(`    Success: ${providerStats.success}`);
    console.log(`    Failed: ${providerStats.failed}`);
    console.log(`    Success rate: ${((providerStats.success / providerStats.total) * 100).toFixed(2)}%`);
    console.log(`    Bytes: ${FileUtils.formatFileSize(providerStats.bytes)}`);
  });
  
  return stats;
}

/**
 * Пример тестирования провайдеров
 */
export async function testProvidersExample() {
  console.log('🧪 Testing providers...');
  
  const providers = ['cloudinary', 'd_id'];
  
  for (const provider of providers) {
    try {
      const result = await fileStorageService.testProvider(provider);
      console.log(`Provider ${provider}:`, result.available ? '✅ Available' : '❌ Unavailable');
      
      if (result.info) {
        console.log(`  Capabilities:`, result.info.capabilities);
      }
      
      if (result.error) {
        console.error(`  Error:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Failed to test provider ${provider}:`, error);
    }
  }
}

/**
 * Пример создания превью
 */
export async function createPreviewExample(file) {
  try {
    if (FileUtils.isImage(file)) {
      console.log('🖼️ Creating image preview...');
      const preview = await FileUtils.createImagePreview(file, 150, 150);
      console.log('✅ Image preview created:', preview);
      return preview;
    } else if (FileUtils.isAudio(file)) {
      console.log('🎵 Creating audio preview...');
      const preview = await FileUtils.createAudioPreview(file);
      console.log('✅ Audio preview created:', preview);
      return preview;
    } else {
      console.log('📄 File type not supported for preview');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to create preview:', error);
    return null;
  }
}

/**
 * Полный пример использования
 */
export async function fullExample() {
  console.log('🚀 Starting full file storage example...');
  
  // Инициализируем сервис
  await fileStorageService.initialize();
  
  // Тестируем провайдеры
  await testProvidersExample();
  
  // Загружаем изображение
  const imageResult = await uploadImageExample();
  
  // Загружаем аудио
  const audioResult = await uploadAudioExample();
  
  // Получаем статистику
  getStatsExample();
  
  // Удаляем тестовые файлы
  if (imageResult) {
    await fileStorageService.deleteFile(imageResult.id);
    console.log('🗑️ Test image deleted');
  }
  
  if (audioResult) {
    await fileStorageService.deleteFile(audioResult.id);
    console.log('🗑️ Test audio deleted');
  }
  
  console.log('✅ Full example completed');
}

// Экспортируем все примеры
export const examples = {
  uploadImage: uploadImageExample,
  uploadAudio: uploadAudioExample,
  uploadHybrid: uploadHybridExample,
  validateFile: validateFileExample,
  getStats: getStatsExample,
  testProviders: testProvidersExample,
  createPreview: createPreviewExample,
  full: fullExample
};
