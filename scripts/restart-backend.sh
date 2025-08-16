#!/bin/bash

# 🔄 Скрипт перезапуска бэкенда Talking Head
# Автор: AI Assistant
# Дата: 16 августа 2025

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Основная функция
main() {
    echo -e "${BLUE}🔄 Перезапуск бэкенда Talking Head${NC}"
    echo "=================================="
    
    # Останавливаем бэкенд
    log "Остановка бэкенда..."
    if ./scripts/stop-backend.sh; then
        success "Бэкенд остановлен"
    else
        warn "Бэкенд мог быть уже остановлен"
    fi
    
    # Ждем немного
    sleep 2
    
    # Запускаем бэкенд
    log "Запуск бэкенда..."
    if ./scripts/start-backend.sh; then
        success "Бэкенд успешно перезапущен!"
    else
        error "Не удалось перезапустить бэкенд"
        exit 1
    fi
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
