import { describe, expect, it } from 'vitest'
import { parseWatchlistCsv, serializeWatchlistCsv } from './watchlistCsv'
import type { WatchlistEntry } from './types'

const sample: WatchlistEntry[] = [
  {
    id: '1',
    address: '0xabc',
    label: 'Treasury, ops',
    tags: ['ops', 'multisig'],
    addedAt: 1,
  },
]

describe('watchlist csv', () => {
  it('round-trips labels that contain commas', () => {
    const csv = serializeWatchlistCsv(sample)
    expect(csv).toContain('"Treasury, ops"')
    const parsed = parseWatchlistCsv(csv, 100)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].address).toBe('0xabc')
    expect(parsed[0].label).toBe('Treasury, ops')
    expect(parsed[0].tags).toEqual(['ops', 'multisig'])
  })

  it('skips duplicate addresses', () => {
    const parsed = parseWatchlistCsv('0xabc,One,defi\n0xABC,Two,ops', 50)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].label).toBe('One')
  })
})
