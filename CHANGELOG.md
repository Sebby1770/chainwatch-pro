# Changelog

## [4.0.0] - 2026-07-05

### Added

- **Vaults Page** (`/vaults`) — DeFi vault cards with APY, TVL, risk score, chain; filter by chain and sort by APY/TVL/risk/name
- **Contract Scanner Page** (`/scanner`) — paste contract address for mock audit score, vulnerability list, and compiler info
- **Usage Analytics** — dashboard widget tracking API calls, scans, contract scans, and alerts sent via localStorage counters
- **Address Labels** — custom labels and comma-separated tags on watchlist wallets; shown in dashboard compare and portfolio views
- **GraphQL Playground** (`/graphql`) — mock query editor with sample queries for wallet scan, vault list, and contract audit
- **Alert Digest Preview** — modal with formatted daily digest email preview on Alerts page
- **Mobile Bottom Nav** — responsive bottom tab bar (Home, Dashboard, Watchlist, Vaults, Scanner, Alerts) on small screens
- **Backend expansions** — richer `GET /v1/vaults`, new `GET /v1/usage`, and `POST /v1/scan/contract` in `backend/app.py`

### Changed

- Bumped API and package version to 4.0.0
- Extended watchlist entries with `tags` field and centralized default watchlist in `lib/watchlist.ts`
- API Playground mock responses updated for new endpoints

## [3.0.0] - 2026-07-05

### Added

- **Portfolio Risk Dashboard** — aggregate watchlist into portfolio risk score, diversification chart, and chain exposure pie on Dashboard
- **PDF Risk Report Export** — jsPDF downloadable wallet risk report from dashboard scan results
- **Settings Page** (`/settings`) — API key generation/persistence, theme preference, notification toggles, webhook URL config
- **Webhook Simulator Page** (`/webhooks`) — send test webhook payloads, view delivery log in localStorage
- **Transaction Timeline** — per-wallet mock transaction history on Dashboard (last 10 txs with risk flags)
- **Theme Toggle** — dark/light mode with localStorage persistence and CSS variable updates
- **Onboarding Tour** — 5-step modal tour on first visit (localStorage flag)
- **Backend webhook receiver** — `POST /v1/webhooks/receive` in `backend/app.py` logs payloads
- **Compliance Report page** (`/compliance`) — generates mock compliance summary for scanned wallet

### Changed

- Extended `SectionTitle` to support custom action nodes (PDF export button, etc.)
- Bumped API version to 3.0.0

## [2.0.0] - 2026-07-05

### Added

- **Routing** — react-router-dom with pages: Home, Dashboard, Watchlist, Alerts, Pricing, Docs, API Playground
- **Dashboard** — animated network background canvas, live alert feed (simulated every 5s), multi-wallet compare (3 addresses), 7-day risk timeline, per-chain risk metrics, risk mode toggle
- **Watchlist** — add/remove wallets with localStorage persistence, quick scan, risk score badges
- **Alerts** — rule builder (threshold, chain, type), simulated alert history with severity badges
- **API Playground** — interactive console with mock responses for `/v1/scan`, `/v1/vaults`, `/v1/alerts`
- **Pricing** — Free, Pro, Enterprise tier cards with revenue simulator
- **Docs** — quick start, SDK overview, endpoint reference
- **Backend** — FastAPI stub (`backend/app.py`) with deterministic mock risk scoring
- **DX** — framer-motion animations, sonner toasts, vitest + App test, GitHub Actions CI

### Changed

- Split monolithic `App.tsx` into `pages/`, `components/`, `lib/`, and `hooks/`
- Updated README with new architecture and backend instructions