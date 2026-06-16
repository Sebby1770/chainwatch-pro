package chainwatch

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	APIKey  string
	BaseURL string
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:  apiKey,
		BaseURL: "https://api.chainwatch.pro",
	}
}

type ScanResult struct {
	Wallet            string             `json:"wallet"`
	Chain             string             `json:"chain"`
	RiskScore         int                `json:"risk_score"`
	HealthScore       int                `json:"health"`
	PortfolioValueUSD float64            `json:"value_usd"`
	ActivePositions   int                `json:"positions"`
	GasMedian         string             `json:"gas"`
	Allocation        map[string]float64 `json:"allocation"`
}

func (c *Client) ScanWallet(address, chain string) (*ScanResult, error) {
	body := map[string]string{"address": address, "chain": chain, "risk_mode": "balanced"}
	b, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", c.BaseURL+"/v1/scan", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("api error: %s", resp.Status)
	}

	var raw struct {
		Wallet  string  `json:"wallet"`
		Chain   string  `json:"chain"`
		Risk    int     `json:"risk_score"`
		Health  int     `json:"health"`
		Value   float64 `json:"value_usd"`
		Pos     int     `json:"positions"`
		Gas     string  `json:"gas"`
		Alloc   map[string]float64 `json:"allocation"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}

	return &ScanResult{
		Wallet:            raw.Wallet,
		Chain:             raw.Chain,
		RiskScore:         raw.Risk,
		HealthScore:       raw.Health,
		PortfolioValueUSD: raw.Value,
		ActivePositions:   raw.Pos,
		GasMedian:         raw.Gas,
		Allocation:        raw.Alloc,
	}, nil
}

func (c *Client) ListVaults() (any, error) {
	req, _ := http.NewRequest("GET", c.BaseURL+"/v1/vaults", nil)
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return string(b), nil
}
