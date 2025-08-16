#!/bin/bash

# 📊 Скрипт проверки статуса проекта Talking Head
# Автор: AI Assistant
# Дата: 16 августа 2025

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Проверка процессов по PID файлам
check_pid_files() {
    echo -e "${CYAN}📋 Проверка PID файлов:${NC}"
    
    # Проверка бэкенда
    if [ -f "backend.pid" ]; then
        local pid=$(cat backend.pid)
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ✅ Бэкенд: PID $pid (работает)"
        else
            echo -e "  ❌ Бэкенд: PID $pid (не работает)"
        fi
    else
        echo -e "  ⚠️  Бэкенд: PID файл не найден"
    fi
    
    # Проверка фронтенда
    if [ -f "frontend.pid" ]; then
        local pid=$(cat frontend.pid)
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ✅ Фронтенд: PID $pid (работает)"
        else
            echo -e "  ❌ Фронтенд: PID $pid (не работает)"
        fi
    else
        echo -e "  ⚠️  Фронтенд: PID файл не найден"
    fi
}

# Проверка портов
check_ports() {
    echo -e "${CYAN}🌐 Проверка портов:${NC}"
    
    # Проверка порта бэкенда (8000)
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pids=$(lsof -ti :8000)
        echo -e "  ✅ Порт 8000: занят (PID: $pids)"
    else
        echo -e "  ❌ Порт 8000: свободен"
    fi
    
    # Проверка порта фронтенда (5173)
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pids=$(lsof -ti :5173)
        echo -e "  ✅ Порт 5173: занят (PID: $pids)"
    else
        echo -e "  ❌ Порт 5173: свободен"
    fi
}

# Проверка HTTP сервисов
check_http_services() {
    echo -e "${CYAN}🔗 Проверка HTTP сервисов:${NC}"
    
    # Проверка бэкенда
    if curl -s --max-time 5 http://localhost:8000/api/v1/health >/dev/null 2>&1; then
        local response=$(curl -s http://localhost:8000/api/v1/health | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        echo -e "  ✅ Бэкенд: http://localhost:8000 (статус: $response)"
    else
        echo -e "  ❌ Бэкенд: http://localhost:8000 (не отвечает)"
    fi
    
    # Проверка фронтенда
    if curl -s --max-time 5 http://localhost:5173 >/dev/null 2>&1; then
        echo -e "  ✅ Фронтенд: http://localhost:5173 (работает)"
    else
        echo -e "  ❌ Фронтенд: http://localhost:5173 (не отвечает)"
    fi
}

# Проверка логов
check_logs() {
    echo -e "${CYAN}📁 Проверка логов:${NC}"
    
    if [ -f "logs/backend.log" ]; then
        local size=$(du -h logs/backend.log | cut -f1)
        local lines=$(wc -l < logs/backend.log)
        echo -e "  📄 Бэкенд лог: $size, $lines строк"
    else
        echo -e "  ⚠️  Бэкенд лог: не найден"
    fi
    
    if [ -f "logs/frontend.log" ]; then
        local size=$(du -h logs/frontend.log | cut -f1)
        local lines=$(wc -l < logs/frontend.log)
        echo -e "  📄 Фронтенд лог: $size, $lines строк"
    else
        echo -e "  ⚠️  Фронтенд лог: не найден"
    fi
}

# Проверка переменных окружения
check_environment() {
    echo -e "${CYAN}🔧 Проверка окружения:${NC}"
    
    if [ -f ".env" ]; then
        echo -e "  ✅ .env файл: найден"
        
        # Проверка ключевых переменных
        D_ID_API_KEY=$(grep '^D_ID_API_KEY=' .env | cut -d'=' -f2-) 2>/dev/null || true
        ELEVENLABS_API_KEY=$(grep '^ELEVENLABS_API_KEY=' .env | cut -d'=' -f2-) 2>/dev/null || true
        
        if [ -n "$D_ID_API_KEY" ]; then
            echo -e "  ✅ D_ID_API_KEY: установлен"
        else
            echo -e "  ❌ D_ID_API_KEY: не установлен"
        fi
        
        if [ -n "$ELEVENLABS_API_KEY" ]; then
            echo -e "  ✅ ELEVENLABS_API_KEY: установлен"
        else
            echo -e "  ❌ ELEVENLABS_API_KEY: не установлен"
        fi
    else
        echo -e "  ❌ .env файл: не найден"
    fi
}

# Показ последних ошибок
show_recent_errors() {
    echo -e "${CYAN}🚨 Последние ошибки:${NC}"
    
    # Ошибки в логах бэкенда
    if [ -f "logs/backend.log" ]; then
        local errors=$(grep -i "error\|exception\|traceback" logs/backend.log | tail -3)
        if [ -n "$errors" ]; then
            echo -e "  🔴 Бэкенд:"
            echo "$errors" | sed 's/^/    /'
        else
            echo -e "  ✅ Бэкенд: ошибок не найдено"
        fi
    fi
    
    # Ошибки в логах фронтенда
    if [ -f "logs/frontend.log" ]; then
        local errors=$(grep -i "error\|exception\|failed" logs/frontend.log | tail -3)
        if [ -n "$errors" ]; then
            echo -e "  🔴 Фронтенд:"
            echo "$errors" | sed 's/^/    /'
        else
            echo -e "  ✅ Фронтенд: ошибок не найдено"
        fi
    fi
}

# Основная функция
main() {
    echo -e "${BLUE}📊 Статус проекта Talking Head${NC}"
    echo "=================================="
    
    check_project_root
    
    echo ""
    check_pid_files
    echo ""
    check_ports
    echo ""
    check_http_services
    echo ""
    check_logs
    echo ""
    check_environment
    echo ""
    show_recent_errors
    
    echo ""
    echo -e "${PURPLE}🔧 Управление:${NC}"
    echo "  • Запуск всего: ./scripts/start-all.sh"
    echo "  • Остановка всего: ./scripts/stop-all.sh"
    echo "  • Перезапуск всего: ./scripts/restart-all.sh"
    echo "  • Только бэкенд: ./scripts/start-backend.sh"
    echo "  • Только фронтенд: ./scripts/start-frontend.sh"
}

# Запуск основной функции
main "$@"
