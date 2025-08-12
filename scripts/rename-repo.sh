#!/bin/bash

# Скрипт для переименования репозитория
# Использование: ./scripts/rename-repo.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка текущего состояния
print_message "Проверка текущего состояния репозитория..."

# Проверка, что мы в git репозитории
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Не найден git репозиторий. Запустите скрипт из корня проекта."
    exit 1
fi

# Проверка текущего remote URL
CURRENT_REMOTE=$(git remote get-url origin)
print_message "Текущий remote URL: $CURRENT_REMOTE"

# Проверка, что remote URL содержит старое название
if [[ $CURRENT_REMOTE != *"d_id_talking"* ]]; then
    print_warning "Remote URL не содержит 'd_id_talking'. Возможно, репозиторий уже переименован."
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_message "Для переименования репозитория выполните следующие шаги:"
echo
echo "1. Перейдите на GitHub: https://github.com/TerekhinAndrei/d_id_talking"
echo "2. Нажмите на вкладку 'Settings'"
echo "3. В разделе 'Repository name' измените название на 'talking-head'"
echo "4. Нажмите 'Rename'"
echo
read -p "После переименования на GitHub нажмите Enter для продолжения..."

# Обновление remote URL
print_message "Обновление remote URL..."
NEW_REMOTE="git@github.com:TerekhinAndrei/talking-head.git"
git remote set-url origin "$NEW_REMOTE"

# Проверка обновления
UPDATED_REMOTE=$(git remote get-url origin)
if [[ $UPDATED_REMOTE == "$NEW_REMOTE" ]]; then
    print_message "Remote URL успешно обновлен: $UPDATED_REMOTE"
else
    print_error "Ошибка при обновлении remote URL"
    exit 1
fi

# Тест подключения
print_message "Тестирование подключения к новому репозиторию..."
if git ls-remote origin > /dev/null 2>&1; then
    print_message "Подключение к новому репозиторию успешно!"
else
    print_error "Ошибка подключения к новому репозиторию"
    print_warning "Убедитесь, что репозиторий переименован на GitHub"
    exit 1
fi

# Опциональное переименование локальной папки
echo
read -p "Переименовать локальную папку проекта? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_message "Переименование локальной папки..."
    
    # Получение пути к родительской директории
    PARENT_DIR=$(dirname "$(pwd)")
    CURRENT_DIR_NAME=$(basename "$(pwd)")
    NEW_DIR_NAME="talking-head"
    
    if [[ $CURRENT_DIR_NAME == "d_id_talking" ]]; then
        cd "$PARENT_DIR"
        mv "$CURRENT_DIR_NAME" "$NEW_DIR_NAME"
        cd "$NEW_DIR_NAME"
        print_message "Локальная папка переименована в: $NEW_DIR_NAME"
    else
        print_warning "Текущая папка не называется 'd_id_talking'. Пропускаем переименование."
    fi
fi

print_message "Переименование репозитория завершено!"
echo
print_message "Следующие шаги:"
echo "1. Обновите ссылки в документации (если необходимо)"
echo "2. Уведомите команду о новом названии репозитория"
echo "3. Обновите CI/CD конфигурации (если есть)"
echo
print_message "Новый URL репозитория: https://github.com/TerekhinAndrei/talking-head"
