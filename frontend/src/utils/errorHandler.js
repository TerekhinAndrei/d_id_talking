export const handleApiError = (error, fallbackMessage = 'Произошла ошибка') => {
  console.error('API Error:', error);
  
  if (error.message.includes('HTTP error! status:')) {
    const status = error.message.match(/status: (\d+)/)?.[1];
    switch (status) {
      case '401':
        return 'Ошибка авторизации. Проверьте API ключи.';
      case '403':
        return 'Доступ запрещен. Проверьте права доступа.';
      case '404':
        return 'Ресурс не найден.';
      case '429':
        return 'Превышен лимит запросов. Попробуйте позже.';
      case '500':
        return 'Ошибка сервера. Попробуйте позже.';
      default:
        return `Ошибка сервера (${status}). Попробуйте позже.`;
    }
  }
  
  return fallbackMessage;
};

export const showError = (message) => {
  // В будущем можно интегрировать с toast уведомлениями
  alert(message);
};

export const showSuccess = (message) => {
  // В будущем можно интегрировать с toast уведомлениями
  console.log('Success:', message);
};
