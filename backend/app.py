from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="ChainWatch Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ChainId = Literal["ethereum", "base", "arbitrum", "polygon", "solana"]
RiskMode = Literal["conservative", "balanced", "aggressive"]

CHAIN_BASE_RISK = {
    "ethereum": 34,
    "base": 24,
    "arbitrum": 29,
    "polygon": 31,
    "solana": 38,
}

MODE_DELTA = {
    "conservative": -7,
    "balanced": 0,
    "aggressive": 9,
}

VAULTS = [
    {
        "name": "Stablecoin Delta Vault",
        "chain": "base",
        "apy": 8.4,
        "risk": 22,
        "capacity": "$8.1M",
    },
    {
        "name": "LST Loop Monitor",
        "chain": "ethereum",
        "apy": 6.9,
        "risk": 31,
        "capacity": "$24.8M",
    },
    {
        "name": "Perps Funding Sweep",
        "chain": "arbitrum",
        "apy": 14.7,
        "risk": 57,
        "capacity": "$3.7M",
    },
]


def hash_text(value: str) -> int:
    hash_value = 17
    for char in value:
        hash_value = (hash_value * 31 + ord(char)) % 1_000_003
    return hash_value


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


class ScanRequest(BaseModel):
    address: str = Field(..., min_length=3)
    chain: ChainId = "base"
    mode: RiskMode = "balanced"


class ScanResponse(BaseModel):
    address: str
    chain: ChainId
    mode: RiskMode
    risk_score: int
    health_score: int
    portfolio_value: int
    active_positions: int
    wallet_age_days: int


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/v1/scan", response_model=ScanResponse)
def scan_wallet(payload: ScanRequest) -> ScanResponse:
    seed = hash_text(f"{payload.address}-{payload.chain}-{payload.mode}")
    base_risk = CHAIN_BASE_RISK[payload.chain]
    mode_delta = MODE_DELTA[payload.mode]
    risk_score = int(clamp(base_risk + mode_delta + (seed % 43) - 13, 12, 94))
    health_score = int(clamp(105 - risk_score + (seed % 9) - 4, 8, 99))

    return ScanResponse(
        address=payload.address,
        chain=payload.chain,
        mode=payload.mode,
        risk_score=risk_score,
        health_score=health_score,
        portfolio_value=18000 + (seed % 420000),
        active_positions=5 + (seed % 18),
        wallet_age_days=80 + (seed % 1320),
    )


@app.get("/v1/vaults")
def list_vaults() -> dict[str, list[dict]]:
    return {"vaults": VAULTS}


@app.get("/v1/alerts")
def list_alerts() -> dict[str, list[dict]]:
    return {
        "alerts": [
            {
                "id": "1",
                "severity": "watch",
                "chain": "base",
                "message": "Slippage exceeded 2.5% on swap route",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "2",
                "severity": "critical",
                "chain": "ethereum",
                "message": "Contract admin role transferred",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "3",
                "severity": "healthy",
                "chain": "arbitrum",
                "message": "Gas window efficient for batch execution",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        ]
    }