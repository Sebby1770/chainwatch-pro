import { describe, expect, it } from 'vitest'
import { findWatchlistEntry, normalizeWatchlistEntry, sanitizeWatchlist } from './watchlist'
import { computePortfolioRisk } from './portfolio'
import { screenAddress } from './sanctions'
import type { WatchlistEntry } from './types'

// Shapes that a corrupt or hostile localStorage write can produce. The store is
// origin-scoped, so every project on the same GitHub Pages account shares it.
const CORRUPT = [
  { id: '1', address: 12345, label: 'numeric', tags: [], addedAt: 1 },
  { id: '2', address: null, label: 'null', tags: [], addedAt: 2 },
  { id: '3', address: { nested: true }, label: 'object', tags: [], addedAt: 3 },
  { id: '4', label: 'missing', tags: [], addedAt: 4 },
  { id: '5', address: '0xabc', label: 42, tags: 'not an array', addedAt: 'soon' },
] as unknown as WatchlistEntry[]

describe('normalizeWatchlistEntry', () => {
  it('preserves a numeric label as text', () => {
    expect(normalizeWatchlistEntry({ address: '0xa', label: 2024 } as never).label).toBe('2024')
  })

  it('drops a label that would stringify to junk', () => {
    expect(normalizeWatchlistEntry({ address: '0xa', label: { a: 1 } } as never).label).toBe('')
  })

  it('coerces every field to its declared type', () => {
    const entry = normalizeWatchlistEntry(CORRUPT[4])
    expect(typeof entry.address).toBe('string')
    expect(typeof entry.label).toBe('string')
    expect(Array.isArray(entry.tags)).toBe(true)
    expect(typeof entry.addedAt).toBe('number')
  })

  it('turns an unusable address into an empty string rather than throwing', () => {
    for (const entry of CORRUPT.slice(0, 4)) {
      expect(normalizeWatchlistEntry(entry).address).toBe('')
    }
  })

  it('drops non-string tags', () => {
    const entry = normalizeWatchlistEntry({ address: '0xa', tags: ['ops', 5, null] } as never)
    expect(entry.tags).toEqual(['ops'])
  })

  it('leaves a well-formed entry alone', () => {
    const good: WatchlistEntry = { id: '1', address: '0xabc', label: 'Treasury', tags: ['ops'], addedAt: 7 }
    expect(normalizeWatchlistEntry(good)).toEqual(good)
  })
})

describe('sanitizeWatchlist', () => {
  it('drops every entry with no usable address', () => {
    expect(sanitizeWatchlist(CORRUPT)).toHaveLength(1)
    expect(sanitizeWatchlist(CORRUPT)[0].address).toBe('0xabc')
  })

  it('survives a non-array payload', () => {
    for (const bad of [null, undefined, {}, 'list', 7]) {
      expect(sanitizeWatchlist(bad)).toEqual([])
    }
  })

  it('drops non-object rows', () => {
    expect(sanitizeWatchlist(['junk', null, 5, { address: '0xa' }])).toHaveLength(1)
  })
})

describe('downstream consumers survive corrupt entries', () => {
  // Each of these threw before: "address.trim is not a function", which in
  // React meant the Watchlist and Dashboard pages white-screened.
  it('findWatchlistEntry does not throw', () => {
    for (const entry of CORRUPT) {
      expect(() => findWatchlistEntry([entry], '0xabc')).not.toThrow()
    }
    expect(() => findWatchlistEntry(CORRUPT, null as never)).not.toThrow()
  })

  it('computePortfolioRisk does not throw', () => {
    for (const entry of CORRUPT) {
      expect(() => computePortfolioRisk([entry])).not.toThrow()
    }
    expect(() => computePortfolioRisk(CORRUPT)).not.toThrow()
  })

  it('screenAddress does not throw', () => {
    for (const value of [12345, null, undefined, { a: 1 }]) {
      expect(() => screenAddress(value as never)).not.toThrow()
    }
  })

  it('still finds a real entry after sanitising', () => {
    const clean = sanitizeWatchlist(CORRUPT)
    expect(findWatchlistEntry(clean, '0xABC')?.label).toBe('42')
  })
})
