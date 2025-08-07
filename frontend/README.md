# Frontend - D-ID Talking Avatar

Современный React интерфейс для создания интерактивных видео-стримов с анимированными аватарами.

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── Header.jsx      # Заголовок приложения
│   ├── ImageUpload.jsx # Компонент загрузки изображений
│   ├── VoiceSelector.jsx # Компонент выбора голоса
│   ├── CreateStreamButton.jsx # Кнопка создания стрима
│   ├── Features.jsx    # Отображение возможностей
│   ├── Technologies.jsx # Отображение технологий
│   ├── StatusGrid.jsx  # Статус компонентов
│   └── ErrorMessage.jsx # Компонент ошибок
├── hooks/              # Кастомные React хуки
│   └── useVoices.js    # Хук для работы с голосами
├── services/           # API сервисы
│   └── api.js          # Основной API сервис
├── utils/              # Утилиты
│   └── errorHandler.js # Обработка ошибок
├── constants/          # Константы
│   └── index.js        # Основные константы
├── App.jsx             # Главный компонент
├── App.css             # Стили приложения
└── main.jsx           # Точка входа
```

## Компоненты

### ImageUpload
Компонент для загрузки и предварительного просмотра изображений аватаров.

**Props:**
- `selectedImage` - выбранный файл изображения
- `previewUrl` - URL для предварительного просмотра
- `onImageSelect` - callback при выборе изображения
- `onImageRemove` - callback при удалении изображения

### VoiceSelector
Компонент для выбора голоса из списка доступных голосов.

**Props:**
- `selectedVoice` - выбранный голос
- `voices` - массив доступных голосов
- `loadingVoices` - состояние загрузки голосов
- `voicesError` - ошибка загрузки голосов
- `isPlaying` - состояние воспроизведения
- `onVoiceChange` - callback при изменении голоса
- `onPlayVoice` - callback для прослушивания голоса
- `onRetryVoices` - callback для повторной загрузки голосов

### CreateStreamButton
Кнопка для создания видео-стрима с выбранными параметрами.

**Props:**
- `selectedImage` - выбранное изображение
- `selectedVoice` - выбранный голос
- `isCreating` - состояние создания стрима
- `onCreateStream` - callback для создания стрима

## Хуки

### useVoices
Кастомный хук для работы с голосами.

**Возвращает:**
- `voices` - массив голосов
- `loadingVoices` - состояние загрузки
- `voicesError` - ошибка загрузки
- `retryFetchVoices` - функция повторной загрузки

## Сервисы

### apiService
Основной сервис для работы с API.

**Методы:**
- `getVoices()` - получение списка голосов
- `playVoice(voiceId)` - воспроизведение голоса
- `createStream(imageFile, voiceId)` - создание стрима

## Утилиты

### errorHandler
Утилиты для обработки ошибок.

**Функции:**
- `handleApiError(error, fallbackMessage)` - обработка API ошибок
- `showError(message)` - отображение ошибки
- `showSuccess(message)` - отображение успеха

## Константы

### constants/index.js
Основные константы приложения.

- `DEFAULT_AVATAR_URL` - URL аватара по умолчанию
- `FALLBACK_VOICES` - резервные голоса при ошибке API
- `TECHNOLOGIES` - список используемых технологий

## Стили

Приложение использует CSS переменные для темной темы:

```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --accent-primary: #4a9eff;
  /* ... */
}
```

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр сборки
npm run preview
```

## Особенности

- **Модульная архитектура** - компоненты разделены по функциональности
- **Кастомные хуки** - переиспользуемая логика вынесена в хуки
- **Обработка ошибок** - централизованная обработка API ошибок
- **Fallback данные** - резервные данные при недоступности API
- **Адаптивный дизайн** - поддержка мобильных устройств
- **Темная тема** - современный минималистичный дизайн
