[package]
name = "chainwatch-pro"
version = "0.2.0"
edition = "2021"
description = "Official Rust SDK + CLI for ChainWatch Pro"
license = "MIT"

[dependencies]
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
clap = { version = "4", features = ["derive"] }

[[bin]]
name = "chainwatch-rs"
path = "src/main.rs"