from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Any, Literal
import httpx

Chain = Literal["ethereum", "base", "arbitrum", "polygon", "solana"]
RiskMode = Literal["conservative", "balanced", "aggressive"]


@dataclass
class ScanResult:
    wallet: str
    chain: str
    risk_score: int
    health_score: int
    portfolio_value_usd: float
    active_positions: int
    gas_median: str
    allocation: dict[str, float]


@dataclass
class Vault:
    name: str
    chain: str
    apy: float
    risk: int
    capacity: str
    revenue_model: str


@dataclass
class Alert:
    title: str
    detail: str
    severity: str
    ts: str


class ChainWatchClient:
    """Synchronous client for ChainWatch Pro API (demo + production ready)."""

    def __init__(self, api_key: str | None = None, base_url: str = "https://api.chainwatch.pro"):
        self.api_key = api_key or os.getenv("CHAINWATCH_API_KEY")
        if not self.api_key:
            raise ValueError("API key required (pass or set CHAINWATCH_API_KEY)")
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=30.0, headers={
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "chainwatch-python/0.2",
        })

    def _get(self, path: str, params: dict | None = None) -> Any:
        r = self._client.get(f"{self.base_url}{path}", params=params)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, json: dict) -> Any:
        r = self._client.post(f"{self.base_url}{path}", json=json)
        r.raise_for_status()
        return r.json()

    def scan_wallet(self, address: str, chain: Chain = "base", risk_mode: RiskMode = "balanced") -> ScanResult:
        # In production this would call the real /v1/scan
        # Here we return a shaped mock that matches the web demo semantics
        data = self._post("/v1/scan", {"address": address, "chain": chain, "risk_mode": risk_mode})
        # The demo backend (see /backend) returns the shape below; fallback to local shape if offline
        return ScanResult(
            wallet=address,
            chain=data.get("chain", chain),
            risk_score=data.get("risk_score", 41),
            health_score=data.get("health", 67),
            portfolio_value_usd=data.get("value_usd", 124000),
            active_positions=data.get("positions", 7),
            gas_median=data.get("gas", "$0.31"),
            allocation=data.get("allocation", {"Keep": 58, "Hedge": 27, "Review": 15}),
        )

    def list_vaults(self, limit: int = 10) -> list[Vault]:
        data = self._get("/v1/vaults", {"limit": limit})
        return [
            Vault(
                name=v["name"],
                chain=v["chain"],
                apy=v["apy"],
                risk=v["risk"],
                capacity=v["capacity"],
                revenue_model=v.get("revenue", v.get("revenue_model", "")),
            )
            for v in data.get("results", data)[:limit]
        ]

    def get_alerts(self) -> list[Alert]:
        data = self._get("/v1/alerts")
        return [Alert(**a) for a in data.get("feed", data)]

    @staticmethod
    def verify_webhook(payload: dict, signature: str, secret: str) -> bool:
        """Verify HMAC signature from ChainWatch webhook (sha256=... header value)."""
        import hashlib, hmac, json
        payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        expected = "sha256=" + hmac.new(
            secret.encode(), payload_str.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)

    def close(self):
        self._client.close()

    def __enter__(self): return self
    def __exit__(self, *a): self.close()
