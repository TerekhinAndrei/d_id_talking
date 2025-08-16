#!/usr/bin/env python3
"""
Debug script for D-ID API authentication
"""

import os
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv('D_ID_API_KEY')
print(f"Raw API key: {repr(api_key)}")

# Test different normalization methods
if api_key:
    print(f"\nTesting normalization methods:")
    
    # Method 1: Direct Basic
    method1 = f"Basic {api_key}"
    print(f"Method 1 (Direct Basic): {method1}")
    
    # Method 2: Split and decode
    if ":" in api_key:
        left, right = api_key.split(":", 1)
        print(f"  Left part: {left}")
        print(f"  Right part: {right}")
        
        try:
            email = base64.b64decode(left).decode("utf-8")
            print(f"  Decoded email: {email}")
            token = base64.b64encode(f"{email}:{right}".encode("utf-8")).decode("utf-8")
            method2 = f"Basic {token}"
            print(f"Method 2 (Decode left): {method2}")
        except Exception as e:
            print(f"  Error decoding left part: {e}")
            token = base64.b64encode(api_key.encode("utf-8")).decode("utf-8")
            method2 = f"Basic {token}"
            print(f"Method 2 (Fallback): {method2}")
    
    # Method 3: Direct encode
    token = base64.b64encode(api_key.encode("utf-8")).decode("utf-8")
    method3 = f"Basic {token}"
    print(f"Method 3 (Direct encode): {method3}")
    
    print(f"\nAll methods tested.")
