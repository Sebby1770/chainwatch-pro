# ChainWatch Pro — Go SDK + CLI

Lightweight Go client and CLI.

## Build / Run

```bash
cd sdks/go
go run . scan 0x... --chain base
go build -o chainwatch-go .
./chainwatch-go vaults
```

## Library usage

```go
import "github.com/Sebby1770/chainwatch-pro/sdks/go/chainwatch"

c := chainwatch.NewClient("cw_live_...")
r, _ := c.ScanWallet("0x...", "base")
fmt.Println(r.RiskScore)
```

See the main repo for the matching backend contract.
