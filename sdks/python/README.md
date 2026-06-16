# ChainWatch Pro — Python SDK + CLI

Official Python client and command-line interface for ChainWatch Pro.

## Install

```bash
pip install -e .
# or from source
pip install git+https://github.com/Sebby1770/chainwatch-pro.git#subdirectory=sdks/python
```

## Quick usage

```python
from chainwatch import ChainWatchClient

client = ChainWatchClient(api_key="cw_live_yourkey")

result = client.scan_wallet("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", chain="base")
print(result.risk_score, result.health_score)

vaults = client.list_vaults()
print(vaults)
```

## CLI

```bash
# after install
chainwatch scan 0x... --chain solana --risk-mode aggressive
chainwatch vaults --limit 5
chainwatch alerts --watch   # streams simulated feed
```

## Configuration

Set env var `CHAINWATCH_API_KEY` or pass explicitly.

The client currently targets a demo/mock backend. Point `base_url` at your production API.

## Development

```bash
cd sdks/python
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

See the main repo for the FastAPI backend stub and full API contract.
