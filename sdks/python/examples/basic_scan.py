"""Minimal example using the ChainWatch Pro Python SDK."""
from chainwatch import ChainWatchClient

# Use your real key in production (or CHAINWATCH_API_KEY env var)
client = ChainWatchClient(api_key="cw_live_demo_only_replace_me")

result = client.scan_wallet("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", chain="base")
print("Risk:", result.risk_score)
print("Health:", result.health_score)
print("Value:", result.portfolio_value_usd)

print("\nVaults:")
for v in client.list_vaults(limit=3):
    print(f"  {v.name} ({v.chain}) — APY {v.apy}% risk={v.risk}")

client.close()
