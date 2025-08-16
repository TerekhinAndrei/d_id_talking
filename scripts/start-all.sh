#!/bin/bash

# 🚀 Скрипт запуска всего проекта Talking Head
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

# Запуск бэкенда
start_backend() {
    log "Запуск бэкенда..."
    if ./scripts/start-backend.sh; then
        success "Бэкенд запущен"
        return 0
    else
        error "Не удалось запустить бэкенд"
        return 1
    fi
}

# Запуск фронтенда
start_frontend() {
    log "Запуск фронтенда..."
    if ./scripts/start-frontend.sh; then
        success "Фронтенд запущен"
        return 0
    else
        error "Не удалось запустить фронтенд"
        return 1
    fi
}

# Проверка статуса сервисов
check_status() {
    log "Проверка статуса сервисов..."
    
    # Проверка бэкенда
    if curl -s http://localhost:8000/api/v1/health >/dev/null 2>&1; then
        success "✅ Бэкенд работает (http://localhost:8000)"
    else
        warn "❌ Бэкенд не отвечает"
    fi
    
    # Проверка фронтенда
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        success "✅ Фронтенд работает (http://localhost:5173)"
    else
        warn "❌ Фронтенд не отвечает"
    fi
}

# Показ информации о проекте
show_info() {
    echo ""
    echo -e "${PURPLE}🎭 Talking Head - AI Avatar Generator${NC}"
    echo "=============================================="
    echo ""
    echo -e "${BLUE}🌐 Доступные URL:${NC}"
    echo "  • Фронтенд: http://localhost:5173"
    echo "  • Бэкенд API: http://localhost:8000"
    echo "  • API Docs: http://localhost:8000/docs"
    echo "  • Health Check: http://localhost:8000/api/v1/health"
    echo ""
    echo -e "${BLUE}📁 Логи:${NC}"
    echo "  • Бэкенд: logs/backend.log"
    echo "  • Фронтенд: logs/frontend.log"
    echo ""
    echo -e "${BLUE}🔧 Управление:${NC}"
    echo "  • Остановка всего: ./scripts/stop-all.sh"
    echo "  • Перезапуск всего: ./scripts/restart-all.sh"
    echo "  • Только бэкенд: ./scripts/start-backend.sh"
    echo "  • Только фронтенд: ./scripts/start-frontend.sh"
    echo ""
    echo -e "${GREEN}🚀 Проект готов к работе!${NC}"
}

# Основная функция
main() {
    echo -e "${BLUE}🚀 Запуск всего проекта Talking Head${NC}"
    echo "=========================================="
    
    check_project_root
    
    # Запускаем бэкенд
    if start_backend; then
        # Ждем немного для полного запуска бэкенда
        sleep 3
        
        # Запускаем фронтенд
        if start_frontend; then
            # Ждем немного для полного запуска фронтенда
            sleep 3
            
            # Проверяем статус
            check_status
            
            # Показываем информацию
            show_info
        else
            error "Не удалось запустить фронтенд"
            exit 1
        fi
    else
        error "Не удалось запустить бэкенд"
        exit 1
    fi
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
