#!/bin/bash

# 🛑 Скрипт остановки всего проекта Talking Head
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

# Проверка, что мы в корневой папке проекта
check_project_root() {
    if [ ! -f "requirements.txt" ] || [ ! -d "app" ] || [ ! -d "frontend" ]; then
        error "Скрипт должен запускаться из корневой папки проекта talking-head"
        exit 1
    fi
}

# Остановка бэкенда
stop_backend() {
    log "Остановка бэкенда..."
    if ./scripts/stop-backend.sh; then
        success "Бэкенд остановлен"
        return 0
    else
        warn "Бэкенд мог быть уже остановлен"
        return 0
    fi
}

# Остановка фронтенда
stop_frontend() {
    log "Остановка фронтенда..."
    if ./scripts/stop-frontend.sh; then
        success "Фронтенд остановлен"
        return 0
    else
        warn "Фронтенд мог быть уже остановлен"
        return 0
    fi
}

# Проверка статуса сервисов
check_status() {
    log "Проверка статуса сервисов..."
    
    # Проверка бэкенда
    if curl -s http://localhost:8000/api/v1/health >/dev/null 2>&1; then
        warn "⚠️  Бэкенд все еще работает"
    else
        success "✅ Бэкенд остановлен"
    fi
    
    # Проверка фронтенда
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        warn "⚠️  Фронтенд все еще работает"
    else
        success "✅ Фронтенд остановлен"
    fi
}

# Очистка временных файлов
cleanup() {
    log "Очистка временных файлов..."
    
    # Удаляем PID файлы
    rm -f backend.pid frontend.pid 2>/dev/null || true
    
    # Удаляем кэш Python
    find . -name "*.pyc" -delete 2>/dev/null || true
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Удаляем временные файлы
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.temp" -delete 2>/dev/null || true
    
    success "Очистка завершена"
}

# Основная функция
main() {
    echo -e "${BLUE}🛑 Остановка всего проекта Talking Head${NC}"
    echo "=========================================="
    
    check_project_root
    
    # Останавливаем фронтенд
    stop_frontend
    
    # Ждем немного
    sleep 1
    
    # Останавливаем бэкенд
    stop_backend
    
    # Ждем немного
    sleep 2
    
    # Проверяем статус
    check_status
    
    # Очистка
    cleanup
    
    echo ""
    success "Проект успешно остановлен!"
    log "Для запуска используйте: ./scripts/start-all.sh"
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
