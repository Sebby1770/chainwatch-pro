# ChainWatch Pro — TypeScript / Node SDK

Official TypeScript client (works in browser + Node).

## Install

```bash
npm install chainwatch-pro-ts
# or from source
npm install github:Sebby1770/chainwatch-pro#path:sdks/typescript
```

## Usage

```ts
import { ChainWatchClient } from 'chainwatch-pro-ts'

const client = new ChainWatchClient({ apiKey: 'cw_live_...' })
const scan = await client.scanWallet('0x...', { chain: 'base' })
console.log(scan.riskScore)
```

## CLI (via npx or install)

```bash
npx chainwatch-ts scan 0x... --chain solana
```

See `src/` for the implementation and the main repo for the full contract.
