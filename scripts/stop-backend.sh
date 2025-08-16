#!/bin/bash

# 🛑 Скрипт остановки бэкенда Talking Head
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
PID_FILE="backend.pid"
BACKEND_PORT=8000

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

# Остановка бэкенда по PID
stop_by_pid() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat $PID_FILE)
        log "Остановка процесса с PID: $pid"
        
        if kill -0 $pid 2>/dev/null; then
            # Пробуем graceful shutdown
            kill -TERM $pid
            log "Отправлен сигнал TERM процессу $pid"
            
            # Ждем до 10 секунд для graceful shutdown
            local count=0
            while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
                log "Ожидание остановки процесса... ($count/10)"
            done
            
            # Если процесс все еще жив, убиваем принудительно
            if kill -0 $pid 2>/dev/null; then
                warn "Процесс не остановился gracefully, принудительная остановка..."
                kill -KILL $pid
                sleep 1
            fi
            
            # Проверяем, что процесс остановлен
            if ! kill -0 $pid 2>/dev/null; then
                success "Процесс $pid успешно остановлен"
                rm -f $PID_FILE
                return 0
            else
                error "Не удалось остановить процесс $pid"
                return 1
            fi
        else
            warn "Процесс $pid не найден"
            rm -f $PID_FILE
            return 0
        fi
    else
        warn "PID файл не найден: $PID_FILE"
        return 1
    fi
}

# Остановка бэкенда по порту
stop_by_port() {
    local pids=$(lsof -ti :$BACKEND_PORT 2>/dev/null)
    
    if [ -n "$pids" ]; then
        log "Найдены процессы на порту $BACKEND_PORT: $pids"
        
        for pid in $pids; do
            log "Остановка процесса $pid..."
            kill -TERM $pid 2>/dev/null || true
            
            # Ждем остановки
            local count=0
            while kill -0 $pid 2>/dev/null && [ $count -lt 5 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Принудительная остановка если нужно
            if kill -0 $pid 2>/dev/null; then
                warn "Принудительная остановка процесса $pid"
                kill -KILL $pid 2>/dev/null || true
            fi
        done
        
        # Проверяем, что порт свободен
        sleep 1
        if ! lsof -ti :$BACKEND_PORT >/dev/null 2>&1; then
            success "Все процессы на порту $BACKEND_PORT остановлены"
            return 0
        else
            error "Не удалось остановить все процессы на порту $BACKEND_PORT"
            return 1
        fi
    else
        log "Процессы на порту $BACKEND_PORT не найдены"
        return 0
    fi
}

# Очистка временных файлов
cleanup() {
    log "Очистка временных файлов..."
    
    # Удаляем PID файл
    if [ -f "$PID_FILE" ]; then
        rm -f $PID_FILE
        log "Удален PID файл: $PID_FILE"
    fi
    
    # Удаляем другие временные файлы если есть
    find . -name "*.pyc" -delete 2>/dev/null || true
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log "Очистка завершена"
}

# Основная функция
main() {
    echo -e "${BLUE}🛑 Остановка бэкенда Talking Head${NC}"
    echo "=================================="
    
    check_project_root
    
    local stopped=false
    
    # Пробуем остановить по PID
    if stop_by_pid; then
        stopped=true
    fi
    
    # Если не удалось по PID, пробуем по порту
    if [ "$stopped" = false ]; then
        if stop_by_port; then
            stopped=true
        fi
    fi
    
    # Очистка
    cleanup
    
    if [ "$stopped" = true ]; then
        success "Бэкенд успешно остановлен!"
        log "Для запуска используйте: ./scripts/start-backend.sh"
    else
        warn "Бэкенд мог быть уже остановлен"
    fi
}

# Обработка сигналов
trap 'error "Скрипт прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
