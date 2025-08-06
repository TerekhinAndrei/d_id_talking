import requests
import base64

url = "https://api.d-id.com/talks/streams"

# Декодируем API ключ из base64
api_key_encoded = "c2VyZ3d5bmFuZEBnbWFpbC5jb206RGlkMjAyNSE="
api_key_decoded = base64.b64decode(api_key_encoded).decode()
print(f"Decoded API key: {api_key_decoded}")

payload = { 
    "stream_warmup": "false",
    "source_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
}
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": f"Basic {api_key_encoded}"
}

print(f"Making request to: {url}")
print(f"Headers: {headers}")
print(f"Payload: {payload}")

response = requests.post(url, json=payload, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
