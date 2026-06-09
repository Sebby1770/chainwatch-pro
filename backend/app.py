"""
ChainWatch Pro — Minimal reference backend (FastAPI)
Run with: uvicorn app:app --reload
This powers the demo SDKs and can be the starting point for your real SaaS API.
"""
from __future__ import annotations
import hashlib
import hmac
import json
import os
import random
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from collections import defaultdict
import time as time_module

app = FastAPI(title="ChainWatch Pro API", version="0.2.0")

# --- Demo API key auth (very basic) ---
DEMO_KEYS = {"cw_live_demo_only_replace_me", "demo"}

def get_api_key(x_api_key: str | None = Header(default=None), authorization: str | None = Header(default=None)):
    key = None
    if authorization and authorization.lower().startswith("bearer "):
        key = authorization.split(" ", 1)[1].strip()
    elif x_api_key:
        key = x_api_key
    if not key or key not in DEMO_KEYS and not key.startswith("cw_live_"):
        # In real life: validate against DB + rate limit
        raise HTTPException(401, "Invalid or missing API key")
    return key

# --- Models ---
class ScanRequest(BaseModel):
    address: str
    chain: Literal["ethereum", "base", "arbitrum", "polygon", "solana"] = "base"
    risk_mode: Literal["conservative", "balanced", "aggressive"] = "balanced"

class ScanResponse(BaseModel):
    wallet: str
    chain: str
    risk_score: int
    health: int
    value_usd: float
    positions: int
    gas: str
    allocation: dict[str, float]
    ts: str

class Vault(BaseModel):
    name: str
    chain: str
    apy: float
    risk: int
    capacity: str
    revenue: str

class Alert(BaseModel):
    title: str
    detail: str
    severity: str
    ts: str

# --- Helpers ---
def _hash(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % 1000003

def _scan_demo(req: ScanRequest) -> ScanResponse:
    h = _hash(req.address + req.chain + req.risk_mode)
    base = {"ethereum": 34, "base": 24, "arbitrum": 29, "polygon": 31, "solana": 38}[req.chain]
    delta = {"aggressive": 9, "conservative": -7}.get(req.risk_mode, 0)
    risk = max(12, min(94, base + delta + (h % 43) - 13))
    health = max(8, min(99, 105 - risk + (h % 9) - 4))
    value = 18000 + (h % 420000)
    pos = 5 + (h % 18)
    gas = {"ethereum": "$7.42", "solana": "$0.01", "base": "$0.31", "arbitrum": "$0.18", "polygon": "$0.04"}[req.chain]
    alloc = {
        "Keep": max(18, min(72, 100 - risk)),
        "Hedge": max(14, min(42, risk // 2)),
        "Review": max(9, min(30, risk // 3)),
    }
    return ScanResponse(
        wallet=req.address,
        chain=req.chain,
        risk_score=risk,
        health=health,
        value_usd=value,
        positions=pos,
        gas=gas,
        allocation=alloc,
        ts=datetime.utcnow().isoformat() + "Z",
    )

VAULTS = [
    Vault(name="Stablecoin Delta Vault", chain="Base", apy=8.4, risk=22, capacity="$8.1M", revenue="$129/mo pro signal"),
    Vault(name="LST Loop Monitor", chain="Ethereum", apy=6.9, risk=31, capacity="$24.8M", revenue="$349/mo desk plan"),
    Vault(name="Perps Funding Sweep", chain="Arbitrum", apy=14.7, risk=57, capacity="$3.7M", revenue="2 percent success fee"),
    Vault(name="Treasury Rebalance Bot", chain="Solana", apy=10.2, risk=44, capacity="$5.9M", revenue="$799/mo enterprise"),
]

ALERTS = [
    Alert(title="Contract privilege changed", detail="Base vault admin role moved", severity="watch", ts="3m ago"),
    Alert(title="Gas window opening", detail="Efficient execution batch rated", severity="healthy", ts="9m ago"),
    Alert(title="Liquidity concentration", detail="Correlated stablecoin exposure", severity="healthy", ts="14m ago"),
]

# --- Routes ---
@app.get("/health")
def health():
    return {"status": "ok", "service": "chainwatch-pro-api", "version": "0.2.0"}

@app.post("/v1/scan", response_model=ScanResponse)
def scan(req: ScanRequest, key: str = Depends(get_api_key)):
    return _scan_demo(req)

@app.get("/v1/vaults")
def vaults(limit: int = 10, key: str = Depends(get_api_key)):
    return {"results": [v.model_dump() for v in VAULTS[:limit]], "total_tvl": "$51.5B"}

@app.get("/v1/alerts")
def alerts(key: str = Depends(get_api_key)):
    return {"feed": [a.model_dump() for a in ALERTS]}

@app.get("/v1/me")
def me(key: str = Depends(get_api_key)):
    return {"api_key_prefix": key[:12] + "...", "tier": "demo_or_paid", "rate_limit": "120/min"}

# --- Stripe stub ---
class CreatePaymentIntentReq(BaseModel):
    amount: int
    currency: str = "usd"

@app.post("/v1/create-payment-intent")
def create_payment_intent(req: CreatePaymentIntentReq, key: str = Depends(get_api_key)):
    fake_secret = f"pi_demo_{int(random.random()*1e10)}_secret_demo"
    return {
        "client_secret": fake_secret,
        "amount": req.amount,
        "currency": req.currency,
        "note": "Demo. Use real Stripe secret server-side."
    }

# --- Webhook with signing ---
WEBHOOK_SECRET = os.getenv("CHAINWATCH_WEBHOOK_SECRET", "demo_webhook_secret_change_in_prod")

class WebhookTestReq(BaseModel):
    url: str
    event: str = "alert.fired"
    payload: dict = {"title": "Test whale movement", "severity": "watch", "wallet": "0x..."}

def sign_payload(payload: dict, secret: str) -> str:
    payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    signature = hmac.new(secret.encode("utf-8"), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"sha256={signature}"

@app.post("/v1/simulate-webhook")
def simulate_webhook(req: WebhookTestReq, key: str = Depends(get_api_key)):
    import time
    signed_payload = req.payload.copy()
    signature = sign_payload(signed_payload, WEBHOOK_SECRET)
    delivery = {
        "status": "delivered",
        "url": req.url,
        "event": req.event,
        "payload": signed_payload,
        "signature": signature,
        "timestamp": time.time(),
        "note": "Verify with X-Signature header."
    }
    print(f"[WEBHOOK] Simulated to {req.url}")
    return delivery

@app.post("/v1/webhook-receiver-demo")
async def webhook_receiver_demo(request: Request):
    body = await request.json()
    sig_header = request.headers.get("x-signature", "")
    expected = sign_payload(body, WEBHOOK_SECRET)
    valid = hmac.compare_digest(sig_header, expected)
    return {"received": True, "valid_signature": valid, "body": body}

def verify_webhook_signature(payload: dict, signature: str, secret: str = WEBHOOK_SECRET) -> bool:
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(signature, expected)

# --- Stripe Portal ---
class CreatePortalSessionReq(BaseModel):
    customer_id: str = "cus_demo_123"
    return_url: str = "https://yourapp.com/account"

@app.post("/v1/create-portal-session")
def create_portal_session(req: CreatePortalSessionReq, key: str = Depends(get_api_key)):
    portal_url = f"https://billing.stripe.com/p/session/demo_{req.customer_id}?return={req.return_url}"
    return {
        "url": portal_url,
        "note": "Production: use stripe.billing_portal.Session.create with secret key and real customer ID mapped from your users."
    }

# --- GraphQL demo ---
class GraphQLRequest(BaseModel):
    query: str
    variables: dict = {}

@app.post("/graphql")
def graphql_demo(req: GraphQLRequest, key: str = Depends(get_api_key)):
    q = req.query.lower().strip()
    if "scan" in q:
        res = _scan_demo(ScanRequest(address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", chain="base"))
        return {"data": {"scan": res.model_dump()}}
    if "vaults" in q:
        return {"data": {"vaults": [v.model_dump() for v in VAULTS[:5]]}}
    if "me" in q:
        return {"data": {"me": {"tier": "demo", "api_key_prefix": key[:12]}}}
    return {"data": None, "errors": [{"message": "Demo only. Try { scan { risk_score } } or vaults or me"}]}

# --- Rate limit stub (from previous) ---
RATE_LIMIT = 120
RATE_WINDOW = 60
_rate_buckets: dict = defaultdict(list)

def rate_limit(key: str = Depends(get_api_key)):
    now = time_module.time()
    bucket = _rate_buckets[key]
    _rate_buckets[key] = [t for t in bucket if now - t < RATE_WINDOW]
    if len(_rate_buckets[key]) >= RATE_LIMIT:
        raise HTTPException(429, "Rate limit exceeded")
    _rate_buckets[key].append(now)
    return key
