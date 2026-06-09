"""
ChainWatch Pro — Minimal reference backend (FastAPI)
Run with: uvicorn app:app --reload
This powers the demo SDKs and can be the starting point for your real SaaS API.
"""
from __future__ import annotations
import hashlib
import random
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel

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

# --- Helpers (same deterministic feel as the frontend) ---
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
    # In real life: auth, rate limit per key, cache, call indexers + risk engine here
    return _scan_demo(req)

@app.get("/v1/vaults")
def vaults(limit: int = 10, key: str = Depends(get_api_key)):
    return {"results": [v.model_dump() for v in VAULTS[:limit]], "total_tvl": "$51.5B"}

@app.get("/v1/alerts")
def alerts(key: str = Depends(get_api_key)):
    # You would normally filter by user subscriptions / watched wallets
    return {"feed": [a.model_dump() for a in ALERTS]}

# Example of a protected "who am I"
@app.get("/v1/me")
def me(key: str = Depends(get_api_key)):
    return {"api_key_prefix": key[:12] + "...", "tier": "demo_or_paid", "rate_limit": "120/min"}

# --- Stripe stub (for the web checkout modal) ---
class CreatePaymentIntentReq(BaseModel):
    amount: int  # cents
    currency: str = "usd"

@app.post("/v1/create-payment-intent")
def create_payment_intent(req: CreatePaymentIntentReq, key: str = Depends(get_api_key)):
    # In production: use stripe.PaymentIntent.create( amount=req.amount, currency=req.currency, ... )
    # Return the client_secret so the browser can confirm the payment with Stripe.js
    fake_secret = f"pi_demo_{int(random.random()*1e10)}_secret_demo"
    return {
        "client_secret": fake_secret,
        "amount": req.amount,
        "currency": req.currency,
        "note": "This is a demo secret. Replace with real Stripe integration using your secret key on the server only."
    }
