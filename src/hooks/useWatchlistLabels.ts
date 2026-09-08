import { useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_WATCHLIST, findWatchlistEntry, sanitizeWatchlist } from '../lib/watchlist'
import type { WatchlistEntry } from '../lib/types'

export function useWatchlistLabels() {
  const [rawWatchlist] = useLocalStorage<WatchlistEntry[]>('chainwatch-watchlist', DEFAULT_WATCHLIST)

  const watchlist = useMemo(() => sanitizeWatchlist(rawWatchlist), [rawWatchlist])

  const resolveAddress = (address: string) => findWatchlistEntry(watchlist, address)

  return { watchlist, resolveAddress }
}