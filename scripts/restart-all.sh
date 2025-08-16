#!/bin/bash

# 🔄 Скрипт перезапуска всего проекта Talking Head
# Автор: AI Assistant
# Дата: 16 августа 2025

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Функция для ошибок
error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Функция для предупреждений
warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Функция для успеха
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Функция для информации
info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Основная функция
main() {
    echo -e "${BLUE}🔄 Перезапуск всего проекта Talking Head${NC}"
    echo "=========================================="
    
    # Останавливаем все
    log "Остановка всех сервисов..."
    if ./scripts/stop-all.sh; then
        success "Все сервисы остановлены"
    else
        warn "Некоторые сервисы могли быть уже остановлены"
    fi
    
    # Ждем немного
    sleep 3
    
    # Запускаем все
    log "Запуск всех сервисов..."
    if ./scripts/start-all.sh; then
        success "Проект успешно перезапущен!"
    else
        error "Не удалось перезапустить проект"
        exit 1
    fi
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
