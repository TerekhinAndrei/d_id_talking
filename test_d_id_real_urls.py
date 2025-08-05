#!/usr/bin/env python3
"""
Тест D-ID API с реальными URL
"""

import requests
import json
from app.config import config

def test_d_id_with_real_urls():
    """Тест D-ID API с реальными URL"""
    print("🔍 Тест D-ID API с реальными URL")
    print("=" * 50)
    
    headers = config.get_d_id_headers()
    print(f"Заголовки: {headers}")
    
    # Тест 1: Создание talk с текстом и реальным URL изображения
    print("\n1️⃣ POST /talks с текстом и реальным URL")
    try:
        payload = {
            "source_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7C688eaf6995412dad7ae59bd4/tlk_H9Js8dLFxf8FRyYNS9NSF/source/alice.jpg?AWSAccessKeyId=AKIA5CUMPJBIK65W6FGA&Expires=1754476280&Signature=UDEs6FtiKlka0%2FC7%2FrIPwLOVZeI%3D",
            "script": {
                "type": "text",
                "input": "Hello world! This is a test."
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
    
    # Тест 2: Создание talk с аудио и реальным URL изображения
    print("\n2️⃣ POST /talks с аудио и реальным URL")
    try:
        payload = {
            "source_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7C688eaf6995412dad7ae59bd4/tlk_H9Js8dLFxf8FRyYNS9NSF/source/alice.jpg?AWSAccessKeyId=AKIA5CUMPJBIK65W6FGA&Expires=1754476280&Signature=UDEs6FtiKlka0%2FC7%2FrIPwLOVZeI%3D",
            "script": {
                "type": "audio",
                "audio_url": "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7C688eaf6995412dad7ae59bd4/tlk_H9Js8dLFxf8FRyYNS9NSF/microsoft.wav?AWSAccessKeyId=AKIA5CUMPJBIK65W6FGA&Expires=1754476280&Signature=hjWf3KbgLMJALcpmjAMLsU8uOpk%3D"
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
    
    # Тест 3: Создание talk с простым текстом и публичным URL
    print("\n3️⃣ POST /talks с простым текстом и публичным URL")
    try:
        payload = {
            "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
            "script": {
                "type": "text",
                "input": "Hello world! This is a test message."
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
    test_d_id_with_real_urls() 