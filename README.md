# ChainWatch Pro

**Production-grade Web3 SaaS starter for wallet risk scoring, vault intelligence, paid alerts, and subscription revenue.**

A beautiful, dark, neon cyber-fintech dashboard + full legal pages + real multi-language SDKs (Python + C++) + FastAPI reference backend. Everything you need to turn a demo into a real paid product.

![ChainWatch Pro dark neon dashboard](https://raw.githubusercontent.com/Sebby1770/chainwatch-pro/main/public/media/chainwatch-dashboard.png)

## What’s new in this major upgrade

- **Stunning visuals** — full dark cyber-neon theme, glassmorphism, animated network background canvas, buttery Framer Motion interactions, live updating alert feed, premium charts.
- **Functional SaaS surfaces** — API key generation + persistence, one-click subscribe/checkout modal (fake but realistic), instant PDF export of beautiful risk reports, simulated real-time signals.
- **Complete legal foundation** — Professional Privacy Policy + Terms of Service (Web3-aware, with strong disclaimers, GDPR/CCPA notes, public blockchain data callouts). Ready for real customers (have a lawyer review).
- **Multi-language clients** (now 4 languages)
  - Full **Python SDK + CLI** (`pip install`, `chainwatch scan`, async-ready client, examples + tests)
  - **TypeScript/Node SDK** (browser + server, with CLI)
  - **Go SDK + CLI** (cobra-based, easy to import)
  - **C++ SDK + CLI** (CMake, pure mock or libcurl mode, header + impl)
- **Reference backend** — FastAPI server (`/v1/scan`, `/v1/vaults`, `/v1/alerts`) that the web demo and SDKs already speak to. Drop-in starting point for your real indexer + risk engine.
- **API Playground** inside the product + clear production path documented.

## Tech (frontend)

- React 19 + TypeScript + Vite
- Recharts, Framer Motion, Sonner (toasts), jsPDF (exports)
- React Router (proper routes for /dashboard, /pricing, /docs, /privacy, /terms)
- Pure modern CSS (glass + neon variables)

## Run the web app

```bash
npm install
npm run dev
```

Open the printed URL. Generate an API key, try scans, switch chains/modes, subscribe to plans, export PDFs, play with the API console, and visit the legal pages.

Build for production:

```bash
npm run build
```

## Python SDK + CLI

```bash
cd sdks/python
pip install -e .
chainwatch scan 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --chain base
chainwatch vaults
```

See [sdks/python/README.md](sdks/python/README.md) and the `examples/` folder.

## C++ Client

```bash
cd sdks/cpp
mkdir build && cd build
cmake ..
cmake --build . -j
./chainwatch_cli scan 0x... --chain solana
```

See [sdks/cpp/README.md](sdks/cpp/README.md).

## Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8787
```

The Python client and web demo can point at `http://localhost:8787` (update base URLs).

## New in latest updates (SaaS production features)
- **Stripe Customer Portal**: Backend `/v1/create-portal-session` (ready for real `stripe.billing_portal.Session.create`). Frontend Account page button calls it and opens the hosted portal URL.
- **Signed Webhooks**: Full HMAC-SHA256 signing in simulator + receiver demo. Python SDK has `ChainWatchClient.verify_webhook(payload, signature, secret)`.
- **GraphQL demo**: `/graphql` endpoint with basic queries for scan/vaults/me (expand with Strawberry for full).
- **Rust SDK stub**: High-perf async client + CLI (Cargo based).
- **Real backend billing**: `/v1/subscribe`, `/v1/cancel-subscription`, `/v1/billing` using Supabase + Stripe (test mode ready; configure keys for production).
- **Backend Supabase integration**: Persists users, keys, subs, usage. Use service role key.
- **Supabase RLS**: Complete policies in `integrations/supabase/migrations/002_rls_policies.sql`.
- **Rate limiting**: Per-key in backend (120/min example).
- **Frontend tests**: Vitest + RTL setup (`npm test`).

## Turning this into a real paid SaaS (checklist)

1. **Data** — Replace the deterministic mock math with real calls:
   - On-chain: Alchemy, Helius, QuickNode, Moralis, Covalent, The Graph
   - Market/yield: DefiLlama, Dune, Token Terminal, CoinGecko
   - Risk/compliance (optional but powerful): Chainalysis, TRM, Blockaid, GoPlus
2. **Auth & users** — Clerk, Supabase Auth, Firebase, or your own + API key issuance + scopes/rate limits.
3. **Payments** — Stripe Checkout + Customer Portal + webhooks (upgrade/downgrade/cancel). Lemon Squeezy is also great for global.
4. **Alerts delivery** — Resend (email), Telegram bot, Discord/Slack webhooks, SMS (Twilio).
5. **Hosting**
   - Frontend: Vercel / Netlify (zero config)
   - Backend + DB: Fly.io, Railway, Render, or your K8s
6. **Legal & compliance** — Have counsel review the included Privacy Policy + Terms (they are strong starters but not legal advice). Add DPA, cookie banner if needed, KYC/AML notes for certain features.
7. **Observability** — Add logging, error tracking (Sentry), usage analytics, and proper API key hashing.

## Folder layout

```
.
├── src/                 # React app (console, pricing, docs, privacy, terms)
├── public/media/        # hero/preview image
├── sdks/
│   ├── python/          # pip package + CLI + examples
│   └── cpp/             # CMake + native CLI
├── backend/             # FastAPI reference implementation
├── README.md
├── SECURITY.md
└── LICENSE (MIT)
```

## Important disclaimers

**This is not financial advice.** All numbers, risk scores, and recommendations in the demo are simulated. Do not use them for trading, lending, or investment decisions.

Before you charge real money:
- Connect real data sources
- Add proper authentication, rate limiting, and payment security
- Review and customize the legal documents with qualified counsel
- Implement audit logging and abuse prevention

## License

MIT © Sebastian Forbes

Contributions, forks, and real companies built on top of this starter are very welcome. Ship something great.
