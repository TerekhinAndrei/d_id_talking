# Frontend Architecture

## 📁 Project Structure

```
src/
├── components/          # React компоненты
│   ├── ui/             # Базовые UI компоненты
│   ├── layout/         # Layout компоненты
│   └── index.ts        # Экспорт всех компонентов
├── features/           # Feature-based модули
│   ├── streaming/      # Стриминг функциональность
│   ├── voice/          # Голосовые функции
│   └── settings/       # Настройки
├── hooks/              # Custom React хуки
│   ├── common/         # Общие хуки
│   ├── streaming/      # Хуки для стриминга
│   └── voice/          # Хуки для голоса
├── services/           # API и внешние сервисы
│   ├── api/            # API клиенты
│   ├── streaming/      # Стриминг сервисы
│   └── voice/          # Голосовые сервисы
├── utils/              # Утилиты и хелперы
├── types/              # TypeScript типы
├── constants/          # Константы приложения
├── assets/             # Статические ресурсы
├── styles/             # CSS стили
└── main.tsx           # Точка входа
```

## 🏗️ Architecture Principles

### 1. **Feature-Based Organization**
- Каждая фича в отдельной папке
- Собственные компоненты, хуки, сервисы
- Изолированная логика

### 2. **Component Hierarchy**
- **UI Components** - переиспользуемые базовые компоненты
- **Layout Components** - компоненты макета
- **Feature Components** - специфичные для фич компоненты

### 3. **TypeScript First**
- Строгая типизация
- Интерфейсы для всех компонентов
- Типы для API и состояния

### 4. **Custom Hooks**
- Логика вынесена в хуки
- Переиспользование состояния
- Чистые компоненты

## 🎨 Design System

### **Color Palette**
- Primary: Deep Blues (#2563eb)
- Neutral: Dark Grays (#0a0a0a)
- Accent: Teals (#14b8a6)
- Semantic: Success, Warning, Error

### **Typography**
- Font: Inter (Google Fonts)
- Fluid Typography с clamp()
- Responsive font sizes

### **Components**
- Button (Primary, Secondary, Ghost)
- Card (Header, Content, Footer)
- VideoPlayer (Dual video elements)

## 🔧 Development Guidelines

### **Naming Conventions**
- Components: PascalCase (VideoPlayer)
- Files: PascalCase.tsx
- Hooks: camelCase (useStreaming)
- Types: PascalCase (StreamProps)

### **Import Structure**
```typescript
// 1. React imports
import React from 'react';

// 2. Third-party libraries
import { someLib } from 'some-lib';

// 3. Internal imports
import { Button } from '../ui/Button';
import { useStreaming } from '../../hooks/streaming/useStreaming';
import { Stream } from '../../types';
```

### **Component Structure**
```typescript
import React from 'react';
import { ComponentProps } from './types';

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks
  // 2. Event handlers
  // 3. Render
  return <div>...</div>;
};

export default Component;
```

## 🚀 Best Practices

### **Performance**
- React.memo для тяжелых компонентов
- useMemo и useCallback где необходимо
- Lazy loading для больших компонентов

### **State Management**
- Local state в компонентах
- Custom hooks для сложной логики
- Context для глобального состояния

### **Error Handling**
- Error boundaries
- Try-catch в async операциях
- Пользовательские сообщения об ошибках

### **Testing**
- Unit tests для утилит
- Component tests для UI
- Integration tests для фич

## 📦 Dependencies

### **Core**
- React 19
- TypeScript
- Vite

### **Styling**
- CSS Custom Properties
- Utility-first approach
- Responsive design

### **Development**
- ESLint
- Prettier
- TypeScript strict mode
