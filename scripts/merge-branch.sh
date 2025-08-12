#!/bin/bash

# Скрипт для завершения работы над ветками и их слияния
# Использование: ./merge-branch.sh [feature|bugfix|hotfix] "название-ветки"

set -e

# Подключение общих утилит
source "$(dirname "$0")/git-utils.sh"

# Получение и валидация аргументов
FULL_BRANCH_NAME=$(validate_branch_args "$@")
BRANCH_TYPE=$1
BRANCH_NAME=$2

print_message "Завершение работы над веткой: $FULL_BRANCH_NAME"

# Проверка существования ветки
check_branch_exists "$FULL_BRANCH_NAME"

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
TARGET_BRANCH=$(get_base_branch "$BRANCH_TYPE")
print_message "Слияние $BRANCH_TYPE в $TARGET_BRANCH"

# Обновление целевой ветки
update_branch "$TARGET_BRANCH"

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
