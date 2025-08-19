import React, { useRef, useState, useEffect } from 'react';
import { fileService } from '../services/FileService.js';

const ImageUpload = ({ selectedImage, previewUrl, onImageSelect, onImageRemove, onUploadSuccess, onUploadError, compact = false }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Загружаем текущий аватар при монтировании компонента (только в полном режиме)
  useEffect(() => {
    if (compact) return; // Пропускаем загрузку аватара в компактном режиме
    
    const loadCurrentAvatar = async () => {
      setIsLoadingAvatar(true);
      try {
        const avatarInfo = await fileService.getCurrentAvatar();
        if (avatarInfo && avatarInfo.success) {
          setCurrentAvatar(avatarInfo.data);
          console.log('✅ Current avatar loaded:', avatarInfo.data);
        }
      } catch (error) {
        console.log('ℹ️ No current avatar found or error loading:', error.message);
      } finally {
        setIsLoadingAvatar(false);
      }
    };

    loadCurrentAvatar();
  }, [compact]);

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

        // Обновляем информацию о текущем аватаре (только в полном режиме)
        if (!compact) {
          try {
            const avatarInfo = await fileService.getCurrentAvatar();
            if (avatarInfo && avatarInfo.success) {
              setCurrentAvatar(avatarInfo.data);
              console.log('✅ Current avatar updated:', avatarInfo.data);
            }
          } catch (error) {
            console.log('ℹ️ Could not update current avatar info:', error.message);
          }
        }

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
              Загружается в {fileService.getProvidersInfo().default === 'd_id' ? 'D-ID' : 'файловое хранилище'}...
            </p>
          )}
        </div>
      )}
      
      {/* Информация о текущем аватаре (только в полном режиме) */}
      {!compact && currentAvatar && !isUploading && (
        <div className="current-avatar-info">
          <p>Текущий аватар: {currentAvatar.filename}</p>
          <p>Размер: {(currentAvatar.size / 1024).toFixed(1)} KB</p>
          <p>Тип: {currentAvatar.content_type}</p>
        </div>
      )}
      
      {!compact && isLoadingAvatar && (
        <div className="avatar-loading">
          <p>Загрузка информации об аватаре...</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
