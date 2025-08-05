#!/usr/bin/env python3
"""
Прямой тест D-ID API
"""

import os
import requests
import json
from app.config import config

def test_d_id_direct():
    """Прямой тест D-ID API"""
    
    print("🔥 ПРЯМОЙ ТЕСТ D-ID API")
    print("=" * 50)
    
    # Проверяем конфигурацию
    d_id_api_key = config.D_ID_API_KEY
    print(f"✅ D-ID API Key: {d_id_api_key[:10]}...")
    
    # Создаем тестовый payload
    payload = {
        "source_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        "script": {
            "type": "audio",
            "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
        },
        "config": {
            "stitch": True,
            "result_format": "mp4"
        }
    }
    
    print(f"🔥 ТЕСТОВЫЙ PAYLOAD:")
    print(json.dumps(payload, indent=2))
    
    # Отправляем запрос
    url = "https://api.d-id.com/talks"
    headers = {
        "Authorization": f"Basic {d_id_api_key}",
        "Content-Type": "application/json"
    }
    
    print(f"🔥 ОТПРАВЛЯЕМ ЗАПРОС:")
    print(f"  URL: {url}")
    print(f"  Headers: {headers}")
    print(f"  Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"📥 ОТВЕТ:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        print(f"  Response: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ УСПЕХ: {result}")
        else:
            print(f"❌ ОШИБКА: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ ИСКЛЮЧЕНИЕ: {e}")

if __name__ == "__main__":
    test_d_id_direct() 