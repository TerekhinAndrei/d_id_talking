import { apiService } from './api.js';
import configManager from '../config/ConfigManager.js';
import { newFileService } from './NewFileService.js';

/**
 * Сервис для работы с файлами
 * Поддерживает D-ID и Cloudinary провайдеры
 */
class FileService {
  constructor() {
    this.configManager = configManager;
  }

  /**
   * Загружает изображение с автоматическим выбором провайдера
   * Использует новую систему: D-ID локально, файловое хранилище на Render
   */
  async uploadImage(file, options = {}) {
    try {
      // Используем новый сервис для загрузки
      return await newFileService.uploadImage(file, options);
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Загружает аудио файл с автоматическим выбором провайдера
   * Использует новую систему: D-ID локально, файловое хранилище на Render
   */
  async uploadAudio(file, options = {}) {
    try {
      // Используем новый сервис для загрузки
      return await newFileService.uploadAudio(file, options);
    } catch (error) {
      console.error('Audio upload failed:', error);
      throw error;
    }
  }

  /**
   * Удаляет файл
   */
  async deleteFile(fileId, provider = 'auto') {
    try {
      // Используем новый сервис для удаления
      return await newFileService.deleteFile(fileId, provider);
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Получает информацию о текущем аватаре
   */
  async getCurrentAvatar() {
    return await newFileService.getCurrentAvatar();
  }

  /**
   * Тестирует аутентификацию D-ID
   */
  async testDIdAuthentication() {
    try {
      const result = await apiService.testDIdAuthentication();
      return {
        ...result,
        provider: 'd_id'
      };
    } catch (error) {
      console.error('D-ID authentication test failed:', error);
      throw error;
    }
  }

  /**
   * Тестирует подключение к сервисам
   */
  async testConnection() {
    return await newFileService.testConnection();
  }

  /**
   * Получает информацию о провайдерах
   */
  getProvidersInfo() {
    return newFileService.getProvidersInfo();
  }

  /**
   * Валидирует файл для загрузки
   */
  validateFile(file, type = 'auto') {
    return newFileService.validateFile(file, type);
  }
}

export const fileService = new FileService();
