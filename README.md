# ChainWatch Pro

ChainWatch Pro is a GitHub-ready Web3 SaaS starter for wallet risk scoring, vault intelligence, paid alerts, and subscription revenue planning.

Version 2 adds full routing, dedicated pages, a FastAPI backend stub, API playground, and production-oriented architecture.

## What it includes

- **Dashboard** — animated network background, live alert feed (simulated WebSocket every 5s), multi-wallet compare, 7-day risk timeline, chain switcher, risk mode toggle
- **Watchlist** — add/remove wallets with localStorage persistence and quick scan
- **Alerts** — rule builder (threshold, chain, type) and simulated alert history
- **API Playground** — interactive console for `/v1/scan`, `/v1/vaults`, `/v1/alerts`
- **Pricing** — Free, Pro, Enterprise tiers with revenue simulator
- **Docs** — quick start, SDK overview, endpoint reference
- **Backend** — FastAPI stub with deterministic mock risk scoring

## Tech stack

- React 19 + TypeScript + Vite
- react-router-dom, framer-motion, sonner
- Recharts, Lucide React
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
| `/alerts` | Alerts |
| `/pricing` | Pricing |
| `/docs` | Documentation |
| `/api-playground` | API console |

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
- **Payments**: Stripe Checkout or Lemon Squeezy
- **Auth/DB**: Clerk, Supabase, Firebase
- **Alerts**: Resend, Telegram Bot API, Discord/Slack webhooks

## Important note

This is not financial advice. Demo data should not be used for trading decisions. Before charging customers, add real data sources, legal disclaimers, privacy policy, terms of service, rate limiting, and payment security.