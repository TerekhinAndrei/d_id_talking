# Новая архитектура фронтенда

## Обзор

Новая архитектура использует современные подходы к управлению состоянием и API операциям:

- **Zustand** - для управления состоянием
- **React Query** - для API операций и кэширования
- **Framer Motion** - для анимаций
- **Headless UI** - для UI компонентов

## Структура

```
frontend/src/
├── store/                    # Zustand stores
│   ├── index.js             # Основной app store
│   └── streamingStore.js    # Store для D-ID streaming
├── api/                     # React Query API слой
│   └── queries.js          # API queries и mutations
├── providers/               # React провайдеры
│   └── QueryProvider.jsx   # React Query провайдер
├── components/new/          # Новые компоненты
│   └── StatusPanel.jsx     # Панель статуса архитектуры
└── AppNew.jsx              # Новый главный компонент
```

## Основные компоненты

### 1. Zustand Stores

#### App Store (`store/index.js`)
Управляет общим состоянием приложения:
- Изображения (выбор, загрузка, ошибки)
- Голоса (выбор, загрузка)
- UI состояние (тестеры, модальные окна)
- Общие флаги (создание, воспроизведение)

#### Streaming Store (`store/streamingStore.js`)
Управляет состоянием D-ID streaming:
- Stream ID, Session ID
- WebRTC соединение
- Видео/аудио потоки
- Статус соединения

### 2. React Query API (`api/queries.js`)

#### Queries
- `useVoicesQuery()` - получение голосов с кэшированием
- `useStreamStatusQuery()` - статус стрима с автообновлением

#### Mutations
- `useCreateStreamMutation()` - создание стрима
- `useStartStreamMutation()` - запуск стрима
- `useCreateTalkMutation()` - создание talk
- `useCloseStreamMutation()` - закрытие стрима
- `useUploadImageMutation()` - загрузка изображения

### 3. Компоненты

#### StatusPanel
Демонстрирует работу новой архитектуры:
- Статус Zustand stores
- Статус React Query кэша
- Статус streaming соединения
- Отображение ошибок

## Преимущества

### 🚀 Производительность
- Автоматическое кэширование API запросов
- Оптимистичные обновления
- Меньше ре-рендеров компонентов

### 🛠️ Разработка
- Централизованное управление состоянием
- Простое отладка с Redux DevTools
- Типизированные API операции
- Предсказуемые обновления

### 🎨 Пользовательский опыт
- Плавные анимации
- Быстрые отклики интерфейса
- Автоматическое обновление данных
- Обработка ошибок

## Использование

### В компонентах

```javascript
import { useAppStore } from '../store';
import { useStreamingStore } from '../store/streamingStore';
import { useVoices } from '../api/queries';

function MyComponent() {
  // Zustand stores
  const { selectedImage, setSelectedImage } = useAppStore();
  const { streamId, createStream } = useStreamingStore();
  
  // React Query
  const { voices, loadingVoices } = useVoices();
  
  // ...
}
```

### API операции

```javascript
import { useCreateStreamMutation } from '../api/queries';

function StreamComponent() {
  const createStreamMutation = useCreateStreamMutation();
  
  const handleCreate = async () => {
    try {
      const result = await createStreamMutation.mutateAsync({
        imageUrl: 'https://example.com/image.jpg',
        description: 'My stream'
      });
      console.log('Stream created:', result);
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  };
}
```

## Миграция

### С хуков на stores
```javascript
// Старый подход
const [selectedImage, setSelectedImage] = useState(null);
const [isCreating, setIsCreating] = useState(false);

// Новый подход
const { selectedImage, setSelectedImage, isCreating } = useAppStore();
```

### С прямых API вызовов на React Query
```javascript
// Старый подход
const [voices, setVoices] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  apiService.getVoices()
    .then(setVoices)
    .finally(() => setLoading(false));
}, []);

// Новый подход
const { voices, loadingVoices } = useVoices();
```

## Отладка

### Redux DevTools
Откройте Redux DevTools в браузере для просмотра состояния Zustand stores.

### React Query DevTools
В режиме разработки доступны React Query DevTools для мониторинга кэша и запросов.

### StatusPanel
Компонент StatusPanel показывает реальное состояние всех частей архитектуры.

## Следующие шаги

1. **Создание новых компонентов** - разбить монолитные компоненты
2. **UI библиотека** - интеграция Headless UI компонентов
3. **Анимации** - расширение использования Framer Motion
4. **Тестирование** - добавление unit и integration тестов
5. **Оптимизация** - улучшение производительности

## Совместимость

Новая архитектура полностью совместима с существующими компонентами. Старый `App.jsx` остается функциональным, а новый `AppNew.jsx` демонстрирует новую архитектуру.
