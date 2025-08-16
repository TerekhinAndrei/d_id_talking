#!/bin/bash

# ⚛️ Скрипт запуска фронтенда Talking Head
# Автор: AI Assistant
# Дата: 16 августа 2025

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
FRONTEND_PORT=5173
PID_FILE="frontend.pid"
LOG_FILE="frontend.log"

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

# Проверка, что мы в корневой папке проекта
check_project_root() {
    if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
        error "Скрипт должен запускаться из корневой папки проекта talking-head"
        exit 1
    fi
}

# Проверка Node.js и npm
check_dependencies() {
    log "Проверка зависимостей..."
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js не найден. Установите Node.js 16+"
        exit 1
    fi
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        error "npm не найден. Установите npm"
        exit 1
    fi
    
    # Проверка версий
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log "Node.js версия: $NODE_VERSION"
    log "npm версия: $NPM_VERSION"
    
    # Проверка package.json
    if [ ! -f "frontend/package.json" ]; then
        error "Файл frontend/package.json не найден"
        exit 1
    fi
}

# Установка зависимостей
install_dependencies() {
    log "Проверка установленных зависимостей..."
    
    if [ ! -d "frontend/node_modules" ]; then
        warn "node_modules не найден. Устанавливаем зависимости..."
        cd frontend
        npm install
        cd ..
        success "Зависимости установлены"
    else
        log "Зависимости уже установлены"
    fi
}

# Проверка порта
check_port() {
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
        error "Порт $FRONTEND_PORT уже занят"
        log "Занятые процессы:"
        lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN
        exit 1
    fi
}

# Запуск фронтенда
start_frontend() {
    log "Запуск фронтенда на порту $FRONTEND_PORT..."
    
    # Создаем папку для логов если её нет
    mkdir -p logs
    
    # Переходим в папку фронтенда
    cd frontend
    
    # Запускаем Vite в фоновом режиме
    nohup npm run dev \
        -- --port $FRONTEND_PORT \
        --host 0.0.0.0 \
        > ../logs/$LOG_FILE 2>&1 &
    
    # Сохраняем PID
    echo $! > ../$PID_FILE
    
    # Возвращаемся в корневую папку
    cd ..
    
    # Ждем немного для запуска
    sleep 3
    
    # Проверяем, что процесс запустился
    if kill -0 $(cat $PID_FILE) 2>/dev/null; then
        success "Фронтенд успешно запущен!"
        log "PID: $(cat $PID_FILE)"
        log "Порт: $FRONTEND_PORT"
        log "Логи: logs/$LOG_FILE"
        log "URL: http://localhost:$FRONTEND_PORT"
        
        # Показываем последние логи
        log "Последние логи:"
        tail -n 10 logs/$LOG_FILE
    else
        error "Не удалось запустить фронтенд"
        log "Проверьте логи: logs/$LOG_FILE"
        exit 1
    fi
}

# Основная функция
main() {
    echo -e "${BLUE}⚛️ Запуск фронтенда Talking Head${NC}"
    echo "=================================="
    
    check_project_root
    check_dependencies
    install_dependencies
    check_port
    start_frontend
    
    echo ""
    success "Фронтенд готов к работе!"
    log "Для остановки используйте: ./scripts/stop-frontend.sh"
    log "Для перезапуска используйте: ./scripts/restart-frontend.sh"
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
