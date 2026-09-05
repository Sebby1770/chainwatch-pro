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

  it('round-trips labels that contain newlines without inventing rows', () => {
    const entries: WatchlistEntry[] = [
      { id: '1', address: '0xabc', label: 'Line1\nLine2', tags: ['ops'], addedAt: 1 },
      { id: '2', address: '0xdef', label: 'Plain', tags: [], addedAt: 2 },
    ]
    const parsed = parseWatchlistCsv(serializeWatchlistCsv(entries), 100)

    expect(parsed.map((item) => item.address)).toEqual(['0xabc', '0xdef'])
    expect(parsed[0].label).toBe('Line1\nLine2')
    expect(parsed[0].tags).toEqual(['ops'])
  })

  it('round-trips embedded quotes', () => {
    const entries: WatchlistEntry[] = [
      { id: '1', address: '0xabc', label: 'The "cold" vault', tags: [], addedAt: 1 },
    ]
    const parsed = parseWatchlistCsv(serializeWatchlistCsv(entries), 100)
    expect(parsed[0].label).toBe('The "cold" vault')
  })

  it('accepts CRLF line endings', () => {
    const parsed = parseWatchlistCsv('address,label,tags\r\n0xabc,One,defi\r\n0xdef,Two,ops\r\n', 50)
    expect(parsed.map((item) => item.address)).toEqual(['0xabc', '0xdef'])
    expect(parsed[1].tags).toEqual(['ops'])
  })

  it('keeps parsing rows that have no header', () => {
    const parsed = parseWatchlistCsv('0xabc,One,defi', 50)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].label).toBe('One')
  })

  it('returns nothing for empty or header-only input', () => {
    expect(parseWatchlistCsv('', 1)).toEqual([])
    expect(parseWatchlistCsv('address,label,tags\n', 1)).toEqual([])
  })

  it('skips duplicate addresses', () => {
    const parsed = parseWatchlistCsv('0xabc,One,defi\n0xABC,Two,ops', 50)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].label).toBe('One')
  })
})
