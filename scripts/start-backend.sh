#!/bin/bash

# 🐍 Скрипт запуска бэкенда Talking Head
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
BACKEND_PORT=8000
BACKEND_HOST="0.0.0.0"
PID_FILE="backend.pid"
LOG_FILE="backend.log"

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
    if [ ! -f "requirements.txt" ] || [ ! -d "app" ]; then
        error "Скрипт должен запускаться из корневой папки проекта talking-head"
        exit 1
    fi
}

# Проверка Python и зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    # Проверка Python
    if ! command -v python3 &> /dev/null; then
        error "Python3 не найден. Установите Python 3.8+"
        exit 1
    fi
    
    # Проверка версии Python
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    log "Найдена версия Python: $PYTHON_VERSION"
    
    # Проверка виртуального окружения
    if [ -z "$VIRTUAL_ENV" ]; then
        warn "Виртуальное окружение не активировано"
        log "Рекомендуется активировать виртуальное окружение:"
        log "  python3 -m venv venv"
        log "  source venv/bin/activate"
    else
        log "Виртуальное окружение активировано: $VIRTUAL_ENV"
    fi
    
    # Проверка зависимостей
    if [ ! -f "requirements.txt" ]; then
        error "Файл requirements.txt не найден"
        exit 1
    fi
    
    # Установка зависимостей если нужно
    log "Проверка установленных пакетов..."
    if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
        warn "Не все зависимости установлены. Устанавливаем..."
        pip install -r requirements.txt
    fi
}

# Проверка переменных окружения
check_environment() {
    log "Проверка переменных окружения..."
    
    if [ ! -f ".env" ]; then
        warn "Файл .env не найден"
        if [ -f "env.example" ]; then
            log "Копируем env.example в .env..."
            cp env.example .env
            warn "Отредактируйте .env файл с вашими API ключами"
        else
            error "Файл env.example не найден"
            exit 1
        fi
    fi
    
    # Проверка обязательных переменных
    if [ -f ".env" ]; then
        # Проверяем только нужные переменные без загрузки всего файла
        D_ID_API_KEY=$(grep '^D_ID_API_KEY=' .env | cut -d'=' -f2-)
        ELEVENLABS_API_KEY=$(grep '^ELEVENLABS_API_KEY=' .env | cut -d'=' -f2-)
        
        if [ -z "$D_ID_API_KEY" ]; then
            warn "D_ID_API_KEY не установлен в .env"
        fi
        if [ -z "$ELEVENLABS_API_KEY" ]; then
            warn "ELEVENLABS_API_KEY не установлен в .env"
        fi
    fi
}

# Проверка порта
check_port() {
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
        error "Порт $BACKEND_PORT уже занят"
        log "Занятые процессы:"
        lsof -Pi :$BACKEND_PORT -sTCP:LISTEN
        exit 1
    fi
}

# Запуск бэкенда
start_backend() {
    log "Запуск бэкенда на $BACKEND_HOST:$BACKEND_PORT..."
    
    # Создаем папку для логов если её нет
    mkdir -p logs
    
    # Запускаем uvicorn в фоновом режиме
    nohup uvicorn app.main:app \
        --host $BACKEND_HOST \
        --port $BACKEND_PORT \
        --reload \
        --log-level info \
        > logs/$LOG_FILE 2>&1 &
    
    # Сохраняем PID
    echo $! > $PID_FILE
    
    # Ждем немного для запуска
    sleep 2
    
    # Проверяем, что процесс запустился
    if kill -0 $(cat $PID_FILE) 2>/dev/null; then
        success "Бэкенд успешно запущен!"
        log "PID: $(cat $PID_FILE)"
        log "Порт: $BACKEND_PORT"
        log "Логи: logs/$LOG_FILE"
        log "Health check: http://localhost:$BACKEND_PORT/api/v1/health"
        
        # Показываем последние логи
        log "Последние логи:"
        tail -n 10 logs/$LOG_FILE
    else
        error "Не удалось запустить бэкенд"
        log "Проверьте логи: logs/$LOG_FILE"
        exit 1
    fi
}

# Основная функция
main() {
    echo -e "${BLUE}🐍 Запуск бэкенда Talking Head${NC}"
    echo "=================================="
    
    check_project_root
    check_dependencies
    check_environment
    check_port
    start_backend
    
    echo ""
    success "Бэкенд готов к работе!"
    log "Для остановки используйте: ./scripts/stop-backend.sh"
    log "Для перезапуска используйте: ./scripts/restart-backend.sh"
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
