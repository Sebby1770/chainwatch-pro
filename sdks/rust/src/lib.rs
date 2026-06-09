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
        let url = format!("{}/v1/scan", self.base_url);
        let res = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&serde_json::json!({
                "address": address,
                "chain": chain,
                "risk_mode": "balanced"
            }))
            .send()
            .await?
            .json::<ScanResult>()
            .await?;
        Ok(res)
    }

    // Add verify_webhook etc as needed
}