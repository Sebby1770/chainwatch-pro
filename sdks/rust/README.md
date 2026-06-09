# ChainWatch Pro — Rust SDK + CLI (stub)

High-performance Rust client.

## Build & Run

```bash
cd sdks/rust
cargo build --release
./target/release/chainwatch-rs --key cw_live_... scan 0x... --chain base
```

See main repo for full examples and matching backend contract. Expand with reqwest for all endpoints including webhooks verify, billing etc.

Add to your Cargo.toml: `chainwatch-pro = { git = "https://github.com/Sebby1770/chainwatch-pro", subdirectory = "sdks/rust" }`