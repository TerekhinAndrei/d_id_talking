# Быстрый старт Git Workflow

## 🚀 Начало работы

### 1. Настройка алиасов (опционально)
```bash
# Добавить полезные алиасы в ~/.gitconfig
cat git-aliases.txt >> ~/.gitconfig
```

### 2. Создание новой ветки для функции
```bash
# Используя скрипт
./scripts/create-branch.sh feature "название-функции"

# Или вручную
git checkout develop
git pull origin develop
git checkout -b feature/название-функции
git push -u origin feature/название-функции
```

### 3. Работа над функцией
```bash
# Внести изменения...
git add .
git commit -m "feat: добавить новую функцию"
git push origin feature/название-функции
```

### 4. Завершение работы
```bash
# Используя скрипт
./scripts/merge-branch.sh feature "название-функции"

# Или вручную
git checkout develop
git pull origin develop
git merge --no-ff feature/название-функции
git push origin develop
git branch -d feature/название-функции
git push origin --delete feature/название-функции
```

## 📋 Часто используемые команды

```bash
# Статус
git st

# Переключение веток
git co develop
git co feature/название

# Коммиты
git aa
git cm "сообщение"

# Обновление
git up develop

# Просмотр истории
git lg
```

## 🔧 Типы веток

- **`feature/*`** - новые функции
- **`bugfix/*`** - исправления багов  
- **`hotfix/*`** - срочные исправления
- **`release/*`** - подготовка релизов

## 📚 Подробная документация

См. файл `GIT_WORKFLOW.md` для полного описания workflow.
