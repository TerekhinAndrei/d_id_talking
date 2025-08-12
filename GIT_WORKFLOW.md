# Git Workflow для talking-head

## Структура веток

### Основные ветки
- **`main`** - основная ветка, содержит только production-ready код
- **`develop`** - ветка разработки, интеграция всех новых функций

### Ветки разработки
- **`feature/*`** - новые функции (например: `feature/audio-processing-improvements`)
- **`bugfix/*`** - исправления багов (например: `bugfix/microphone-input-issues`)
- **`hotfix/*`** - срочные исправления для production
- **`release/*`** - подготовка релизов

## Workflow

### 1. Начало работы над новой функцией
```bash
# Переключиться на develop
git checkout develop
git pull origin develop

# Создать новую ветку для функции
git checkout -b feature/название-функции

# Работать над функцией...
git add .
git commit -m "feat: добавить новую функцию"

# Отправить ветку в remote
git push -u origin feature/название-функции
```

### 2. Завершение работы над функцией
```bash
# Убедиться, что все изменения закоммичены
git status

# Переключиться на develop
git checkout develop
git pull origin develop

# Слить feature ветку в develop
git merge feature/название-функции

# Удалить локальную feature ветку
git branch -d feature/название-функции

# Отправить изменения в develop
git push origin develop
```

### 3. Исправление багов
```bash
# Создать ветку для исправления
git checkout -b bugfix/описание-бага

# Исправить баг...
git add .
git commit -m "fix: исправить описание бага"

# Слить в develop (аналогично feature веткам)
```

### 4. Срочные исправления (hotfix)
```bash
# Создать hotfix ветку от main
git checkout main
git checkout -b hotfix/срочное-исправление

# Исправить проблему...
git add .
git commit -m "hotfix: срочное исправление"

# Слить в main и develop
git checkout main
git merge hotfix/срочное-исправление
git tag -a v1.0.1 -m "Release version 1.0.1"

git checkout develop
git merge hotfix/срочное-исправление

# Удалить hotfix ветку
git branch -d hotfix/срочное-исправление
```

## Правила именования коммитов

Используйте префиксы для типов изменений:
- `feat:` - новая функция
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг кода
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

## Рекомендации

1. **Регулярно синхронизируйтесь** с develop веткой
2. **Делайте маленькие коммиты** с понятными сообщениями
3. **Используйте Pull Requests** для code review
4. **Тестируйте код** перед слиянием в develop
5. **Документируйте изменения** в README или CHANGELOG

## Текущие ветки проекта

### Основные ветки
- `main` - основная ветка (production-ready код)
- `develop` - ветка разработки (интеграция всех функций)

### Ветки функций (feature)
- `feature/audio-processing-improvements` - улучшения обработки аудио
- `feature/voice-synthesis-improvements` - улучшения синтеза голоса
- `feature/ui-enhancements` - улучшения пользовательского интерфейса

### Ветки исправлений (bugfix)
- `bugfix/microphone-input-issues` - исправления проблем с микрофоном
- `bugfix/streaming-performance` - исправления производительности стриминга

### Ветки релизов (release)
- `release/v1.0.0` - подготовка релиза версии 1.0.0

### Ветки срочных исправлений (hotfix)
- `hotfix/emergency-fixes` - срочные исправления для production

### Специальные ветки
- `api-restructure-migration` - миграция API
- `protected-backend` - защита backend
- `refactoring/v1.0-solid-architecture` - рефакторинг архитектуры
