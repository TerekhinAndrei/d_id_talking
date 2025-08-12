#!/bin/bash

# Общие утилиты для Git скриптов

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
validate_branch_args() {
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
    
    echo "$FULL_BRANCH_NAME"
}

# Проверка текущего состояния Git
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "У вас есть незакоммиченные изменения."
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Операция отменена"
            exit 0
        fi
    fi
}

# Определение базовой ветки
get_base_branch() {
    local branch_type=$1
    if [ "$branch_type" = "hotfix" ]; then
        echo "main"
    else
        echo "develop"
    fi
}

# Обновление ветки
update_branch() {
    local branch=$1
    print_message "Переключение на $branch..."
    git checkout $branch
    
    print_message "Обновление $branch..."
    git pull origin $branch
}

# Проверка существования ветки
check_branch_exists() {
    local branch_name=$1
    if ! git show-ref --verify --quiet refs/heads/$branch_name; then
        print_error "Ветка $branch_name не существует"
        exit 1
    fi
}
