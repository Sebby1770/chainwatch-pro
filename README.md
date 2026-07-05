# ChainWatch Pro

ChainWatch Pro is a GitHub-ready Web3 SaaS starter for wallet risk scoring, vault intelligence, contract scanning, paid alerts, and subscription revenue planning.

Version 4 adds vault intelligence, contract scanner, GraphQL playground, usage analytics, address labels, alert digest preview, and mobile bottom navigation.

## What it includes

- **Dashboard** — animated network background, live alert feed, multi-wallet compare, 7-day risk timeline, portfolio risk dashboard, usage analytics widget, transaction timeline, PDF export
- **Watchlist** — add/remove wallets with labels, tags, localStorage persistence, and quick scan
- **Vaults** — DeFi vault cards with APY, TVL, risk score; filter by chain and sort
- **Contract Scanner** — mock audit scores, vulnerability list, and compiler info for any contract address
- **Alerts** — rule builder (threshold, chain, type), simulated alert history, daily digest email preview
- **Compliance** — mock compliance summary generator for scanned wallets
- **Webhooks** — test webhook delivery simulator with localStorage delivery log
- **GraphQL Playground** — mock query editor with sample queries for scan, vaults, and contract audit
- **Settings** — API key generation, theme toggle, notification preferences, webhook URL
- **API Playground** — interactive console for `/v1/scan`, `/v1/scan/contract`, `/v1/vaults`, `/v1/usage`, `/v1/alerts`, `/v1/webhooks/receive`
- **Pricing** — Free, Pro, Enterprise tiers with revenue simulator
- **Docs** — quick start, SDK overview, endpoint reference
- **Backend** — FastAPI stub with deterministic mock risk scoring, contract scanning, and webhook receiver

## Tech stack

- React 19 + TypeScript + Vite
- react-router-dom, framer-motion, sonner
- Recharts, Lucide React, jsPDF
- FastAPI backend stub
- Vitest + Testing Library

## Run locally

### Frontend

```bash
npm install
npm run dev
```

### Backend (optional)

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/dashboard` | Dashboard |
| `/watchlist` | Watchlist |
| `/vaults` | Vault intelligence |
| `/scanner` | Contract scanner |
| `/alerts` | Alerts |
| `/compliance` | Compliance report |
| `/webhooks` | Webhook simulator |
| `/graphql` | GraphQL playground |
| `/pricing` | Pricing |
| `/docs` | Documentation |
| `/api-playground` | API console |
| `/settings` | Settings |

## Build & test

```bash
npm run build
npm run test
```

## Docker (backend)

```bash
cd backend
docker build -t chainwatch-api .
docker run -p 8000:8000 chainwatch-api
```

## Production integrations

Replace demo calculations with real services:

- **Wallet/indexing**: Alchemy, Moralis, QuickNode, Covalent, The Graph
- **Market/DeFi**: DefiLlama, CoinGecko, Dune
- **Risk**: Chainalysis, TRM Labs, Blockaid, GoPlus Security
- **Contract audit**: Slither, Mythril, Etherscan verification API
- **Payments**: Stripe Checkout or Lemon Squeezy
- **Auth/DB**: Clerk, Supabase, Firebase
- **Alerts**: Resend, Telegram Bot API, Discord/Slack webhooks

## Important note

This is not financial advice. Demo data should not be used for trading decisions. Before charging customers, add real data sources, legal disclaimers, privacy policy, terms of service, rate limiting, and payment security.