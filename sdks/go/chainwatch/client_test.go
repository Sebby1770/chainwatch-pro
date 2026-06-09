package chainwatch

import "testing"

func TestClientCreation(t *testing.T) {
	c := NewClient("cw_live_test_key")
	if c.APIKey != "cw_live_test_key" {
		t.Error("API key not set correctly")
	}
}

func TestScanResultShape(t *testing.T) {
	// This test exercises the mock path (no network)
	c := NewClient("cw_live_demo_only_replace_me")
	r, err := c.ScanWallet("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "base")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if r.RiskScore < 10 || r.RiskScore > 99 {
		t.Errorf("risk score out of expected range: %d", r.RiskScore)
	}
}