#!/usr/bin/env python3
"""
Тест загрузки конфигурации из .env файла
"""

from app.config import config

def test_config_loading():
    """Тест загрузки конфигурации"""
    print("🔧 Тестирование загрузки конфигурации")
    print("=" * 50)
    
    print(f"ElevenLabs API Key: {'✅ Настроен' if config.ELEVENLABS_API_KEY else '❌ Не настроен'}")
    if config.ELEVENLABS_API_KEY:
        print(f"   Ключ: {config.ELEVENLABS_API_KEY[:10]}...")
    
    print(f"D-ID API Key: {'✅ Настроен' if config.D_ID_API_KEY else '❌ Не настроен'}")
    if config.D_ID_API_KEY:
        print(f"   Ключ: {config.D_ID_API_KEY[:10]}...")
    
    print(f"ElevenLabs Base URL: {config.ELEVENLABS_BASE_URL}")
    print(f"D-ID Base URL: {config.D_ID_BASE_URL}")
    
    print(f"\nПроверка методов:")
    print(f"is_elevenlabs_configured(): {config.is_elevenlabs_configured()}")
    print(f"is_d_id_configured(): {config.is_d_id_configured()}")
    
    # Тестируем получение заголовков
    try:
        elevenlabs_headers = config.get_elevenlabs_headers()
        print(f"✅ ElevenLabs заголовки: {elevenlabs_headers}")
    except Exception as e:
        print(f"❌ Ошибка ElevenLabs заголовков: {e}")
    
    try:
        d_id_headers = config.get_d_id_headers()
        print(f"✅ D-ID заголовки: {d_id_headers}")
    except Exception as e:
        print(f"❌ Ошибка D-ID заголовков: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Тест конфигурации завершен")

if __name__ == "__main__":
    test_config_loading() 