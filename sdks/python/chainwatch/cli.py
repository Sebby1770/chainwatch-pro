"""ChainWatch Pro CLI (Typer + Rich)"""
from __future__ import annotations
import typer
from rich import print
from rich.table import Table
from .client import ChainWatchClient

app = typer.Typer(help="ChainWatch Pro — on-chain risk & yield intelligence", no_args_is_help=True)

@app.command()
def scan(
    address: str = typer.Argument(..., help="Wallet address or ENS"),
    chain: str = typer.Option("base", "--chain", "-c", help="ethereum|base|arbitrum|polygon|solana"),
    risk_mode: str = typer.Option("balanced", "--risk-mode", "-r", help="conservative|balanced|aggressive"),
    api_key: str | None = typer.Option(None, "--key", envvar="CHAINWATCH_API_KEY"),
):
    """Run a wallet risk scan."""
    client = ChainWatchClient(api_key=api_key)
    res = client.scan_wallet(address, chain=chain, risk_mode=risk_mode)  # type: ignore
    print(f"[bold cyan]ChainWatch Pro[/]  •  {res.chain}")
    print(f"Wallet: [bold]{res.wallet}[/]")
    print(f"Risk: [bold]{res.risk_score}/100[/]   Health: [bold]{res.health_score}/100[/]")
    print(f"Value: ${res.portfolio_value_usd:,.0f}   Positions: {res.active_positions}")
    print(f"Allocation: {res.allocation}")
    client.close()


@app.command()
def vaults(limit: int = 8):
    """List monetizable vault signals."""
    client = ChainWatchClient()
    vs = client.list_vaults(limit=limit)
    table = Table(title="Vault Intelligence")
    table.add_column("Name")
    table.add_column("Chain")
    table.add_column("APY", justify="right")
    table.add_column("Risk")
    table.add_column("Revenue Model")
    for v in vs:
        table.add_row(v.name, v.chain, f"{v.apy}%", str(v.risk), v.revenue_model)
    print(table)
    client.close()


@app.command()
def alerts(watch: bool = typer.Option(False, "--watch", "-w", help="Poll for new signals")):
    """Show recent alerts (demo feed)."""
    client = ChainWatchClient()
    for a in client.get_alerts():
        color = "red" if a.severity == "critical" else "yellow" if a.severity == "watch" else "green"
        print(f"[{color}]• {a.title}[/] — {a.detail}  ({a.ts})")
    client.close()


if __name__ == "__main__":
    app()
