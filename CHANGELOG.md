# Changelog

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