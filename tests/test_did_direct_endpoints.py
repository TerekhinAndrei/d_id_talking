"""
Direct REST tests against D-ID endpoints (no local backend).

Requirements
- Environment variable D_ID_API_KEY must be set. Supported formats:
  * "Basic <base64(email:password)>"
  * "<base64(email)>:<password>"

WARNING: These tests send live requests to D-ID. They are smoke tests and
assert on reasonable status codes rather than strict success, to avoid
flakiness due to account/plan constraints.
"""

from __future__ import annotations

import base64
import os
import re
from typing import Dict, Optional

import pytest
import requests


def _load_dotenv_var(key: str) -> Optional[str]:
    """Lazy .env loader without external deps. Only pulls the first occurrence of key."""
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        root = os.path.abspath(os.path.join(here, os.pardir))
        env_path = os.path.join(root, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    if k.strip() == key:
                        # Strip surrounding quotes if present
                        v = v.strip().strip('"').strip("'")
                        os.environ.setdefault(k.strip(), v)
                        return v
    except Exception:
        pass
    return None


# Try to auto-load from .env if not already provided by environment
_load_dotenv_var("D_ID_API_KEY")

DID_BASE = os.getenv("DID_BASE_URL", "https://api.d-id.com")
TEST_IMAGE_URL = os.getenv(
    "DID_TEST_IMAGE_URL",
    "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg",
)


def _normalize_basic(api_key_env: Optional[str]) -> Optional[str]:
    if not api_key_env:
        return None
    key = api_key_env.strip()
    if key.lower().startswith("basic "):
        return key
    if ":" in key:
        left, right = key.split(":", 1)
        try:
            email = base64.b64decode(left).decode("utf-8")
            token = base64.b64encode(f"{email}:{right}".encode("utf-8")).decode("utf-8")
            return f"Basic {token}"
        except Exception:
            token = base64.b64encode(key.encode("utf-8")).decode("utf-8")
            return f"Basic {token}"
    return f"Basic {key}"


def _headers(basic: str) -> Dict[str, str]:
    return {"Authorization": basic, "Content-Type": "application/json"}


def _mask_token(basic: Optional[str]) -> str:
    if not basic:
        return "<none>"
    # Don't leak secrets: keep only schema and 6+6 chars
    try:
        schema, token = basic.split(" ", 1)
        if len(token) > 20:
            return f"{schema} {token[:6]}...{token[-6:]}"
        return f"{schema} {token[:6]}..."
    except Exception:
        return "<masked>"


def _log_http_start(method: str, url: str, payload: Optional[dict]):
    body_keys = list(payload.keys()) if isinstance(payload, dict) else []
    print(f"HTTP → {method} {url} body_keys={body_keys}")


def _log_http_end(resp: requests.Response):
    snippet = resp.text
    if len(snippet) > 240:
        snippet = snippet[:240] + "..."
    print(f"HTTP ← {resp.status_code} {snippet}")


def _extract_alb_cookies(resp: requests.Response) -> str:
    # D-ID uses AWSALB/AWSALBCORS cookies for session pinning. They may come in Set-Cookie.
    set_cookie = resp.headers.get("set-cookie", "")
    alb = re.search(r"AWSALB=([^;]+)", set_cookie)
    cors = re.search(r"AWSALBCORS=([^;]+)", set_cookie)
    pairs = []
    if alb:
        pairs.append(f"AWSALB={alb.group(1)}")
    if cors:
        pairs.append(f"AWSALBCORS={cors.group(1)}")
    return "; ".join(pairs)


required = pytest.mark.skipif(not os.getenv("D_ID_API_KEY"), reason="D_ID_API_KEY not set")


@required
def test_did_talks_streams_create():
    basic = _normalize_basic(os.getenv("D_ID_API_KEY"))
    print(f"Auth: {_mask_token(basic)}")
    url = f"{DID_BASE}/talks/streams"
    payload = {"source_url": TEST_IMAGE_URL}
    _log_http_start("POST", url, payload)
    resp = requests.post(url, headers=_headers(basic), json=payload, timeout=30)
    _log_http_end(resp)
    assert resp.status_code in (200, 201, 400, 401, 403), f"Unexpected: {resp.status_code} {resp.text}"
    if resp.status_code == 200:
        data = resp.json()
        assert data.get("id")
        assert data.get("offer")
        assert isinstance(data.get("ice_servers"), list)


@required
def test_did_talks_streams_sdp_ice_talk_delete_smoke():
    basic = _normalize_basic(os.getenv("D_ID_API_KEY"))
    print(f"Auth: {_mask_token(basic)}")
    # 1) Create
    create_url = f"{DID_BASE}/talks/streams"
    payload = {"source_url": TEST_IMAGE_URL}
    _log_http_start("POST", create_url, payload)
    create = requests.post(create_url, headers=_headers(basic), json=payload, timeout=30)
    _log_http_end(create)
    assert create.status_code in (200, 201, 401, 403), f"create: {create.status_code} {create.text}"
    if create.status_code != 200:
        pytest.skip(f"Create not allowed: HTTP {create.status_code}")

    cookies = _extract_alb_cookies(create)
    print(f"Session cookies present: {bool(cookies)}")
    data = create.json()
    stream_id = data.get("id") or data.get("stream_id")
    assert stream_id, f"No stream id in response: {data}"

    common_headers = _headers(basic)
    if cookies:
        common_headers["Cookie"] = cookies

    # 2) SDP answer (stub) — upstream may reject but endpoint should be reachable
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
    sdp_url = f"{DID_BASE}/talks/streams/{stream_id}/sdp"
    _log_http_start("POST", sdp_url, {"answer": "<sdp-stub>"})
    sdp_resp = requests.post(sdp_url, headers=common_headers, json={"answer": sdp_answer}, timeout=30)
    _log_http_end(sdp_resp)
    assert sdp_resp.status_code in (200, 400, 401, 403, 500)

    # 3) ICE candidate (stub)
    ice_url = f"{DID_BASE}/talks/streams/{stream_id}/ice"
    ice_payload = {
        "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
        "sdpMid": "0",
        "sdpMLineIndex": 0,
    }
    _log_http_start("POST", ice_url, ice_payload)
    ice_resp = requests.post(ice_url, headers=common_headers, json=ice_payload, timeout=15)
    _log_http_end(ice_resp)
    assert ice_resp.status_code in (200, 400, 401, 403, 500)

    # 4) Create talk (text)
    talk_url = f"{DID_BASE}/talks/streams/{stream_id}/talk"
    script = {
        "type": "text",
        "input": "Hello from direct REST test.",
        "provider": {"type": "microsoft", "voice_id": "en-US-JennyNeural"},
    }
    _log_http_start("POST", talk_url, {"script": {"type": script["type"], "provider": script["provider"]}})
    talk_resp = requests.post(talk_url, headers=common_headers, json={"script": script}, timeout=30)
    _log_http_end(talk_resp)
    assert talk_resp.status_code in (200, 400, 401, 403, 500)

    # 5) Delete stream (best-effort)
    del_url = f"{DID_BASE}/talks/streams/{stream_id}"
    _log_http_start("DELETE", del_url, None)
    del_resp = requests.delete(del_url, headers=common_headers, timeout=15)
    _log_http_end(del_resp)
    assert del_resp.status_code in (200, 204, 400, 401, 403, 404, 500)


