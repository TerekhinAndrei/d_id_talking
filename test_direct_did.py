#!/usr/bin/env python3
"""
Test direct D-ID API call
"""

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

async def test_direct_did():
    load_dotenv()
    
    headers = {
        'Authorization': 'Basic YzJWeVozZDVibUZ1WkVCbmJXRnBiQzVqYjIwOmNYX2cwR20ybTl2dlA2ZG9vTF96ZQ=='
    }
    
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        
        # Read file content first
        with open('frontend/public/default_avatar.jpg', 'rb') as f:
            file_content = f.read()
        
        data.add_field('image', file_content, filename='default_avatar.jpg', content_type='image/jpeg')
        
        async with session.post('https://api.d-id.com/images', headers=headers, data=data) as resp:
            print(f'Status: {resp.status}')
            text = await resp.text()
            print(f'Response: {text}')
            
            if resp.status == 200:
                import json
                try:
                    json_data = json.loads(text)
                    print(f'JSON: {json_data}')
                except:
                    print('Not JSON response')

if __name__ == "__main__":
    asyncio.run(test_direct_did())
