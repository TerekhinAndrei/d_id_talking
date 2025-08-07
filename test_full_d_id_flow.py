#!/usr/bin/env python3
"""
Full D-ID API Flow Test
Tests the complete D-ID streaming flow from start to finish
"""

import asyncio
import json
import logging
from typing import Dict, Any
import aiohttp
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DIdFlowTester:
    def __init__(self):
        self.base_url = "https://api.d-id.com"
        self.api_key = os.getenv("D_ID_API_KEY")
        self.base_headers = {
            "Authorization": f"Basic {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Store session data
        self.stream_id = None
        self.session_id = None
        self.offer = None
        self.ice_servers = None
    
    def get_headers_with_session(self):
        """Get headers with session_id if available"""
        headers = self.base_headers.copy()
        if self.session_id:
            headers["X-Session-ID"] = self.session_id
        return headers
        
    async def step1_create_stream(self) -> bool:
        """Step 1: Create a new stream"""
        try:
            logger.info("=== STEP 1: Creating stream ===")
            
            # Use a test image URL
            source_url = "https://res.cloudinary.com/daeoqig4w/image/upload/v1754601773/ced034aa-4c77-4d02-a762-fb16bcb25d75.jpg"
            
            url = f"{self.base_url}/talks/streams"
            payload = {
                "source_url": source_url
            }
            
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.base_headers, json=payload) as response:
                    logger.info(f"Response status: {response.status}")
                    logger.info(f"Response headers: {dict(response.headers)}")
                    
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return False
                    
                    data = await response.json()
                    logger.info(f"Success response: {data}")
                    
                    # Store session data
                    self.stream_id = data.get("id")
                    session_id_raw = data.get("session_id")
                    
                    # Use the full session_id as provided by D-ID
                    self.session_id = session_id_raw
                    
                    self.offer = data.get("offer")
                    self.ice_servers = data.get("ice_servers", [])
                    
                    logger.info(f"✅ Stream created successfully!")
                    logger.info(f"   Stream ID: {self.stream_id}")
                    logger.info(f"   Session ID: {self.session_id}")
                    if self.offer:
                        if isinstance(self.offer, dict):
                            offer_sdp = self.offer.get('sdp', '')
                            logger.info(f"   Offer: {offer_sdp[:100]}..." if offer_sdp else "No SDP")
                        else:
                            logger.info(f"   Offer: {str(self.offer)[:100]}...")
                    else:
                        logger.info("   Offer: No offer")
                    logger.info(f"   ICE Servers: {len(self.ice_servers)} servers")
                    
                    return True
                    
        except Exception as e:
            logger.error(f"Error in Step 1: {e}")
            return False
    
    async def step2_start_webrtc_connection(self) -> bool:
        """Step 2: Start WebRTC connection with SDP answer"""
        try:
            logger.info("=== STEP 2: Starting WebRTC connection ===")
            
            if not self.stream_id or not self.session_id:
                logger.error("Missing stream_id or session_id from Step 1")
                return False
            
            # Create a simple SDP answer (this is a mock - in real app you'd use WebRTC)
            sdp_answer = {
                "type": "answer",
                "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=ice-options:trickle\r\na=fingerprint:sha-256 test\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"
            }
            
            url = f"{self.base_url}/talks/streams/{self.stream_id}/sdp"
            payload = {
                "answer": sdp_answer,
                "session_id": self.session_id
            }
            
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.get_headers_with_session(), json=payload) as response:
                    logger.info(f"Response status: {response.status}")
                    
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return False
                    
                    data = await response.json()
                    logger.info(f"Success response: {data}")
                    
                    # Update session_id if provided in response
                    if data.get("session_id"):
                        self.session_id = data.get("session_id")
                        logger.info(f"Updated session_id: {self.session_id[:50]}...")
                    
                    logger.info("✅ WebRTC connection started successfully!")
                    return True
                    
        except Exception as e:
            logger.error(f"Error in Step 2: {e}")
            return False
    
    async def step3_submit_ice_candidate(self) -> bool:
        """Step 3: Submit ICE candidate"""
        try:
            logger.info("=== STEP 3: Submitting ICE candidate ===")
            
            if not self.stream_id or not self.session_id:
                logger.error("Missing stream_id or session_id from Step 1")
                return False
            
            # Create a mock ICE candidate
            candidate = "candidate:1 1 udp 2015363327 34.211.231.128 56452 typ host"
            sdp_mid = "0"
            sdp_m_line_index = 0
            
            url = f"{self.base_url}/talks/streams/{self.stream_id}/ice"
            payload = {
                "candidate": candidate,
                "sdpMid": sdp_mid,
                "sdpMLineIndex": sdp_m_line_index,
                "session_id": self.session_id
            }
            
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.get_headers_with_session(), json=payload) as response:
                    logger.info(f"Response status: {response.status}")
                    
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return False
                    
                    data = await response.json()
                    logger.info(f"Success response: {data}")
                    
                    # Update session_id if provided in response
                    if data.get("session_id"):
                        self.session_id = data.get("session_id")
                        logger.info(f"Updated session_id: {self.session_id[:50]}...")
                    
                    logger.info("✅ ICE candidate submitted successfully!")
                    return True
                    
        except Exception as e:
            logger.error(f"Error in Step 3: {e}")
            return False
    
    async def step4_create_talk_stream(self) -> bool:
        """Step 4: Create talk stream"""
        try:
            logger.info("=== STEP 4: Creating talk stream ===")
            
            if not self.stream_id or not self.session_id:
                logger.error("Missing stream_id or session_id from Step 1")
                return False
            
            # Create a simple audio script
            script = {
                "type": "audio",
                "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
            }
            
            url = f"{self.base_url}/talks/streams/{self.stream_id}"
            payload = {
                "script": script,
                "session_id": self.session_id
            }
            
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.get_headers_with_session(), json=payload) as response:
                    logger.info(f"Response status: {response.status}")
                    
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return False
                    
                    data = await response.json()
                    logger.info(f"Success response: {data}")
                    
                    logger.info("✅ Talk stream created successfully!")
                    return True
                    
        except Exception as e:
            logger.error(f"Error in Step 4: {e}")
            return False
    
    async def step5_close_stream(self) -> bool:
        """Step 5: Close stream"""
        try:
            logger.info("=== STEP 5: Closing stream ===")
            
            if not self.stream_id or not self.session_id:
                logger.error("Missing stream_id or session_id from Step 1")
                return False
            
            url = f"{self.base_url}/talks/streams/{self.stream_id}"
            payload = {
                "session_id": self.session_id
            }
            
            logger.info(f"Request URL: {url}")
            logger.info(f"Request payload: {payload}")
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=self.get_headers_with_session(), json=payload) as response:
                    logger.info(f"Response status: {response.status}")
                    
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return False
                    
                    data = await response.json()
                    logger.info(f"Success response: {data}")
                    
                    logger.info("✅ Stream closed successfully!")
                    return True
                    
        except Exception as e:
            logger.error(f"Error in Step 5: {e}")
            return False
    
    async def run_full_flow(self):
        """Run the complete D-ID API flow"""
        logger.info("🚀 Starting full D-ID API flow test...")
        
        # Step 1: Create stream
        if not await self.step1_create_stream():
            logger.error("❌ Step 1 failed - stopping test")
            return False
        
        # Step 2: Start WebRTC connection
        if not await self.step2_start_webrtc_connection():
            logger.error("❌ Step 2 failed - stopping test")
            return False
        
        # Step 3: Submit ICE candidate
        if not await self.step3_submit_ice_candidate():
            logger.error("❌ Step 3 failed - stopping test")
            return False
        
        # Step 4: Create talk stream
        if not await self.step4_create_talk_stream():
            logger.error("❌ Step 4 failed - stopping test")
            return False
        
        # Step 5: Close stream
        if not await self.step5_close_stream():
            logger.error("❌ Step 5 failed")
            return False
        
        logger.info("🎉 All steps completed successfully!")
        return True

async def main():
    """Main test function"""
    tester = DIdFlowTester()
    success = await tester.run_full_flow()
    
    if success:
        logger.info("✅ Full D-ID API flow test PASSED")
    else:
        logger.error("❌ Full D-ID API flow test FAILED")

if __name__ == "__main__":
    asyncio.run(main())
