# Changelog

## [5.1.0] - 2026-09-06

### Added

- **Address validation.** The watchlist, dashboard and contract scanner accepted any non-empty string as a wallet address, so `hello world` could be added, screened, risk-scored and filed into a compliance report. `src/lib/address.ts` validates EVM addresses (length, hex, and **EIP-55 mixed-case checksum**, verified against the reference vectors in the spec), Solana addresses (base58 decoding to 32 bytes), and ENS names for the dashboard's "Wallet or ENS" field. Addresses are stored in canonical checksummed form.
- **CSV import now reports what it refused.** Bad rows were silently dropped, so importing a file with a mistyped address looked identical to a clean import. `importWatchlistCsv` returns each rejection with its row number and reason, plus a duplicate count, and the UI surfaces them.
- A failed EIP-55 checksum offers the corrected address in the error toast instead of only refusing.

## [5.0.1] - 2026-09-05

### Fixed

- **Contract scanner reported duplicate findings.** Templates were indexed with a fixed stride (`seed + index * 3` over six templates), which aliased back onto itself after two steps, so every 3- and 4-finding scan listed the same vulnerability twice under different ids. Findings are now drawn without replacement via a seeded shuffle and sorted by descending severity.
- **Portfolio risk depended on watchlist ordering.** Each wallet took its chain from its array index, so adding, removing or re-sorting an entry changed every other wallet's chain, value and risk score. Chain is now derived from the address, making the summary order-independent.
- **Watchlist CSV import corrupted multi-line labels.** The parser split on newlines before honouring quotes, so a label containing a line break — which the exporter itself emits — was torn apart and its tail imported as an extra wallet address. Records are now tokenised character by character, and CRLF input is handled.
- **`useLocalStorage` could re-render without settling.** The stored reader depended on `initialValue`, so a caller passing an inline literal produced a new reader every render and drove a setState-in-effect cascade. The fallback is captured once and key changes are handled during render.
- Cleared the type errors in the canvas test shim that made `npm run lint` fail.

### Added

- Regression tests for contract scan findings, portfolio ordering, CSV round-trips and `useLocalStorage` (25 tests, up from 4).
- `npm run lint` now runs in CI.

## [5.0.0] - 2026-08-19

### Added

- Watchlist CSV import/export (`address,label,tags`)
- Deterministic sanctions screen on each watchlist card
- Batch wallet scan helper plus `POST /v1/scan/batch` and `GET /v1/sanctions/{address}` on the FastAPI stub
- API playground samples for batch scan and sanctions

### Changed

- Bumped API and package version to 5.0.0

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