use clap::{Parser, Subcommand};
use chainwatch_pro::ChainWatchClient;

#[derive(Parser)]
#[command(name = "chainwatch-rs")]
#[command(about = "ChainWatch Pro Rust CLI")]
struct Cli {
    #[arg(short, long, default_value = "cw_live_demo_only_replace_me")]
    key: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Scan {
        address: String,
        #[arg(short, long, default_value = "base")]
        chain: String,
    },
    Vaults,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let client = ChainWatchClient::new(cli.key, None);

    match cli.command {
        Commands::Scan { address, chain } => {
            let res = client.scan_wallet(&address, &chain).await?;
            println!("Risk: {}/100, Health: {}/100 on {}", res.risk_score, res.health, res.chain);
        }
        Commands::Vaults => {
            println!("Vaults listing not fully implemented in stub - see Python/TS for full.");
        }
    }
    Ok(())
}