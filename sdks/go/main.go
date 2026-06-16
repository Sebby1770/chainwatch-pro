package main

import (
	"fmt"
	"os"

	"github.com/Sebby1770/chainwatch-pro/sdks/go/chainwatch"
	"github.com/spf13/cobra"
)

func main() {
	var apiKey string
	root := &cobra.Command{
		Use:   "chainwatch-go",
		Short: "ChainWatch Pro Go CLI",
	}

	root.PersistentFlags().StringVarP(&apiKey, "key", "k", os.Getenv("CHAINWATCH_API_KEY"), "API key")

	root.AddCommand(&cobra.Command{
		Use:   "scan [address]",
		Short: "Scan a wallet",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			addr := "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
			if len(args) > 0 { addr = args[0] }
			c := chainwatch.NewClient(apiKey)
			r, err := c.ScanWallet(addr, "base")
			if err != nil { return err }
			fmt.Printf("ChainWatch Pro • %s\nRisk: %d/100  Health: %d/100\nValue: $%.0f\n", r.Chain, r.RiskScore, r.HealthScore, r.PortfolioValueUSD)
			return nil
		},
	})

	root.AddCommand(&cobra.Command{
		Use:   "vaults",
		Short: "List vault signals",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := chainwatch.NewClient(apiKey)
			v, err := c.ListVaults()
			if err != nil { return err }
			fmt.Println(v)
			return nil
		},
	})

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}
