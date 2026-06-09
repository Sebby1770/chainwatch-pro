import pytest
from chainwatch.client import ChainWatchClient

def test_client_instantiation():
    # Uses demo key for construction test only
    c = ChainWatchClient(api_key="cw_live_demo_only_replace_me")
    assert c is not None

def test_scan_shape():
    c = ChainWatchClient(api_key="cw_live_demo_only_replace_me")
    r = c.scan_wallet("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", chain="base")
    assert hasattr(r, "risk_score")
    assert 10 < r.risk_score < 100
    assert r.chain in ("base", "ethereum", "solana")

def test_list_vaults():
    c = ChainWatchClient(api_key="cw_live_demo_only_replace_me")
    vaults = c.list_vaults(limit=2)
    assert len(vaults) <= 2
    if vaults:
        assert hasattr(vaults[0], "apy")

def test_alerts_shape():
    c = ChainWatchClient(api_key="cw_live_demo_only_replace_me")
    alerts = c.get_alerts()
    assert isinstance(alerts, list)