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

/**
 * Fills in a stored entry's optional fields and forces its address to a string.
 *
 * Entries come back from localStorage, which is scoped to the ORIGIN — every
 * project published under the same GitHub Pages account shares this store. A
 * stored entry whose `address` was a number, null or an object used to throw in
 * findWatchlistEntry, computePortfolioRisk and screenAddress ("address.trim is
 * not a function"), which in React means the Watchlist and Dashboard pages
 * white-screen with no way back except clearing site data by hand.
 */
export function normalizeWatchlistEntry(entry: WatchlistEntry): WatchlistEntry {
  return {
    ...entry,
    address: typeof entry?.address === 'string' ? entry.address : '',
    // A number is coerced rather than dropped so a label like `2024` survives;
    // anything else would stringify to junk such as "[object Object]".
    label: typeof entry?.label === 'string'
      ? entry.label
      : typeof entry?.label === 'number' && Number.isFinite(entry.label)
        ? String(entry.label)
        : '',
    tags: Array.isArray(entry?.tags) ? entry.tags.filter((tag) => typeof tag === 'string') : [],
    addedAt: Number.isFinite(Number(entry?.addedAt)) ? Number(entry.addedAt) : 0,
  }
}

/** Normalises a stored list and drops entries with no usable address. */
export function sanitizeWatchlist(list: unknown): WatchlistEntry[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((entry): entry is WatchlistEntry => Boolean(entry) && typeof entry === 'object')
    .map(normalizeWatchlistEntry)
    .filter((entry) => entry.address.trim() !== '')
}

export function findWatchlistEntry(watchlist: WatchlistEntry[], address: string): WatchlistEntry | undefined {
  const normalized = String(address ?? '').toLowerCase()
  return watchlist.find((entry) => String(entry?.address ?? '').toLowerCase() === normalized)
}