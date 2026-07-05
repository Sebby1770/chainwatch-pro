import type { WatchlistEntry } from './types'

export const DEFAULT_WATCHLIST: WatchlistEntry[] = [
  {
    id: '1',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    label: 'Demo vault',
    tags: ['defi', 'treasury'],
    addedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    label: 'Treasury',
    tags: ['ops', 'multisig'],
    addedAt: Date.now() - 172800000,
  },
]

export function normalizeWatchlistEntry(entry: WatchlistEntry): WatchlistEntry {
  return {
    ...entry,
    tags: entry.tags ?? [],
  }
}

export function findWatchlistEntry(watchlist: WatchlistEntry[], address: string): WatchlistEntry | undefined {
  const normalized = address.toLowerCase()
  return watchlist.find((entry) => entry.address.toLowerCase() === normalized)
}