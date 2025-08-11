import React, { Component } from 'react';

/**
 * Компонент для отображения ошибки
 */
const ErrorFallback = ({ error, resetError }) => {
  return (
    <div className="error-boundary">
      <div className="error-content">
        <h2>🚨 Что-то пошло не так</h2>
        <p>Произошла непредвиденная ошибка в приложении.</p>
        
        {error && (
          <details className="error-details">
            <summary>Детали ошибки</summary>
            <pre className="error-stack">{error.stack}</pre>
          </details>
        )}
        
        <div className="error-actions">
          <button 
            onClick={resetError}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ErrorBoundary для обработки ошибок React компонентов
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние для отображения fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Здесь можно отправить ошибку в систему мониторинга
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // В будущем здесь можно добавить отправку в систему мониторинга
    // например, Sentry, LogRocket, etc.
    
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error report:', errorReport);
    
    // Отправляем в localStorage для отладки
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push(errorReport);
      localStorage.setItem('errorLog', JSON.stringify(errorLog.slice(-10))); // Храним последние 10 ошибок
    } catch (e) {
      console.warn('Could not save error to localStorage:', e);
    }
  };

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Отображаем fallback UI
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
