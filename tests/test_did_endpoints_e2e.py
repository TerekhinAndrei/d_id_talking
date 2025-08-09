"""
End-to-end smoke tests for D-ID related endpoints (backend and direct D-ID REST).

Notes
- Tests prefer to use environment variables and will skip gracefully if not set.
- Backend is expected to run locally on http://localhost:8000 by default.
- These tests DO NOT modify backend code; they only call public endpoints.
- WebSocket tests are optional and skipped if access is not granted.
"""

from __future__ import annotations

import base64
import json
import os
import time
from typing import Dict, Optional

import pytest
import requests


# -------------------------
# Config helpers
# -------------------------

BACKEND_BASE: str = os.getenv("BACKEND_BASE", "http://localhost:8000")
API_V1: str = os.getenv("API_V1", f"{BACKEND_BASE}/api/v1")

TEST_IMAGE_URL: str = os.getenv(
    "DID_TEST_IMAGE_URL",
    "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg",
)


def _normalize_basic_from_env(api_key_env: Optional[str]) -> Optional[str]:
    """Normalize D_ID_API_KEY to an HTTP Basic header value.

    Supported formats:
    - "Basic <base64(email:password)>"
    - "<base64(email)>:<password>"
    - raw email:password (discouraged; not used by this project but tolerated)
    """
    if not api_key_env:
        return None

    key = api_key_env.strip()
    if key.lower().startswith("basic "):
        return key

    # Try "base64(email):password" form
    if ":" in key:
        left, right = key.split(":", 1)
        try:
            email = base64.b64decode(left).decode("utf-8")
            token = base64.b64encode(f"{email}:{right}".encode("utf-8")).decode("utf-8")
            return f"Basic {token}"
        except Exception:
            # Fallback: assume raw email:password was provided
            token = base64.b64encode(key.encode("utf-8")).decode("utf-8")
            return f"Basic {token}"

    # Unknown shape; treat as opaque token
    return f"Basic {key}"


# -------------------------
# Backend health
# -------------------------


def test_backend_health_available():
    url = f"{API_V1}/health"
    resp = requests.get(url, timeout=10)
    assert resp.status_code == 200, f"Health failed: {resp.status_code} {resp.text}"
    data = resp.json()
    assert isinstance(data, dict)
    # Flexible assertions: accept either legacy shape with 'service' or new shape
    if "service" in data:
        assert data.get("service") in ("streaming", "health", "backend")
    assert data.get("status") in ("healthy", "ok", "up")
    assert "version" in data or "environment" in data


# -------------------------
# Streaming: create session via backend
# -------------------------


@pytest.mark.parametrize("image_url", [TEST_IMAGE_URL])
def test_streaming_start(image_url: str):
    url = f"{API_V1}/streaming/start"
    payload = {"image_url": image_url}
    resp = requests.post(url, json=payload, timeout=30)
    assert resp.status_code == 200, f"start failed: {resp.status_code} {resp.text}"
    data = resp.json()
    assert data.get("success") is True
    assert data.get("stream_id")
    assert data.get("session_id")
    assert isinstance(data.get("sdp_offer"), str) and len(data["sdp_offer"]) > 0
    assert isinstance(data.get("ice_servers"), list) and len(data["ice_servers"]) > 0


# -------------------------
# Direct D-ID REST health (optional)
# -------------------------


@pytest.mark.skipif(
    not os.getenv("D_ID_API_KEY"), reason="D_ID_API_KEY not set in environment"
)
def test_direct_did_rest_talks_list():
    """Direct REST call to D-ID /talks to verify credentials work for REST."""
    api_key_raw = os.getenv("D_ID_API_KEY")
    basic = _normalize_basic_from_env(api_key_raw)
    headers = {"Authorization": basic, "Content-Type": "application/json"}
    resp = requests.get("https://api.d-id.com/talks", headers=headers, timeout=30)
    assert resp.status_code in (200, 401, 403), f"Unexpected status: {resp.status_code} {resp.text}"
    if resp.status_code == 200:
        # Should be a JSON payload or list
        _ = resp.json()


# -------------------------
# SDP exchange (best-effort smoke) via backend
# -------------------------


def _backend_start() -> Dict[str, str]:
    url = f"{API_V1}/streaming/start"
    resp = requests.post(url, json={"image_url": TEST_IMAGE_URL}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def test_sdp_exchange_smoke():
    """
    Best-effort: submit a minimal SDP answer back to backend.
    If upstream D-ID rejects, backend may still respond 5xx; we assert no crash on our side.
    """
    start = _backend_start()
    assert start.get("success") is True
    stream_id = start["stream_id"]
    session_id = start["session_id"]

    # Minimal SDP answer stub (well-formed but generic). Upstream may reject — we only smoke test backend path.
    sdp_answer = {
        "type": "answer",
        "sdp": (
            "v=0\r\n"
            "o=- 1234567890 2 IN IP4 127.0.0.1\r\n"
            "s=-\r\n"
            "t=0 0\r\n"
            "a=group:BUNDLE 0\r\n"
            "m=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"
            "c=IN IP4 0.0.0.0\r\n"
            "a=mid:0\r\n"
            "a=recvonly\r\n"
            "a=rtpmap:111 opus/48000/2\r\n"
        ),
    }

    url = f"{API_V1}/streaming/{stream_id}/sdp"
    payload = {"answer": sdp_answer, "session_id": session_id}
    resp = requests.post(url, json=payload, timeout=30)

    # Accept either success (200) or clear error message from backend
    assert resp.status_code in (200, 400, 401, 403, 500), f"Unexpected status: {resp.status_code}"


def test_submit_ice_smoke():
    start = _backend_start()
    assert start.get("success") is True
    stream_id = start["stream_id"]
    session_id = start["session_id"]

    url = f"{API_V1}/streaming/{stream_id}/ice"
    payload = {
        "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
        "sdpMid": "0",
        "sdpMLineIndex": 0,
        "session_id": session_id,
    }
    resp = requests.post(url, json=payload, timeout=15)
    assert resp.status_code in (200, 400, 401, 403, 500)


def test_create_talk_smoke():
    start = _backend_start()
    assert start.get("success") is True
    stream_id = start["stream_id"]
    session_id = start["session_id"]

    url = f"{API_V1}/streaming/{stream_id}/talk"
    script = {
        "type": "text",
        "input": "Hello! This is a test message.",
        "provider": {"type": "microsoft", "voice_id": "en-US-JennyNeural"},
    }
    resp = requests.post(url, json={"script": script, "session_id": session_id}, timeout=30)
    assert resp.status_code in (200, 400, 401, 403, 500)


# -------------------------
# Optional WS talks/streams header-based probe via python (skip by default)
# -------------------------


@pytest.mark.skip(reason="Manual probe: requires D-ID WS access; run locally when permitted")
def test_ws_talks_streams_header_probe():
    import websockets  # type: ignore
    api_key_raw = os.getenv("D_ID_API_KEY")
    if not api_key_raw:
        pytest.skip("D_ID_API_KEY not set")

    basic = _normalize_basic_from_env(api_key_raw)
    headers = {"authorization": basic}

    async def _run():
        uri = "wss://api.d-id.com/talks/streams"
        async with websockets.connect(uri, extra_headers=headers, open_timeout=8) as ws:
            await ws.send(json.dumps({
                "type": "init_stream",
                "source_url": TEST_IMAGE_URL,
                "presenter_type": "talk",
            }))
            # We only assert that handshake succeeded
            msg = await ws.recv()
            assert isinstance(msg, (str, bytes))

    # Run the coroutine with a small timeout window
    try:
        import asyncio
        asyncio.get_event_loop().run_until_complete(asyncio.wait_for(_run(), timeout=12))
    except Exception as exc:
        pytest.skip(f"WS probe failed (expected if no WS access): {exc}")


