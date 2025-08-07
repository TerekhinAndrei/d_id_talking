#!/usr/bin/env python3
"""
Direct test of ElevenLabs WebSocket connection
"""

import asyncio
import websockets
import json
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_elevenlabs_websocket_direct():
    """Test direct WebSocket connection to ElevenLabs"""
    
    # Load environment
    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    
    logger.info(f"🔑 API Key: {api_key[:10]}..." if api_key else "❌ No API key")
    logger.info(f"🎤 Voice ID: {voice_id}")
    
    try:
        # Try different URLs
        urls_to_test = [
            f"wss://api.elevenlabs.io/v1/speech-to-speech/stream/{voice_id}",
            f"wss://api.elevenlabs.io/v1/speech-to-speech/{voice_id}/stream",
            f"wss://api.elevenlabs.io/v1/stream/{voice_id}",
        ]
        
        for i, url in enumerate(urls_to_test, 1):
            logger.info(f"\n🧪 Test {i}: {url}")
            
            try:
                async with websockets.connect(
                    url,
                    extra_headers={"xi-api-key": api_key}
                ) as websocket:
                    logger.info(f"✅ Successfully connected to: {url}")
                    
                    # Send test config
                    config = {
                        "model_id": "eleven_multilingual_sts_v2",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75
                        }
                    }
                    
                    logger.info(f"📤 Sending config: {config}")
                    await websocket.send(json.dumps(config))
                    
                    # Wait for response
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        logger.info(f"📥 Received response: {response}")
                        return True
                    except asyncio.TimeoutError:
                        logger.warning("⏰ No response received")
                        
            except Exception as e:
                logger.error(f"❌ Failed to connect to {url}: {e}")
                
        logger.error("❌ All URLs failed")
        return False
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        return False

async def test_elevenlabs_rest_api():
    """Test REST API to verify key validity"""
    
    import requests
    
    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    try:
        # Test voices endpoint
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {"xi-api-key": api_key}
        
        logger.info(f"🧪 Testing REST API: {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            voices = response.json()
            logger.info(f"✅ REST API works! Found {len(voices.get('voices', []))} voices")
            return True
        else:
            logger.error(f"❌ REST API failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ REST API test failed: {e}")
        return False

async def main():
    """Run all tests"""
    
    logger.info("🧪 Testing ElevenLabs connectivity...")
    
    # Test 1: REST API
    logger.info("\n=== Test 1: REST API ===")
    rest_works = await test_elevenlabs_rest_api()
    
    # Test 2: WebSocket
    logger.info("\n=== Test 2: WebSocket API ===")
    ws_works = await test_elevenlabs_websocket_direct()
    
    # Summary
    logger.info("\n=== Summary ===")
    logger.info(f"REST API: {'✅ Works' if rest_works else '❌ Failed'}")
    logger.info(f"WebSocket API: {'✅ Works' if ws_works else '❌ Failed'}")
    
    if rest_works and not ws_works:
        logger.info("💡 API key is valid, but WebSocket API might require special access")
    elif not rest_works:
        logger.info("💡 API key might be invalid or expired")

if __name__ == "__main__":
    asyncio.run(main())
