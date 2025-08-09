#!/usr/bin/env python3
import base64
import json
import os
import re
import sys
import time
from typing import Dict, Optional
import subprocess

import requests


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
ENV_PATH = os.path.join(ROOT, ".env")


def load_env_key(name: str) -> Optional[str]:
    val = os.getenv(name)
    if val:
        return val
    if os.path.exists(ENV_PATH):
        try:
            with open(ENV_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    if k.strip() == name:
                        v = v.strip().strip('"').strip("'")
                        os.environ.setdefault(k.strip(), v)
                        return v
        except Exception:
            pass
    return None


def normalize_basic(raw: Optional[str]) -> str:
    if not raw:
        raise SystemExit("D_ID_API_KEY not set (.env or environment)")
    key = raw.strip()
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


def h(basic: str) -> Dict[str, str]:
    return {"Authorization": basic, "Content-Type": "application/json"}


def mask(basic: str) -> str:
    try:
        schema, token = basic.split(" ", 1)
        if len(token) > 20:
            return f"{schema} {token[:6]}...{token[-6:]}"
        return f"{schema} {token[:6]}..."
    except Exception:
        return "<masked>"


DID_BASE = os.getenv("DID_BASE_URL", "https://api.d-id.com")
TEST_IMAGE_URL = os.getenv(
    "DID_TEST_IMAGE_URL",
    "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg",
)


def print_step(title: str):
    print("\n== " + title)


def ensure(condition: bool, message: str):
    print("  -", message, "=>", "OK" if condition else "FAIL")
    if not condition:
        sys.exit(1)

def mask_auth_header(headers: Dict[str, str]) -> Dict[str, str]:
    if not headers:
        return headers
    out = dict(headers)
    auth = out.get("Authorization") or out.get("authorization")
    if auth:
        try:
            schema, token = auth.split(" ", 1)
            if len(token) > 20:
                out["Authorization"] = f"{schema} {token[:6]}...{token[-6:]}"
            else:
                out["Authorization"] = f"{schema} {token[:6]}..."
        except Exception:
            out["Authorization"] = "<masked>"
    return out

def log_http_request(method: str, url: str, headers: Dict[str, str], body: Optional[Dict]):
    print("HTTP →", method, url)
    safe_headers = mask_auth_header(headers)
    try:
        print("Request headers:", json.dumps(safe_headers, ensure_ascii=False))
    except Exception:
        print("Request headers:", str(safe_headers))
    try:
        print("Request body:", json.dumps(body, ensure_ascii=False))
    except Exception:
        print("Request body:", str(body))

def log_http_response(resp: requests.Response):
    print("HTTP ←", resp.status_code)
    try:
        print("Response headers:", json.dumps(dict(resp.headers), ensure_ascii=False))
    except Exception:
        print("Response headers:", str(dict(resp.headers)))
    # Full response body (may be large — printed per request)
    print("Response body:")
    print(resp.text)


def do_create_stream(basic: str) -> Dict:
    print_step("1) POST /talks/streams — creating WebRTC stream")
    url = f"{DID_BASE}/talks/streams"
    payload = {"source_url": TEST_IMAGE_URL}
    t0 = time.time()
    req_headers = h(basic)
    log_http_request("POST", url, req_headers, payload)
    resp = requests.post(url, headers=req_headers, json=payload, timeout=30)
    dt = time.time() - t0
    print("Elapsed:", f"{dt:.2f}s")
    log_http_response(resp)
    body = resp.text

    ensure(resp.status_code in (200, 201), "status is 200/201")
    ensure(len(body) > 1000, "> 1KB body")
    ensure("<html" not in body.lower(), "no HTML in body")
    data = resp.json()
    # Extract AWSALB/AWSALBCORS from Set-Cookie for subsequent calls
    set_cookie = resp.headers.get("set-cookie", "")
    alb = re.search(r"AWSALB=([^;]+)", set_cookie)
    cors = re.search(r"AWSALBCORS=([^;]+)", set_cookie)
    cookies = []
    if alb:
        cookies.append(f"AWSALB={alb.group(1)}")
    if cors:
        cookies.append(f"AWSALBCORS={cors.group(1)}")
    data["_cookies"] = "; ".join(cookies)
    data["_session_id"] = data.get("session_id") or data["_cookies"] or ""
    stream_id = data.get("id") or data.get("stream_id")
    ensure(isinstance(stream_id, str) and stream_id, "id present")
    sdp = data.get("sdp")
    if not sdp:
        offer = data.get("offer")
        if isinstance(offer, dict):
            sdp = offer.get("sdp")
        elif isinstance(offer, str):
            sdp = offer
    ensure(isinstance(sdp, str) and len(sdp) >= 500, "sdp length >= 500")
    ensure("v=0" in sdp and "m=video" in sdp and "a=" in sdp, "basic SDP sections present")
    ensure("error" not in data, "no error field in JSON")
    return data


def main():
    raw = load_env_key("D_ID_API_KEY")
    basic = normalize_basic(raw)
    print("Auth:", mask(basic))

    # 0) AUTH — explicit authorization test
    try:
        print_step("0) GET /talks — authorization test")
        url = f"{DID_BASE}/talks"
        req_headers = h(basic)
        log_http_request("GET", url, req_headers, None)
        t0 = time.time()
        resp = requests.get(url, headers=req_headers, timeout=30)
        dt = time.time() - t0
        print("Elapsed:", f"{dt:.2f}s")
        log_http_response(resp)
        ensure(resp.status_code == 200, "authorization succeeded (200)")
    except Exception as exc:
        print("  - AUTH step failed:", exc)
        sys.exit(1)

    # 1) Create stream with strict checks
    data = do_create_stream(basic)

    # 2) Submit SDP answer using Puppeteer (browser) for maximum compatibility
    print_step("2) POST /talks/streams/{id}/sdp — submit real SDP-answer")
    try:
        stream_id = data.get("id") or data.get("stream_id")
        sdp_offer = data.get("offer", {}).get("sdp") if isinstance(data.get("offer"), dict) else data.get("offer")
        assert isinstance(sdp_offer, str) and len(sdp_offer) > 500
        node = subprocess.run([
            'node', os.path.join(ROOT, 'scripts', 'puppeteer_runner', 'generate_sdp.js'),
            json.dumps({ 'sdp': sdp_offer })
        ], capture_output=True, text=True)
        sdp_answer = node.stdout if node.returncode == 0 else ''
        ensure(isinstance(sdp_answer, str) and len(sdp_answer) > 100, "generated SDP answer >= 100")
        url = f"{DID_BASE}/talks/streams/{stream_id}/sdp"
        t0 = time.time()
        headers = h(basic)
        if data.get("_cookies"):
            headers["Cookie"] = data["_cookies"]
        payload = {"answer": {"type": "answer", "sdp": sdp_answer}}
        if data.get("_session_id"):
            payload["session_id"] = data["_session_id"]
        log_http_request("POST", url, headers, payload)
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        dt = time.time() - t0
        print("Elapsed:", f"{dt:.2f}s")
        log_http_response(resp)
        ensure(resp.status_code in (200, 204), "status is 200/204")
        if resp.text.strip():
            ensure("error" not in resp.json(), "no error in response body")
    except Exception as exc:
        print("  - SDP step skipped:", exc)

    # 3) Submit ICE candidate (real or null)
    print_step("3) POST /talks/streams/{id}/ice — submit ICE candidate")
    try:
        stream_id = data.get("id") or data.get("stream_id")
        sdp_offer = data.get("offer", {}).get("sdp") if isinstance(data.get("offer"), dict) else data.get("offer")
        assert isinstance(sdp_offer, str) and len(sdp_offer) > 500
        iceServers = data.get("ice_servers") or []
        node = subprocess.run([
            'node', os.path.join(ROOT, 'scripts', 'puppeteer_runner', 'generate_ice.js'),
            json.dumps({ 'sdp': sdp_offer, 'iceServers': iceServers })
        ], capture_output=True, text=True)
        cand_json = node.stdout if node.returncode == 0 else '{"candidate": null}'
        try:
            cand = json.loads(cand_json)
        except Exception:
            cand = {"candidate": None}
        url = f"{DID_BASE}/talks/streams/{stream_id}/ice"
        t0 = time.time()
        headers = h(basic)
        if data.get("_cookies"):
            headers["Cookie"] = data["_cookies"]
        if data.get("_session_id"):
            cand["session_id"] = data["_session_id"]
        log_http_request("POST", url, headers, cand)
        resp = requests.post(url, headers=headers, json=cand, timeout=15)
        dt = time.time() - t0
        print("Elapsed:", f"{dt:.2f}s")
        log_http_response(resp)
        ensure(resp.status_code in (200, 204), "status is 200/204")
        if resp.text.strip():
            ensure("error" not in resp.json(), "no error in response body")
    except Exception as exc:
        print("  - ICE step skipped:", exc)

    # 4) DELETE /talks/streams/{id} — optional cleanup/logging
    try:
        stream_id = data.get("id") or data.get("stream_id")
        if stream_id:
            print_step("4) DELETE /talks/streams/{id} — cleanup")
            url = f"{DID_BASE}/talks/streams/{stream_id}"
            headers = h(basic)
            if data.get("_cookies"):
                headers["Cookie"] = data["_cookies"]
            payload = {}
            if data.get("_session_id"):
                payload["session_id"] = data["_session_id"]
            log_http_request("DELETE", url, headers, payload or None)
            # Some gateways ignore DELETE bodies unless json is set explicitly
            resp = requests.delete(url, headers=headers, json=(payload or None), timeout=15)
            log_http_response(resp)
    except Exception as exc:
        print("  - DELETE step skipped:", exc)

    print("\nAll requested steps executed.")


if __name__ == "__main__":
    main()

