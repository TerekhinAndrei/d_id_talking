/**
 * Интерфейсы для провайдеров хранения файлов
 */

import { FileMetadata, UploadResult, UploadOptions } from '../types/storage.js';

/**
 * Базовый интерфейс для провайдера хранения
 */
export class IStorageProvider {
  /**
   * Инициализация провайдера
   */
  async initialize() {
    throw new Error('initialize() method must be implemented');
  }

  /**
   * Проверка доступности провайдера
   */
  async isAvailable() {
    throw new Error('isAvailable() method must be implemented');
  }

  /**
   * Загрузка файла
   */
  async uploadFile(file, options = new UploadOptions()) {
    throw new Error('uploadFile() method must be implemented');
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId) {
    throw new Error('deleteFile() method must be implemented');
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(fileId) {
    throw new Error('getFileMetadata() method must be implemented');
  }

  /**
   * Получение URL файла
   */
  async getFileUrl(fileId) {
    throw new Error('getFileUrl() method must be implemented');
  }

  /**
   * Валидация файла
   */
  validateFile(file, options = new UploadOptions()) {
    throw new Error('validateFile() method must be implemented');
  }

  /**
   * Получение информации о провайдере
   */
  getProviderInfo() {
    throw new Error('getProviderInfo() method must be implemented');
  }
}

/**
 * Интерфейс для сервиса управления файлами
 */
export class IFileService {
  /**
   * Загрузка файла с автоматическим выбором провайдера
   */
  async uploadFile(file, options = new UploadOptions()) {
    throw new Error('uploadFile() method must be implemented');
  }

  /**
   * Загрузка изображения
   */
  async uploadImage(file, options = new UploadOptions()) {
    throw new Error('uploadImage() method must be implemented');
  }

  /**
   * Загрузка аудио файла
   */
  async uploadAudio(file, options = new UploadOptions()) {
    throw new Error('uploadAudio() method must be implemented');
  }

  /**
   * Загрузка видео файла
   */
  async uploadVideo(file, options = new UploadOptions()) {
    throw new Error('uploadVideo() method must be implemented');
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId, provider = null) {
    throw new Error('deleteFile() method must be implemented');
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(fileId, provider = null) {
    throw new Error('getFileMetadata() method must be implemented');
  }

  /**
   * Валидация файла
   */
  validateFile(file, fileType = null) {
    throw new Error('validateFile() method must be implemented');
  }

  /**
   * Получение статистики загрузок
   */
  getUploadStats() {
    throw new Error('getUploadStats() method must be implemented');
  }

  /**
   * Получение информации о доступных провайдерах
   */
  getAvailableProviders() {
    throw new Error('getAvailableProviders() method must be implemented');
  }

  /**
   * Тестирование провайдера
   */
  async testProvider(provider) {
    throw new Error('testProvider() method must be implemented');
  }
}

/**
 * Интерфейс для конфигурации
 */
export class IStorageConfig {
  /**
   * Получение конфигурации провайдера
   */
  getProviderConfig(provider) {
    throw new Error('getProviderConfig() method must be implemented');
  }

  /**
   * Получение провайдера по умолчанию
   */
  getDefaultProvider() {
    throw new Error('getDefaultProvider() method must be implemented');
  }

  /**
   * Получение конфигурации валидации
   */
  getValidationConfig() {
    throw new Error('getValidationConfig() method must be implemented');
  }

  /**
   * Проверка доступности провайдера
   */
  isProviderEnabled(provider) {
    throw new Error('isProviderEnabled() method must be implemented');
  }

  /**
   * Получение приоритета провайдера
   */
  getProviderPriority(provider) {
    throw new Error('getProviderPriority() method must be implemented');
  }
}
