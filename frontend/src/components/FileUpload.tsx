import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAvatarCreation } from '../hooks';
import DefaultAvatar from '../assets/DefaultAvatar.jpg';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  onFilesSelected?: (files: File[]) => void;
  onFileUpdate?: (file: File, url: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*',
  multiple = false,
  maxSize = 10,
  className = '',
  onFilesSelected,
  onFileUpdate
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setAvatarImage } = useAppContext();
  const { createAvatar, isCreating, error: avatarError } = useAvatarCreation({
    onAvatarCreated: (videoUrl) => {
      console.log('🎭 Avatar created successfully:', videoUrl);
    },
    onError: (error) => {
      console.error('🎭 Avatar creation failed:', error);
    }
  });

  // Устанавливаем изображение по умолчанию при загрузке компонента
  useEffect(() => {
    const setDefaultAvatar = async () => {
      try {
        // Загружаем изображение по умолчанию как File объект
        const response = await fetch(DefaultAvatar);
        const blob = await response.blob();
        const defaultFile = new File([blob], 'DefaultAvatar.jpg', { type: 'image/jpeg' });
        
        // Устанавливаем в контекст только File, НЕ URL
        setAvatarImage(defaultFile);
        // НЕ устанавливаем avatarImageUrl - он будет установлен только после загрузки в D-ID
        setPreviewUrl(DefaultAvatar);
        
        // Добавляем в список файлов
        setSelectedFiles([defaultFile]);
        
        // Уведомляем об обновлении файла
        onFileUpdate?.(defaultFile, DefaultAvatar);
        
      } catch (error) {
        console.error('Failed to load default avatar:', error);
      }
    };

    setDefaultAvatar();
  }, []); // Пустой массив зависимостей - срабатывает только при монтировании

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      setSelectedFiles(fileArray);
      
      // Обновляем контекст
      const firstFile = fileArray[0];
      setAvatarImage(firstFile);
      
      // Создаем локальный URL только для предпросмотра
      const url = URL.createObjectURL(firstFile);
      setPreviewUrl(url);
      
      onFilesSelected?.(fileArray);
      
      // Уведомляем об обновлении файла
      onFileUpdate?.(firstFile, url);
      
      // Создаем аватар с новым изображением
      try {
        await createAvatar(firstFile);
      } catch (error) {
        console.error('Failed to create avatar:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      
      const firstFile = files[0];
      setAvatarImage(firstFile);
      
      // Создаем локальный URL только для предпросмотра
      const url = URL.createObjectURL(firstFile);
      setPreviewUrl(url);
      
      onFilesSelected?.(files);
      
      // Уведомляем об обновлении файла
      onFileUpdate?.(firstFile, url);
      
      // Создаем аватар с новым изображением
      try {
        await createAvatar(firstFile);
      } catch (error) {
        console.error('Failed to create avatar:', error);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Скрытый input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Область загрузки */}
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {previewUrl ? (
          /* Предпросмотр изображения */
          <div className="upload-preview">
            <div className="preview-container">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="preview-image"
              />
              <div className="preview-overlay">
                <div className="preview-content">
                  {isCreating ? (
                    <div className="preview-loading">
                      <div className="loading-spinner"></div>
                      <p className="preview-text">Создание аватара...</p>
                    </div>
                  ) : (
                    <>
                      <div className="preview-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </div>
                      <p className="preview-text">Нажмите для замены</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="preview-info">
              <p className="preview-filename">{selectedFiles[0]?.name}</p>
              <p className="preview-filesize">{formatFileSize(selectedFiles[0]?.size || 0)}</p>
              {avatarError && (
                <p className="preview-error">Ошибка создания аватара: {avatarError}</p>
              )}
            </div>
          </div>
        ) : (
          /* Стандартное содержимое загрузки */
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            
            <div className="upload-text">
              <h3 className="upload-title">
                {isDragOver ? 'Отпустите файлы здесь' : 'Загрузите изображение'}
              </h3>
              <p className="upload-subtitle">
                Перетащите файл сюда или <span className="upload-link">выберите файл</span>
              </p>
              <p className="upload-info">
                Поддерживаемые форматы: JPG, PNG, WebP • Максимальный размер: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;