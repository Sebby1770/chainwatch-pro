import { describe, expect, it } from 'vitest'
import { importWatchlistCsv, parseWatchlistCsv, serializeWatchlistCsv } from './watchlistCsv'
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

describe('importWatchlistCsv', () => {
  const VALID = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
  const OTHER = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'

  it('reports each rejected row with a reason and a row number', () => {
    const csv = [
      'address,label,tags',
      `${VALID},Good,ops`,
      'hello world,Junk,',
      '0x1234,Short,',
      `${OTHER},Also good,`,
    ].join('\n')

    const report = importWatchlistCsv(csv, { now: 1000 })

    expect(report.entries.map((entry) => entry.address)).toEqual([VALID, OTHER])
    expect(report.rejected).toHaveLength(2)
    expect(report.rejected[0].row).toBe(3)
    expect(report.rejected[0].value).toBe('hello world')
    expect(report.rejected[0].reason).toMatch(/recognised/i)
    expect(report.rejected[1].row).toBe(4)
    expect(report.rejected[1].reason).toMatch(/40 hex/i)
  })

  it('stores the checksummed form of a lowercase address', () => {
    const report = importWatchlistCsv(`address,label,tags\n${VALID.toLowerCase()},Lower,`, {
      now: 1,
    })
    expect(report.entries[0].address).toBe(VALID)
  })

  it('rejects an address whose EIP-55 checksum does not match', () => {
    const broken = `0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed`
    const report = importWatchlistCsv(`address,label,tags\n${broken},Typo,`, { now: 1 })
    expect(report.entries).toHaveLength(0)
    expect(report.rejected[0].reason).toMatch(/checksum/i)
  })

  it('counts rows already on the watchlist as duplicates, not rejections', () => {
    const report = importWatchlistCsv(`address,label,tags\n${VALID},Dupe,`, {
      now: 1,
      existing: [VALID.toLowerCase()],
    })
    expect(report.entries).toHaveLength(0)
    expect(report.duplicates).toBe(1)
    expect(report.rejected).toHaveLength(0)
  })

  it('deduplicates within the file regardless of checksum casing', () => {
    const csv = `address,label,tags\n${VALID},One,\n${VALID.toLowerCase()},Two,`
    const report = importWatchlistCsv(csv, { now: 1 })
    expect(report.entries).toHaveLength(1)
    expect(report.duplicates).toBe(1)
  })

  it('numbers rows correctly when the file has no header', () => {
    const report = importWatchlistCsv(`hello,Junk,\n${VALID},Good,`, { now: 1 })
    expect(report.rejected[0].row).toBe(1)
    expect(report.entries).toHaveLength(1)
  })

  it('handles an empty file', () => {
    expect(importWatchlistCsv('', { now: 1 })).toEqual({
      entries: [],
      rejected: [],
      duplicates: 0,
    })
  })
})
