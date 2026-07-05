from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chainwatch")

app = FastAPI(title="ChainWatch Pro API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ChainId = Literal["ethereum", "base", "arbitrum", "polygon", "solana"]
RiskMode = Literal["conservative", "balanced", "aggressive"]
VulnSeverity = Literal["low", "medium", "high", "critical"]

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
        "id": "stable-delta",
        "name": "Stablecoin Delta Vault",
        "chain": "base",
        "apy": 8.4,
        "tvl": 8_100_000,
        "tvl_label": "$8.1M",
        "risk_score": 22,
        "capacity": "$8.1M",
        "protocol": "Aave v3",
        "auditors": ["OpenZeppelin", "Trail of Bits"],
        "depositors": 412,
        "status": "Low drawdown",
        "revenue_model": "$129/mo pro signal",
    },
    {
        "id": "lst-loop",
        "name": "LST Loop Monitor",
        "chain": "ethereum",
        "apy": 6.9,
        "tvl": 24_800_000,
        "tvl_label": "$24.8M",
        "risk_score": 31,
        "capacity": "$24.8M",
        "protocol": "Lido + Curve",
        "auditors": ["Spearbit", "Consensys Diligence"],
        "depositors": 1284,
        "status": "Crowded trade",
        "revenue_model": "$349/mo desk plan",
    },
    {
        "id": "perps-funding",
        "name": "Perps Funding Sweep",
        "chain": "arbitrum",
        "apy": 14.7,
        "tvl": 3_700_000,
        "tvl_label": "$3.7M",
        "risk_score": 57,
        "capacity": "$3.7M",
        "protocol": "GMX v2",
        "auditors": ["Sherlock"],
        "depositors": 198,
        "status": "Active watchlist",
        "revenue_model": "2% success fee",
    },
    {
        "id": "treasury-rebalance",
        "name": "Treasury Rebalance Bot",
        "chain": "solana",
        "apy": 10.2,
        "tvl": 5_900_000,
        "tvl_label": "$5.9M",
        "risk_score": 44,
        "capacity": "$5.9M",
        "protocol": "Jupiter + Marinade",
        "auditors": ["OtterSec"],
        "depositors": 67,
        "status": "API gated",
        "revenue_model": "$799/mo enterprise",
    },
    {
        "id": "polygon-yield",
        "name": "Polygon Yield Optimizer",
        "chain": "polygon",
        "apy": 11.3,
        "tvl": 4_200_000,
        "tvl_label": "$4.2M",
        "risk_score": 38,
        "capacity": "$4.2M",
        "protocol": "Balancer",
        "auditors": ["Halborn"],
        "depositors": 523,
        "status": "Rebalancing",
        "revenue_model": "$199/mo pro signal",
    },
    {
        "id": "eth-restake",
        "name": "ETH Restake Sentinel",
        "chain": "ethereum",
        "apy": 5.8,
        "tvl": 31_200_000,
        "tvl_label": "$31.2M",
        "risk_score": 28,
        "capacity": "$31.2M",
        "protocol": "EigenLayer",
        "auditors": ["Sigma Prime", "OpenZeppelin"],
        "depositors": 2104,
        "status": "Stable inflow",
        "revenue_model": "$449/mo desk plan",
    },
]

VULN_TEMPLATES = [
    {
        "severity": "critical",
        "title": "Unchecked external call return value",
        "detail": "Low-level call result is not validated before state update.",
        "line": 142,
    },
    {
        "severity": "high",
        "title": "Centralized admin role",
        "detail": "Single EOA holds DEFAULT_ADMIN_ROLE without timelock.",
        "line": 58,
    },
    {
        "severity": "medium",
        "title": "Missing events on privileged functions",
        "detail": "Role grants and parameter updates emit no indexed events.",
        "line": 201,
    },
    {
        "severity": "low",
        "title": "Floating pragma",
        "detail": "Contract allows any compiler version >=0.8.0.",
    },
]

COMPILER_VERSIONS = [
    "v0.8.19+commit.7dd6d404",
    "v0.8.20+commit.a1b79de6",
    "v0.8.24+commit.e11b9ed9",
]
CONTRACT_NAMES = [
    "VaultStrategy",
    "TimelockController",
    "RewardDistributor",
    "LiquidityRouter",
    "AccessManager",
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


class ContractScanRequest(BaseModel):
    address: str = Field(..., min_length=3)
    chain: ChainId = "ethereum"


class CompilerInfo(BaseModel):
    version: str
    optimization: bool
    runs: int
    evm_version: str


class Vulnerability(BaseModel):
    id: str
    severity: VulnSeverity
    title: str
    detail: str
    line: int | None = None


class ContractScanResponse(BaseModel):
    address: str
    chain: ChainId
    audit_score: int
    risk_grade: str
    compiler: CompilerInfo
    contract_name: str
    is_verified: bool
    proxy_detected: bool
    vulnerabilities: list[Vulnerability]
    scanned_at: str


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "version": "4.0.0",
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


@app.post("/v1/scan/contract", response_model=ContractScanResponse)
def scan_contract(payload: ContractScanRequest) -> ContractScanResponse:
    seed = hash_text(f"{payload.address}-{payload.chain}")
    audit_score = int(clamp(38 + (seed % 58) - (len(payload.address) % 7), 22, 96))
    risk_grade = (
        "A"
        if audit_score >= 85
        else "B"
        if audit_score >= 70
        else "C"
        if audit_score >= 55
        else "D"
        if audit_score >= 40
        else "F"
    )

    vuln_count = 1 if audit_score >= 80 else 2 if audit_score >= 60 else 3 if audit_score >= 45 else 4
    vulnerabilities = [
        Vulnerability(
            id=f"vuln-{index + 1}",
            severity=template["severity"],
            title=template["title"],
            detail=template["detail"],
            line=template.get("line"),
        )
        for index in range(vuln_count)
        for template in [VULN_TEMPLATES[(seed + index * 3) % len(VULN_TEMPLATES)]]
    ]

    return ContractScanResponse(
        address=payload.address,
        chain=payload.chain,
        audit_score=audit_score,
        risk_grade=risk_grade,
        compiler=CompilerInfo(
            version=COMPILER_VERSIONS[seed % len(COMPILER_VERSIONS)],
            optimization=seed % 3 != 0,
            runs=200 + (seed % 800),
            evm_version="paris" if seed % 2 == 0 else "shanghai",
        ),
        contract_name=CONTRACT_NAMES[seed % len(CONTRACT_NAMES)],
        is_verified=seed % 5 != 0,
        proxy_detected=seed % 4 == 0,
        vulnerabilities=vulnerabilities,
        scanned_at=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/v1/vaults")
def list_vaults() -> dict[str, Any]:
    total_tvl = sum(vault["tvl"] for vault in VAULTS)
    return {
        "vaults": VAULTS,
        "total_tvl": total_tvl,
        "count": len(VAULTS),
    }


@app.get("/v1/usage")
def usage_stats() -> dict[str, Any]:
    return {
        "period": "30d",
        "api_calls": 1240,
        "wallet_scans": 318,
        "contract_scans": 74,
        "alerts_sent": 56,
        "plan": "pro",
        "quota": {"api_calls": 1000, "scans": "unlimited"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


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


@app.post("/v1/webhooks/receive")
async def receive_webhook(request: Request) -> dict[str, Any]:
    payload = await request.json()
    api_key = request.headers.get("X-API-Key", "none")
    logger.info(
        "Webhook received | api_key=%s | payload=%s",
        api_key[:12] + "..." if len(api_key) > 12 else api_key,
        payload,
    )
    return {
        "status": "received",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": payload.get("event", "unknown"),
        "logged": True,
    }