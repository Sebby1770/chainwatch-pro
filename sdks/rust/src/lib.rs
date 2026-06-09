use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub wallet: String,
    pub chain: String,
    pub risk_score: i32,
    pub health: i32,
    pub value_usd: f64,
    pub positions: i32,
    pub gas: String,
    pub allocation: std::collections::HashMap<String, f64>,
}

pub struct ChainWatchClient {
    api_key: String,
    base_url: String,
    client: Client,
}

impl ChainWatchClient {
    pub fn new(api_key: impl Into<String>, base_url: Option<String>) -> Self {
        Self {
            api_key: api_key.into(),
            base_url: base_url.unwrap_or_else(|| "https://api.chainwatch.pro".to_string()),
            client: Client::new(),
        }
    }

    pub async fn scan_wallet(&self, address: &str, chain: &str) -> Result<ScanResult, Box<dyn std::error::Error>> {
        // Stub: in full impl use reqwest to call API, parse JSON to ScanResult
        // For demo build, return mock data matching backend
        Ok(ScanResult {
            wallet: address.to_string(),
            chain: chain.to_string(),
            risk_score: 42,
            health: 78,
            value_usd: 125000.0,
            positions: 7,
            gas: "$0.31".to_string(),
            allocation: [("Keep".to_string(), 58.0), ("Hedge".to_string(), 27.0), ("Review".to_string(), 15.0)].into(),
        })
    }

    // Add verify_webhook etc as needed
}