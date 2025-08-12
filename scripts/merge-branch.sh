#!/bin/bash

# Скрипт для завершения работы над ветками и их слияния
# Использование: ./merge-branch.sh [feature|bugfix|hotfix] "название-ветки"

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

print_message "Завершение работы над веткой: $FULL_BRANCH_NAME"

# Проверка существования ветки
if ! git show-ref --verify --quiet refs/heads/$FULL_BRANCH_NAME; then
    print_error "Ветка $FULL_BRANCH_NAME не существует"
    exit 1
fi

# Проверка текущего состояния
if [ -n "$(git status --porcelain)" ]; then
    print_warning "У вас есть незакоммиченные изменения в текущей ветке"
    read -p "Закоммитить изменения? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Введите сообщение коммита: " COMMIT_MESSAGE
        git add .
        git commit -m "$COMMIT_MESSAGE"
    else
        print_error "Пожалуйста, закоммитьте или отмените изменения перед продолжением"
        exit 1
    fi
fi

# Определение целевой ветки для слияния
if [ "$BRANCH_TYPE" = "hotfix" ]; then
    TARGET_BRANCH="main"
    print_message "Слияние hotfix в main"
else
    TARGET_BRANCH="develop"
    print_message "Слияние $BRANCH_TYPE в develop"
fi

# Переключение на целевую ветку и обновление
print_message "Переключение на $TARGET_BRANCH..."
git checkout $TARGET_BRANCH

print_message "Обновление $TARGET_BRANCH..."
git pull origin $TARGET_BRANCH

# Слияние ветки
print_message "Слияние $FULL_BRANCH_NAME в $TARGET_BRANCH..."
if git merge $FULL_BRANCH_NAME --no-ff -m "Merge $FULL_BRANCH_NAME into $TARGET_BRANCH"; then
    print_message "Слияние выполнено успешно"
else
    print_error "Конфликт при слиянии. Пожалуйста, разрешите конфликты вручную"
    print_message "После разрешения конфликтов выполните:"
    echo "  git add ."
    echo "  git commit"
    echo "  git push origin $TARGET_BRANCH"
    exit 1
fi

# Отправка изменений
print_message "Отправка изменений в remote..."
git push origin $TARGET_BRANCH

# Удаление локальной ветки
read -p "Удалить локальную ветку $FULL_BRANCH_NAME? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_message "Удаление локальной ветки $FULL_BRANCH_NAME..."
    git branch -d $FULL_BRANCH_NAME
    print_message "Локальная ветка удалена"
fi

# Удаление remote ветки
read -p "Удалить remote ветку $FULL_BRANCH_NAME? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_message "Удаление remote ветки $FULL_BRANCH_NAME..."
    git push origin --delete $FULL_BRANCH_NAME
    print_message "Remote ветка удалена"
fi

# Для hotfix - создание тега
if [ "$BRANCH_TYPE" = "hotfix" ]; then
    read -p "Создать тег для релиза? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        read -p "Введите версию (например: v1.0.1): " VERSION
        if [ -n "$VERSION" ]; then
            print_message "Создание тега $VERSION..."
            git tag -a $VERSION -m "Release $VERSION"
            git push origin $VERSION
            print_message "Тег $VERSION создан и отправлен"
        fi
    fi
fi

print_message "Работа над веткой $FULL_BRANCH_NAME завершена!"
print_message "Изменения слиты в $TARGET_BRANCH"
