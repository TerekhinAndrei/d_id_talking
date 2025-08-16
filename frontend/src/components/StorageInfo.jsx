import React from 'react';
import { fileService } from '../services/FileService.js';

const StorageInfo = () => {
  const providersInfo = fileService.getProvidersInfo();

  return (
    <div className="storage-info">
      <h3>Информация о хранилищах</h3>
      <div className="providers-grid">
        <div className="provider-card">
          <div className="provider-header">
            <h4>D-ID Storage</h4>
            <span className={`status ${providersInfo.dId.enabled ? 'enabled' : 'disabled'}`}>
              {providersInfo.dId.enabled ? '✓ Включено' : '✗ Отключено'}
            </span>
          </div>
          <div className="provider-details">
            <p><strong>Максимальный размер:</strong> {(providersInfo.dId.maxFileSize / 1024 / 1024).toFixed(1)}MB</p>
            <p><strong>Изображения:</strong> {providersInfo.dId.supportedImageTypes.join(', ')}</p>
            <p><strong>Аудио:</strong> {providersInfo.dId.supportedAudioTypes.join(', ')}</p>
          </div>
        </div>

        <div className="provider-card">
          <div className="provider-header">
            <h4>Cloudinary</h4>
            <span className={`status ${providersInfo.cloudinary.enabled ? 'enabled' : 'disabled'}`}>
              {providersInfo.cloudinary.enabled ? '✓ Включено' : '✗ Отключено'}
            </span>
          </div>
          <div className="provider-details">
            <p><strong>Fallback:</strong> {providersInfo.cloudinary.fallback ? '✓ Включен' : '✗ Отключен'}</p>
            <p><strong>Резервное хранилище</strong></p>
          </div>
        </div>
      </div>

      <div className="default-provider">
        <p><strong>Провайдер по умолчанию:</strong> {providersInfo.default === 'd_id' ? 'D-ID' : 'Cloudinary'}</p>
      </div>
    </div>
  );
};

export default StorageInfo;
