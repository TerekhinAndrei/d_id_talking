#!/bin/bash

# Скрипт для создания веток разработки
# Использование: ./create-branch.sh [feature|bugfix|hotfix] "название-ветки"

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка аргументов
if [ $# -lt 2 ]; then
    print_error "Использование: $0 [feature|bugfix|hotfix] \"название-ветки\""
    echo "Примеры:"
    echo "  $0 feature \"audio-processing-improvements\""
    echo "  $0 bugfix \"microphone-input-issues\""
    echo "  $0 hotfix \"critical-security-fix\""
    exit 1
fi

BRANCH_TYPE=$1
BRANCH_NAME=$2

# Проверка типа ветки
case $BRANCH_TYPE in
    feature|bugfix|hotfix)
        ;;
    *)
        print_error "Неверный тип ветки. Используйте: feature, bugfix или hotfix"
        exit 1
        ;;
esac

# Формирование полного названия ветки
FULL_BRANCH_NAME="${BRANCH_TYPE}/${BRANCH_NAME}"

print_message "Создание ветки: $FULL_BRANCH_NAME"

# Проверка текущего состояния
if [ -n "$(git status --porcelain)" ]; then
    print_warning "У вас есть незакоммиченные изменения. Рекомендуется закоммитить их перед созданием новой ветки."
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Операция отменена"
        exit 0
    fi
fi

# Определение базовой ветки
if [ "$BRANCH_TYPE" = "hotfix" ]; then
    BASE_BRANCH="main"
    print_message "Создание hotfix ветки от main"
else
    BASE_BRANCH="develop"
    print_message "Создание $BRANCH_TYPE ветки от develop"
fi

# Переключение на базовую ветку и обновление
print_message "Переключение на $BASE_BRANCH..."
git checkout $BASE_BRANCH

print_message "Обновление $BASE_BRANCH..."
git pull origin $BASE_BRANCH

# Создание новой ветки
print_message "Создание ветки $FULL_BRANCH_NAME..."
git checkout -b $FULL_BRANCH_NAME

# Отправка ветки в remote (опционально)
read -p "Отправить ветку в remote? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_message "Отправка ветки в remote..."
    git push -u origin $FULL_BRANCH_NAME
    print_message "Ветка $FULL_BRANCH_NAME создана и отправлена в remote"
else
    print_message "Ветка $FULL_BRANCH_NAME создана локально"
fi

print_message "Готово! Теперь вы можете работать в ветке $FULL_BRANCH_NAME"
