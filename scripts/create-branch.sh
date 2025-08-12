#!/bin/bash

# Скрипт для создания веток разработки
# Использование: ./create-branch.sh [feature|bugfix|hotfix] "название-ветки"

set -e

# Подключение общих утилит
source "$(dirname "$0")/git-utils.sh"

# Получение и валидация аргументов
FULL_BRANCH_NAME=$(validate_branch_args "$@")
BRANCH_TYPE=$1
BRANCH_NAME=$2

print_message "Создание ветки: $FULL_BRANCH_NAME"

# Проверка текущего состояния
check_git_status

# Определение базовой ветки
BASE_BRANCH=$(get_base_branch "$BRANCH_TYPE")
print_message "Создание $BRANCH_TYPE ветки от $BASE_BRANCH"

# Обновление базовой ветки
update_branch "$BASE_BRANCH"

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
