#!/usr/bin/env python3
"""
Детальный тест для отладки D-ID API
"""

import requests
import json
from app.services.d_id_service import DIdService

def test_d_id_debug():
    """Детальный тест D-ID API"""
    print("🔍 Детальный тест D-ID API")
    print("=" * 50)
    
    # Создаем сервис
    service = DIdService()
    
    print(f"API Key: {service.api_key[:10] if service.api_key else 'None'}...")
    print(f"Base URL: {service.base_url}")
    
    # Тест 1: Аутентификация
    print("\n1️⃣ Тест аутентификации...")
    try:
        auth_result = service.test_authentication()
        print(f"Результат: {auth_result}")
    except Exception as e:
        print(f"❌ Ошибка аутентификации: {e}")
    
    # Тест 2: Получение списка talks
    print("\n2️⃣ Тест получения списка talks...")
    try:
        talks = service.get_talks()
        print(f"Получено talks: {len(talks)}")
        if talks:
            print(f"Первый talk: {talks[0]}")
    except Exception as e:
        print(f"❌ Ошибка получения talks: {e}")
    
    # Тест 3: Создание talk с простым текстом
    print("\n3️⃣ Тест создания talk с текстом...")
    try:
        talk_id = service.create_talk_with_text(
            image_url="https://example.com/image.jpg",
            text="Hello world!"
        )
        print(f"✅ Talk создан: {talk_id}")
    except Exception as e:
        print(f"❌ Ошибка создания talk: {e}")
    
    # Тест 4: Создание talk с аудио
    print("\n4️⃣ Тест создания talk с аудио...")
    try:
        talk_id = service.create_talk_with_audio(
            image_url="https://example.com/image.jpg",
            audio_url="https://example.com/audio.mp3"
        )
        print(f"✅ Talk создан: {talk_id}")
    except Exception as e:
        print(f"❌ Ошибка создания talk: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Детальный тест завершен")

def test_d_id_raw_request():
    """Тест прямого запроса к D-ID API"""
    print("\n🔧 Тест прямого запроса к D-ID API")
    print("=" * 50)
    
    from app.config import config
    
    headers = config.get_d_id_headers()
    print(f"Заголовки: {headers}")
    
    # Тест 1: GET /talks
    print("\n1️⃣ GET /talks")
    try:
        response = requests.get(
            "https://api.d-id.com/talks",
            headers=headers,
            timeout=30
        )
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    # Тест 2: POST /talks с простым текстом
    print("\n2️⃣ POST /talks с текстом")
    try:
        payload = {
            "source_url": "https://example.com/image.jpg",
            "script": {
                "type": "text",
                "input": "Hello world!"
            }
        }
        
        response = requests.post(
            "https://api.d-id.com/talks",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Talk создан: {result.get('id')}")
        else:
            print(f"❌ Ошибка создания talk")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    # Тест 3: POST /talks с аудио
    print("\n3️⃣ POST /talks с аудио")
    try:
        payload = {
            "source_url": "https://example.com/image.jpg",
            "script": {
                "type": "audio",
                "audio_url": "https://example.com/audio.mp3"
            }
        }
        
        response = requests.post(
            "https://api.d-id.com/talks",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Talk создан: {result.get('id')}")
        else:
            print(f"❌ Ошибка создания talk")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_d_id_debug()
    test_d_id_raw_request() 