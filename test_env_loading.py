#!/usr/bin/env python3

import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()

print("=== Проверка переменных окружения ===")
print(f"ELEVENLABS_API_KEY: {os.getenv('ELEVENLABS_API_KEY')}")
print(f"D_ID_API_KEY: {os.getenv('D_ID_API_KEY')}")

# Проверяем настройки из конфигурации
from app.core.config import settings

print("\n=== Проверка настроек из конфигурации ===")
print(f"settings.ELEVENLABS_API_KEY: {settings.ELEVENLABS_API_KEY}")
print(f"settings.ELEVENLABS_VOICE_ID: {settings.ELEVENLABS_VOICE_ID}")

# Проверяем сервис ElevenLabs
from app.services.elevenlabs_service import elevenlabs_service

print("\n=== Проверка сервиса ElevenLabs ===")
print(f"elevenlabs_service.api_key: {elevenlabs_service.api_key}")
print(f"elevenlabs_service.is_configured(): {elevenlabs_service.is_configured()}") 