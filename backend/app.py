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
from datetime import datetime, timedelta
from typing import Literal, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from collections import defaultdict
import time as time_module
from supabase import create_client, Client
import stripe

# Load env (for local)
from dotenv import load_dotenv
load_dotenv()

# Supabase client for backend persistence
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_yourkey")

# Webhook secret etc from before
WEBHOOK_SECRET = os.getenv("CHAINWATCH_WEBHOOK_SECRET", "demo_webhook_secret_change_in_prod")

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

# --- Simple in-memory rate limiter (per API key, 120 req/min) ---
RATE_LIMIT = 120
RATE_WINDOW = 60  # seconds
_rate_buckets: dict[str, list[float]] = defaultdict(list)

def rate_limit(key: str = Depends(get_api_key)):
    now = time_module.time()
    bucket = _rate_buckets[key]
    _rate_buckets[key] = [t for t in bucket if now - t < RATE_WINDOW]
    if len(_rate_buckets[key]) >= RATE_LIMIT:
        raise HTTPException(429, "Rate limit exceeded. Try again later.")
    _rate_buckets[key].append(now)
    return key

# --- Routes ---
@app.get("/health")
def health():
    return {"status": "ok", "service": "chainwatch-pro-api", "version": "0.2.0"}

@app.post("/v1/scan", response_model=ScanResponse)
def scan(req: ScanRequest, key: str = Depends(rate_limit)):
    # In real life: auth, rate limit per key, cache, call indexers + risk engine here
    return _scan_demo(req)

@app.get("/v1/vaults")
def vaults(limit: int = 10, key: str = Depends(rate_limit)):
    return {"results": [v.model_dump() for v in VAULTS[:limit]], "total_tvl": "$51.5B"}

@app.get("/v1/alerts")
def alerts(key: str = Depends(rate_limit)):
    # You would normally filter by user subscriptions / watched wallets
    return {"feed": [a.model_dump() for a in ALERTS]}

# Example of a protected "who am I"
@app.get("/v1/me")
def me(key: str = Depends(get_api_key)):
    return {"api_key_prefix": key[:12] + "...", "tier": "demo_or_paid", "rate_limit": "120/min"}

# Apply rate_limit to sensitive endpoints by adding it as dependency in addition to get_api_key
# For demo, we wrap a few key endpoints below by re-defining or note to use in prod.

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

# --- Webhook simulator with real signing (HMAC-SHA256) ---
WEBHOOK_SECRET = os.getenv("CHAINWATCH_WEBHOOK_SECRET", "demo_webhook_secret_change_in_prod")

class WebhookTestReq(BaseModel):
    url: str
    event: str = "alert.fired"
    payload: dict = {"title": "Test whale movement", "severity": "watch", "wallet": "0x..."}

def sign_payload(payload: dict, secret: str) -> str:
    """Generate HMAC signature for webhook payload."""
    payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    signature = hmac.new(
        secret.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

@app.post("/v1/simulate-webhook")
def simulate_webhook(req: WebhookTestReq, key: str = Depends(get_api_key)):
    """
    Demo endpoint that "delivers" an alert to the provided URL with signature.
    Production version should:
    - Use a per-user or per-endpoint secret
    - Actually POST with X-Signature header
    - Implement retries, dead letter, etc.
    """
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
        "note": "Verify with: X-Signature header. Use the same secret on receiver."
    }

    # In real code: requests.post(req.url, json=signed_payload, headers={"X-Signature": signature})
    print(f"[WEBHOOK] Simulated signed delivery to {req.url}: {req.event} sig={signature[:16]}...")
    return delivery

@app.post("/v1/webhook-receiver-demo")
async def webhook_receiver_demo(request: Request):
    """Example receiver endpoint for testing signatures locally."""
    body = await request.json()
    sig_header = request.headers.get("x-signature", "")
    expected = sign_payload(body, WEBHOOK_SECRET)
    valid = hmac.compare_digest(sig_header, expected)
    return {"received": True, "valid_signature": valid, "body": body}

def verify_webhook_signature(payload: dict, signature: str, secret: str = WEBHOOK_SECRET) -> bool:
    """Verify incoming webhook signature. Use in your receivers."""
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(signature, expected)

# --- Stripe Customer Portal (production flow stub) ---
class CreatePortalSessionReq(BaseModel):
    customer_id: str = "cus_demo_123"  # In real: from your user mapping to Stripe customer
    return_url: str = "https://yourapp.com/account"

@app.post("/v1/create-portal-session")
def create_portal_session(req: CreatePortalSessionReq, key: str = Depends(get_api_key)):
    """
    In production:
      import stripe
      session = stripe.billing_portal.Session.create(
          customer=req.customer_id,
          return_url=req.return_url,
      )
      return {"url": session.url}
    This returns a demo URL that simulates the Stripe hosted portal.
    """
    # Demo: would redirect to Stripe's portal for managing subscription, payment methods, invoices
    portal_url = f"https://billing.stripe.com/p/session/demo_{req.customer_id}?return={req.return_url}"
    return {
        "url": portal_url,
        "note": "Replace with real stripe.billing_portal.Session.create using your secret key and mapped customer ID. This is test-mode ready."
    }

# --- Simple GraphQL-like endpoint (demo, no extra deps) ---
# For real GraphQL, add strawberry-graphql and use its router.
# This is a minimal query interface for the core resources.
class GraphQLRequest(BaseModel):
    query: str
    variables: dict = {}

@app.post("/graphql")
def graphql_demo(req: GraphQLRequest, key: str = Depends(get_api_key)):
    """
    Demo GraphQL endpoint.
    Supported queries:
      - scan(address: "...", chain: "base")
      - vaults(limit: 5)
      - me
    Example: { "query": "query { scan(address: \"0x..\") { risk_score health } }" }
    """
    q = req.query.lower().strip()
    if "scan" in q:
        # Parse simple
        addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        ch = "base"
        # very naive parse for demo
        if "address:" in q:
            # extract rough
            pass
        res = _scan_demo(ScanRequest(address=addr, chain=ch))
        return {"data": {"scan": res.model_dump()}}
    if "vaults" in q:
        lim = 5
        return {"data": {"vaults": [v.model_dump() for v in VAULTS[:lim]]}}
    if "me" in q:
        return {"data": {"me": {"tier": "demo", "api_key_prefix": key[:12]}}}
    return {"data": None, "errors": [{"message": "Unsupported query in demo. Try scan, vaults, or me."}]}

# --- Supabase + Stripe real SaaS integration (added for functional billing) ---
def get_user_from_api_key(api_key: str) -> Optional[dict]:
    """Lookup user profile by API key prefix."""
    try:
        res = supabase.table("api_keys").select("user_id, profiles(*)").eq("key_prefix", api_key[:12]).execute()
        if res.data:
            user_id = res.data[0]["user_id"]
            profile = res.data[0].get("profiles") or {}
            return {"id": user_id, "email": profile.get("email"), "tier": profile.get("tier", "free")}
    except Exception as e:
        print("Supabase lookup error (demo ok):", e)
    return None

def record_usage(user_id: str, event: str = "scan"):
    try:
        supabase.table("usage").insert({
            "user_id": user_id, 
            "event": event, 
            "month": datetime.utcnow().strftime("%Y-%m")
        }).execute()
    except Exception as e:
        print("Usage record error (demo):", e)

class SubscribeReq(BaseModel):
    plan: str  # Scout, Operator, Desk
    payment_method_id: Optional[str] = None

@app.post("/v1/subscribe")
def subscribe(req: SubscribeReq, key: str = Depends(rate_limit)):
    user = get_user_from_api_key(key)
    if not user:
        # Fallback for demo without full Supabase
        return {"status": "demo_success", "plan": req.plan, "note": "Configure SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY for real."}

    try:
        if stripe.api_key and stripe.api_key.startswith("sk_test"):
            customer = stripe.Customer.create(
                email=user.get("email", "demo@example.com"),
                metadata={"user_id": user["id"]}
            )
            price_id = "price_demo_operator" if req.plan == "Operator" else "price_demo_scout"
            sub = stripe.Subscription.create(
                customer=customer.id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            supabase.table("subscriptions").upsert({
                "user_id": user["id"],
                "plan": req.plan,
                "status": sub.status,
                "stripe_subscription_id": sub.id,
                "current_period_end": datetime.fromtimestamp(sub.current_period_end).isoformat()
            }).execute()
            supabase.table("profiles").update({"tier": req.plan}).eq("id", user["id"]).execute()
            return {"status": "success", "subscription_id": sub.id}
        else:
            supabase.table("subscriptions").upsert({
                "user_id": user["id"],
                "plan": req.plan,
                "status": "active",
                "current_period_end": (datetime.utcnow() + timedelta(days=30)).isoformat()
            }).execute()
            supabase.table("profiles").update({"tier": req.plan}).eq("id", user["id"]).execute()
            return {"status": "mock_success", "plan": req.plan}
    except Exception as e:
        raise HTTPException(400, f"Subscription failed: {str(e)}")

@app.post("/v1/cancel-subscription")
def cancel_subscription(key: str = Depends(rate_limit)):
    user = get_user_from_api_key(key)
    if not user:
        return {"status": "demo_canceled"}
    try:
        res = supabase.table("subscriptions").select("*").eq("user_id", user["id"]).eq("status", "active").execute()
        if res.data:
            sub_id = res.data[0].get("stripe_subscription_id")
            if sub_id and stripe.api_key and stripe.api_key.startswith("sk_test"):
                stripe.Subscription.delete(sub_id)
            supabase.table("subscriptions").update({"status": "canceled"}).eq("user_id", user["id"]).execute()
            supabase.table("profiles").update({"tier": "free"}).eq("id", user["id"]).execute()
            return {"status": "canceled"}
        return {"status": "no_active_sub"}
    except Exception as e:
        raise HTTPException(400, str(e))

@app.get("/v1/billing")
def get_billing(key: str = Depends(rate_limit)):
    user = get_user_from_api_key(key)
    if not user:
        return {"tier": "free", "usage": 0, "note": "Demo mode - configure Supabase for real data"}
    try:
        subs = supabase.table("subscriptions").select("*").eq("user_id", user["id"]).execute().data or []
        usage_res = supabase.table("usage").select("*", count="exact").eq("user_id", user["id"]).eq("month", datetime.utcnow().strftime("%Y-%m")).execute()
        return {
            "tier": user.get("tier", "free"),
            "subscriptions": subs,
            "usage_this_month": usage_res.count or 0
        }
    except Exception as e:
        return {"tier": user.get("tier", "free"), "error": str(e), "note": "Supabase not fully configured"}
