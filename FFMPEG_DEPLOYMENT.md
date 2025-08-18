# Деплой с поддержкой FFmpeg

## Проблема

При деплое на Render может возникнуть ошибка:
```
Package libavformat was not found in the pkg-config search path
```

Это происходит потому, что пакеты `aiortc` и `av` требуют системные FFmpeg библиотеки.

## Решения

### Вариант 1: Базовый деплой (без FFmpeg)

Используйте стандартный `requirements.txt` без FFmpeg зависимостей:

```yaml
# render.yaml
buildCommand: pip install -r requirements.txt
```

**Преимущества:**
- Быстрая сборка
- Меньше зависимостей
- Стабильная работа

**Ограничения:**
- Нет конвертации аудио через FFmpeg
- Нет WebRTC через aiortc

### Вариант 2: Полный деплой (с FFmpeg)

Используйте `requirements-full.txt` с системными зависимостями:

```yaml
# render.yaml
buildCommand: |
  apt-get update && apt-get install -y \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libavfilter-dev \
    libswscale-dev \
    libswresample-dev \
    ffmpeg
  pip install -r requirements-full.txt
```

**Преимущества:**
- Полная функциональность
- Конвертация аудио
- WebRTC поддержка

**Недостатки:**
- Долгая сборка
- Больше зависимостей
- Возможные проблемы совместимости

## Пошаговые инструкции

### Для базового деплоя:

1. Используйте файл `render.yaml`
2. Build Command: `pip install -r requirements.txt`
3. Все остальные настройки стандартные

### Для деплоя с FFmpeg:

1. Используйте файл `render-with-ffmpeg.yaml`
2. Или измените Build Command в `render.yaml`:
   ```
   apt-get update && apt-get install -y pkg-config libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev libavfilter-dev libswscale-dev libswresample-dev ffmpeg && pip install -r requirements-full.txt
   ```

## Проверка функциональности

### Базовый деплой:
- ✅ API endpoints
- ✅ ElevenLabs TTS
- ✅ D-ID streaming
- ✅ WebSocket соединения
- ❌ Конвертация аудио через FFmpeg
- ❌ WebRTC через aiortc

### Деплой с FFmpeg:
- ✅ API endpoints
- ✅ ElevenLabs TTS
- ✅ D-ID streaming
- ✅ WebSocket соединения
- ✅ Конвертация аудио через FFmpeg
- ✅ WebRTC через aiortc

## Рекомендации

### Для продакшена:
- Начните с базового деплоя
- Добавьте FFmpeg только если нужна конвертация аудио
- Тестируйте функциональность после каждого изменения

### Для разработки:
- Используйте локальную среду с FFmpeg
- Тестируйте без FFmpeg на Render
- Добавляйте FFmpeg по мере необходимости

## Альтернативы

Если FFmpeg вызывает проблемы:

1. **Используйте Cloudinary** для конвертации аудио
2. **Используйте браузерные WebRTC API** вместо aiortc
3. **Используйте другие сервисы** для обработки медиа

## Устранение неполадок

### Ошибка установки системных пакетов:
```
E: Package 'libavformat-dev' has no installation candidate
```

**Решение**: Обновите список пакетов:
```bash
apt-get update && apt-get install -y ...
```

### Ошибка компиляции aiortc:
```
error: command 'gcc' failed with exit status 1
```

**Решение**: Добавьте компилятор:
```bash
apt-get install -y build-essential
```

### Ошибка линковки:
```
undefined reference to 'av_*'
```

**Решение**: Убедитесь, что все FFmpeg библиотеки установлены:
```bash
apt-get install -y libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev libavfilter-dev libswscale-dev libswresample-dev
```
