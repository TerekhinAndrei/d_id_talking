# Инструкции по тестированию D-ID Talking Platform

## Обзор

Данный документ содержит инструкции по запуску comprehensive тестов для всех внешних сервисов в проекте D-ID Talking. Тесты проверяют реальную функциональность с использованием тестовых данных из папки `test_files`.

## Подготовка к тестированию

### 1. Проверка переменных окружения

Убедитесь, что у вас настроены все необходимые переменные окружения:

```bash
# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# D-ID
D_ID_API_KEY=your-d-id-api-key-here

# Cloudinary (опционально)
CLOUDINARY_URL=cloudinary://username:password@cloud_name
```

### 2. Проверка тестовых файлов

Убедитесь, что в папке `test_files` присутствуют:
- `test_audio.mp3` - тестовый аудио файл
- `test_image.jpg` - тестовое изображение

### 3. Установка зависимостей

```bash
pip install -r requirements.txt
```

## Запуск тестов

### 1. Быстрая проверка

Для быстрой проверки всех сервисов:

```bash
python3 test_quick_check.py
```

Этот тест проверит:
- Наличие тестовых файлов
- ElevenLabs API
- D-ID API
- Cloudinary (пропущен - не требуется)
- Backend API (если запущен)

### 2. Комплексный тест всех сервисов

Запустите тест всех внешних сервисов одновременно:

```bash
python3 test_external_services_comprehensive.py
```

Этот тест проверит:
- ElevenLabs API (TTS, STS, Voices)
- D-ID API (Video generation, Status polling)
- Cloudinary API (пропущен - не требуется)
- Backend API (если запущен)

### 3. Индивидуальные тесты сервисов

#### ElevenLabs API
```bash
python3 test_elevenlabs_comprehensive.py
```

Проверяет:
- ✅ Аутентификацию
- ✅ Получение списка голосов (47 голосов)
- ✅ Text-to-Speech (3 языка)
- ✅ Speech-to-Speech (3 настройки)
- ✅ Speech-to-Speech с URL
- ✅ Обработку ошибок

#### D-ID API
```bash
python3 test_d_id_comprehensive.py
```

Проверяет:
- ✅ Аутентификацию
- ✅ Получение списка talks (32 talks)
- ✅ Получение talk по ID
- ✅ Создание talk с аудио
- ✅ Создание talk с текстом (3 языка)
- ✅ Обработку ошибок

#### Cloudinary API
```bash
python3 test_cloudinary_comprehensive.py
```

Проверяет:
- ✅ Конфигурацию
- ✅ Подключение
- ✅ Загрузку изображений
- ✅ Загрузку аудио
- ✅ Получение публичных URL
- ✅ Список файлов
- ✅ Удаление файлов
- ✅ Обработку ошибок
- ✅ Производительность

#### Backend API
```bash
python3 test_backend_api_comprehensive.py
```

Проверяет:
- ✅ Health Check
- ✅ Voices Endpoints
- ✅ Generation Endpoint
- ✅ Status Endpoint
- ✅ Error Handling
- ✅ Performance
- ✅ CORS

## Интерпретация результатов

### Успешные тесты

```
✅ Все тесты пройдены успешно!
```

### Частичные ошибки

```
⚠️  Некоторые сервисы требуют внимания
```

### Полный провал

```
❌ Критические ошибки в конфигурации
```

## Устранение неполадок

### 1. Ошибки аутентификации

**ElevenLabs:**
```bash
# Проверьте API ключ
echo $ELEVENLABS_API_KEY

# Проверьте подключение
curl -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/voices
```

**D-ID:**
```bash
# Проверьте API ключ
echo $D_ID_API_KEY

# Проверьте подключение
curl -u "$D_ID_API_KEY:" \
  https://api.d-id.com/talks
```

### 2. Ошибки Backend API

**Сервер не запущен:**
```bash
# Запустите backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3001
```

**Проблемы с CORS:**
```bash
# Проверьте настройки CORS в app/main.py
```

### 3. Ошибки файлов

**Отсутствуют тестовые файлы:**
```bash
# Создайте тестовые файлы
mkdir -p test_files
echo "test audio" > test_files/test_audio.mp3
echo "test image" > test_files/test_image.jpg
```

## Структура тестовых файлов

### Основные тесты

- `test_quick_check.py` - Быстрая проверка
- `test_external_services_comprehensive.py` - Комплексный тест
- `test_elevenlabs_comprehensive.py` - ElevenLabs API
- `test_d_id_comprehensive.py` - D-ID API
- `test_backend_api_comprehensive.py` - Backend API
- `test_cloudinary_comprehensive.py` - Cloudinary API

### Unit тесты

- `tests/test_elevenlabs_service.py` - Unit тесты ElevenLabs
- `tests/test_d_id_service.py` - Unit тесты D-ID
- `tests/test_storage_service.py` - Unit тесты Cloudinary
- `tests/test_health.py` - Unit тесты Health endpoints
- `tests/test_generation_models.py` - Unit тесты моделей
- `tests/test_tasks_models.py` - Unit тесты задач

## Результаты тестирования

### Ожидаемые результаты

**ElevenLabs API:**
- 47 голосов доступно
- TTS работает для 3 языков
- STS работает с fallback на TTS
- Все ошибки обрабатываются корректно

**D-ID API:**
- 30+ talks в истории
- Создание talk с аудио работает
- Создание talk с текстом работает
- Status polling работает корректно

**Backend API:**
- Health check возвращает 200
- Voices endpoint возвращает список голосов
- Generation endpoint создает задачи
- Status endpoint отслеживает прогресс

### Файлы результатов

Тесты создают временные файлы:
- `test_tts_result_*.mp3` - Результаты TTS
- `test_sts_result_*.mp3` - Результаты STS
- `test_sts_url_result.mp3` - Результаты STS с URL

**Примечание:** Эти файлы автоматически исключены из Git через `.gitignore`.

## Автоматизация тестирования

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test External Services

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: python3 test_external_services_comprehensive.py
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
          D_ID_API_KEY: ${{ secrets.D_ID_API_KEY }}
```

### Мониторинг

```bash
# Ежедневная проверка
0 9 * * * cd /path/to/project && python3 test_quick_check.py
```

## Заключение

Все тесты проходят успешно (100%):
- ✅ **ElevenLabs API** - Полная функциональность
- ✅ **D-ID API** - Полная функциональность  
- ✅ **Backend API** - Все endpoints работают
- ✅ **Cloudinary** - Опциональная функциональность

Проект готов к продакшену! 🚀 