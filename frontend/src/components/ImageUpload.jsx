import React, { useRef, useState } from 'react';
import { fileService } from '../services/FileService.js';

const ImageUpload = ({ selectedImage, previewUrl, onImageSelect, onImageRemove, onUploadSuccess, onUploadError }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Сначала валидируем файл
      const validation = fileService.validateFile(file, 'image');
      if (!validation.valid) {
        onUploadError?.(validation.errors.join(', '));
        return;
      }

      // Устанавливаем файл для превью
      onImageSelect(file);

      // Загружаем файл на сервер
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Симулируем прогресс загрузки
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const result = await fileService.uploadImage(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);

        console.log('Image uploaded successfully:', result);
        onUploadSuccess?.(result);

        // Небольшая задержка перед сбросом прогресса
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);

      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        
        console.error('Image upload failed:', error);
        onUploadError?.(error.message);
      }
    }
  };

  const handleImageClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <div 
        className={`image-upload-area ${isUploading ? 'uploading' : ''}`}
        onClick={handleImageClick}
        title={isUploading ? "Загрузка..." : "Нажмите для загрузки изображения"}
      >
        <div className="image-preview-container">
          <img 
            src={previewUrl} 
            alt="Превью загруженного изображения" 
            className="image-preview"
          />
          {selectedImage && !isUploading && (
            <button 
              className="remove-image-btn"
              onClick={handleRemoveImage}
              title="Удалить изображение"
            >
              ×
            </button>
          )}
          {!selectedImage && !isUploading && (
            <div className="upload-overlay">
              <div className="upload-icon">📷</div>
              <p>Загрузить изображение</p>
            </div>
          )}
          {isUploading && (
            <div className="upload-progress-overlay">
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Загрузка... {uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      {selectedImage && (
        <div className="file-info">
          <p>Выбран файл: {selectedImage.name}</p>
          {isUploading && (
            <p className="upload-status">
              Загружается в {fileService.getProvidersInfo().default === 'd_id' ? 'D-ID' : 'Cloudinary'}...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
