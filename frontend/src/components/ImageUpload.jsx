import React, { useRef } from 'react';

const ImageUpload = ({ selectedImage, previewUrl, onImageSelect, onImageRemove }) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
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
        className="image-upload-area"
        onClick={handleImageClick}
        title="Нажмите для загрузки изображения"
      >
        <div className="image-preview-container">
          <img 
            src={previewUrl} 
            alt="Превью загруженного изображения" 
            className="image-preview"
          />
          {selectedImage && (
            <button 
              className="remove-image-btn"
              onClick={handleRemoveImage}
              title="Удалить изображение"
            >
              ×
            </button>
          )}
          {!selectedImage && (
            <div className="upload-overlay">
              <div className="upload-icon">📷</div>
              <p>Загрузить изображение</p>
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
      />
      {selectedImage && (
        <p className="file-info">
          Выбран файл: {selectedImage.name}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
