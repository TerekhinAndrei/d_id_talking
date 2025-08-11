/**
 * Уровни логирования
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Запись лога
 */
export class LogEntry {
  constructor(level, message, context = null, data = null) {
    this.timestamp = new Date();
    this.level = level;
    this.message = message;
    this.context = context;
    this.data = data;
  }

  toString() {
    const timestamp = this.timestamp.toISOString();
    const contextStr = this.context ? ` [${this.context}]` : '';
    const dataStr = this.data ? ` ${JSON.stringify(this.data)}` : '';
    
    return `[${timestamp}] [${this.level.toUpperCase()}]${contextStr} ${this.message}${dataStr}`;
  }
}

/**
 * Система логирования
 */
export class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Максимальное количество логов в памяти
    this.enabled = true;
    this.minLevel = LogLevel.INFO; // Минимальный уровень для логирования
    
    // Уровни приоритета
    this.levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
  }

  /**
   * Проверяет, должен ли лог быть записан
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  /**
   * Добавляет лог
   */
  log(level, message, context = null, data = null) {
    if (!this.shouldLog(level)) return;

    const logEntry = new LogEntry(level, message, context, data);
    
    // Добавляем в массив логов
    this.logs.push(logEntry);
    
    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Выводим в консоль
    this.outputToConsole(logEntry);
    
    // Сохраняем в localStorage для отладки
    this.saveToStorage(logEntry);
  }

  /**
   * Логирует debug сообщение
   */
  debug(message, context = null, data = null) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Логирует info сообщение
   */
  info(message, context = null, data = null) {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Логирует warning сообщение
   */
  warn(message, context = null, data = null) {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Логирует error сообщение
   */
  error(message, context = null, data = null) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Выводит лог в консоль
   */
  outputToConsole(logEntry) {
    const { level, message, context, data } = logEntry;
    const contextStr = context ? ` [${context}]` : '';
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`🔍${contextStr} ${message}`, data || '');
        break;
      case LogLevel.INFO:
        console.log(`ℹ️${contextStr} ${message}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️${contextStr} ${message}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌${contextStr} ${message}`, data || '');
        break;
    }
  }

  /**
   * Сохраняет лог в localStorage
   */
  saveToStorage(logEntry) {
    try {
      const logKey = 'app_logs';
      const logs = JSON.parse(localStorage.getItem(logKey) || '[]');
      
      // Добавляем новый лог
      logs.push({
        timestamp: logEntry.timestamp.toISOString(),
        level: logEntry.level,
        message: logEntry.message,
        context: logEntry.context,
        data: logEntry.data
      });
      
      // Ограничиваем количество логов в localStorage
      const maxStorageLogs = 100;
      if (logs.length > maxStorageLogs) {
        logs.splice(0, logs.length - maxStorageLogs);
      }
      
      localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (error) {
      console.warn('Could not save log to localStorage:', error);
    }
  }

  /**
   * Получает все логи
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Получает логи определенного уровня
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Получает логи определенного контекста
   */
  getLogsByContext(context) {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Очищает логи
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Экспортирует логи
   */
  exportLogs() {
    return {
      logs: this.logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        context: log.context,
        data: log.data
      })),
      exportTime: new Date().toISOString(),
      totalLogs: this.logs.length
    };
  }

  /**
   * Устанавливает минимальный уровень логирования
   */
  setMinLevel(level) {
    if (this.levelPriority.hasOwnProperty(level)) {
      this.minLevel = level;
    } else {
      this.warn(`Invalid log level: ${level}`, 'Logger');
    }
  }

  /**
   * Включает/выключает логирование
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Устанавливает максимальное количество логов в памяти
   */
  setMaxLogs(maxLogs) {
    this.maxLogs = Math.max(1, maxLogs);
  }
}

// Создаем глобальный экземпляр логгера
export const logger = new Logger();

// Экспортируем удобные функции
export const logDebug = (message, context, data) => logger.debug(message, context, data);
export const logInfo = (message, context, data) => logger.info(message, context, data);
export const logWarn = (message, context, data) => logger.warn(message, context, data);
export const logError = (message, context, data) => logger.error(message, context, data);
