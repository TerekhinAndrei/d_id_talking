# Система хранения файлов

Универсальная система для загрузки и управления файлами с поддержкой множественных провайдеров (Cloudinary, D-ID, Local).

## Архитектура

```
core/
├── types/
│   └── storage.js          # Типы и enum'ы
├── interfaces/
│   └── IStorageProvider.js # Интерфейсы
├── config/
│   └── StorageConfig.js    # Конфигурация
├── providers/
│   ├── BaseStorageProvider.js # Базовый класс провайдера
│   ├── CloudinaryProvider.js  # Провайдер Cloudinary
│   └── DIdProvider.js         # Провайдер D-ID
├── services/
│   └── FileStorageService.js  # Главный сервис
├── examples/
│   └── FileStorageExample.js  # Примеры использования
└── index.js                    # Экспорт всех компонентов
```

## Основные компоненты

### 1. Типы и Enum'ы (`types/storage.js`)

```javascript
// Провайдеры хранения
export const StorageProvider = {
  CLOUDINARY: 'cloudinary',
  D_ID: 'd_id',
  LOCAL: 'local',
  HYBRID: 'hybrid'
};

// Стратегии загрузки
export const UploadStrategy = {
  DIRECT: 'direct',      // Прямая загрузка
  FALLBACK: 'fallback',  // С fallback
  HYBRID: 'hybrid',      // Гибридная загрузка
  AUTO: 'auto'           // Автоматический выбор
};

// Классы для работы с файлами
export class FileMetadata { ... }
export class UploadResult { ... }
export class UploadOptions { ... }
export class UploadStats { ... }
```

### 2. Интерфейсы (`interfaces/IStorageProvider.js`)

```javascript
// Базовый интерфейс провайдера
export class IStorageProvider {
  async initialize() { ... }
  async uploadFile(file, options) { ... }
  async deleteFile(fileId) { ... }
  validateFile(file, options) { ... }
}

// Интерфейс сервиса
export class IFileService {
  async uploadFile(file, options) { ... }
  async uploadImage(file, options) { ... }
  async uploadAudio(file, options) { ... }
  validateFile(file, fileType) { ... }
}
```

### 3. Конфигурация (`config/StorageConfig.js`)

```javascript
export class StorageConfig {
  getProviderConfig(provider) { ... }
  getDefaultProvider() { ... }
  getValidationConfig() { ... }
  isProviderEnabled(provider) { ... }
  getOptimalProvider(fileType) { ... }
}
```

### 4. Провайдеры

#### Базовый провайдер (`providers/BaseStorageProvider.js`)
Абстрактный класс с общей логикой для всех провайдеров.

#### Cloudinary провайдер (`providers/CloudinaryProvider.js`)
```javascript
const provider = new CloudinaryProvider({
  cloudName: 'your-cloud-name',
  apiKey: 'your-api-key',
  uploadPreset: 'your-upload-preset',
  folder: 'd_id_talking'
});
```

#### D-ID провайдер (`providers/DIdProvider.js`)
```javascript
const provider = new DIdProvider({
  apiKey: 'your-d-id-api-key',
  baseUrl: 'https://api.d-id.com',
  maxFileSize: 50 * 1024 * 1024
});
```

### 5. Главный сервис (`services/FileStorageService.js`)

```javascript
import { fileStorageService } from '../core/index.js';

// Инициализация
await fileStorageService.initialize();

// Загрузка файлов
const result = await fileStorageService.uploadFile(file, options);
```

## Использование

### Базовое использование

```javascript
import { fileStorageService, StorageProvider, UploadStrategy } from '../core/index.js';

// Инициализация
await fileStorageService.initialize();

// Загрузка изображения
const imageFile = new File([...], 'image.jpg', { type: 'image/jpeg' });
const result = await fileStorageService.uploadImage(imageFile);

if (result.success) {
  console.log('File uploaded:', result.fileMetadata.url);
}
```

### Продвинутое использование

```javascript
import { UploadOptions, StorageProvider, UploadStrategy } from '../core/index.js';

// Настройка опций загрузки
const options = new UploadOptions({
  provider: StorageProvider.D_ID,
  strategy: UploadStrategy.FALLBACK,
  onProgress: (progress) => console.log('Progress:', progress),
  onSuccess: (result) => console.log('Success:', result),
  onError: (error) => console.error('Error:', error)
});

// Загрузка с fallback
const result = await fileStorageService.uploadAudio(audioFile, options);
```

### Валидация файлов

```javascript
const validation = fileStorageService.validateFile(file, 'image');

if (validation.valid) {
  console.log('File is valid');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Получение статистики

```javascript
const stats = fileStorageService.getUploadStats();
console.log('Success rate:', stats.getSuccessRate() + '%');
console.log('Total uploads:', stats.totalUploads);
```

### Тестирование провайдеров

```javascript
const testResult = await fileStorageService.testProvider('cloudinary');
console.log('Cloudinary available:', testResult.available);
```

## Стратегии загрузки

### 1. DIRECT
Прямая загрузка в указанный провайдер без fallback.

```javascript
const options = new UploadOptions({
  provider: StorageProvider.CLOUDINARY,
  strategy: UploadStrategy.DIRECT
});
```

### 2. FALLBACK
Загрузка в основной провайдер с автоматическим переключением на резервный при ошибке.

```javascript
const options = new UploadOptions({
  provider: StorageProvider.D_ID,
  strategy: UploadStrategy.FALLBACK
});
```

### 3. HYBRID
Загрузка во все доступные провайдеры одновременно.

```javascript
const options = new UploadOptions({
  strategy: UploadStrategy.HYBRID
});
```

### 4. AUTO
Автоматический выбор стратегии на основе доступных провайдеров.

```javascript
const options = new UploadOptions({
  strategy: UploadStrategy.AUTO
});
```

## Конфигурация

### Настройка провайдеров

```javascript
// В ConfigManager или через переменные окружения
const config = {
  'storage.defaultProvider': 'd_id',
  'storage.cloudinary.enabled': true,
  'storage.cloudinary.cloudName': 'your-cloud-name',
  'storage.cloudinary.apiKey': 'your-api-key',
  'storage.d_id.enabled': true,
  'storage.d_id.apiKey': 'your-d-id-api-key',
  'storage.maxFileSize': 10 * 1024 * 1024
};
```

### Валидация

```javascript
const validationConfig = {
  maxFileSize: 10 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/webm'],
  maxFilenameLength: 255,
  allowedFilenameChars: /^[a-zA-Z0-9._-]+$/
};
```

## Утилиты

### FileUtils

```javascript
import { FileUtils } from '../core/index.js';

// Определение типа файла
const fileType = FileUtils.getFileType(file);

// Форматирование размера
const size = FileUtils.formatFileSize(1024 * 1024); // "1 MB"

// Проверка типа
const isImage = FileUtils.isImage(file);
const isAudio = FileUtils.isAudio(file);

// Создание превью
const imagePreview = await FileUtils.createImagePreview(file, 200, 200);
const audioPreview = await FileUtils.createAudioPreview(file);
```

## Интеграция с React

### Хук useFileStorage

```javascript
import { useFileStorage } from '../core/index.js';

function MyComponent() {
  const { uploadFile, uploadImage, validateFile, getUploadStats } = useFileStorage();

  const handleFileUpload = async (file) => {
    const result = await uploadImage(file);
    if (result.success) {
      console.log('Uploaded:', result.fileMetadata.url);
    }
  };

  return (
    <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
  );
}
```

## Обработка ошибок

```javascript
try {
  const result = await fileStorageService.uploadFile(file);
  
  if (result.success) {
    // Успешная загрузка
    console.log('File uploaded:', result.fileMetadata);
  } else {
    // Ошибка загрузки
    console.error('Upload failed:', result.error);
  }
} catch (error) {
  // Неожиданная ошибка
  console.error('Unexpected error:', error);
}
```

## Расширение системы

### Добавление нового провайдера

1. Создайте новый класс, наследующий от `BaseStorageProvider`
2. Реализуйте все абстрактные методы
3. Добавьте провайдер в `FileStorageService._initializeProviders()`

```javascript
export class MyCustomProvider extends BaseStorageProvider {
  constructor(config = {}) {
    super('my_custom', config);
  }

  async _uploadFile(file, options) {
    // Реализация загрузки
  }

  async _deleteFile(fileId) {
    // Реализация удаления
  }

  // ... другие методы
}
```

## Примеры

См. файл `examples/FileStorageExample.js` для полных примеров использования всех возможностей системы.

## Миграция с существующего кода

### Замена FileService

```javascript
// Старый код
import { fileService } from '../services/FileService.js';
const result = await fileService.uploadImage(file);

// Новый код
import { fileStorageService } from '../core/index.js';
const result = await fileStorageService.uploadImage(file);
```

### Замена API вызовов

```javascript
// Старый код
import { apiService } from '../services/api.js';
const result = await apiService.uploadImage(file);

// Новый код
import { fileStorageService } from '../core/index.js';
const result = await fileStorageService.uploadImage(file);
```

## Производительность

- Автоматическая инициализация провайдеров
- Кэширование конфигурации
- Статистика загрузок
- Оптимизированная валидация
- Поддержка прогресса загрузки

## Безопасность

- Валидация файлов на клиенте и сервере
- Проверка типов файлов
- Ограничение размера файлов
- Валидация имен файлов
- Безопасная обработка ошибок
