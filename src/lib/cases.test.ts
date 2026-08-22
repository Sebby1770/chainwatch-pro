import { describe, expect, it } from 'vitest'
import {
  addAddressToCase,
  addNoteToCase,
  caseToMarkdown,
  createCase,
  removeAddressFromCase,
  setCasePriority,
  setCaseStatus,
  sortCases,
  summarizeCaseRisk,
} from './cases'

const T0 = 1_766_000_000_000

describe('investigation cases', () => {
  it('creates a case with defaults', () => {
    const item = createCase('  Mixer inflow probe ', { now: T0 })
    expect(item.title).toBe('Mixer inflow probe')
    expect(item.status).toBe('open')
    expect(item.priority).toBe('medium')
    expect(item.addresses).toHaveLength(0)
    expect(item.notes).toHaveLength(0)
    expect(item.createdAt).toBe(T0)
  })

  it('rejects empty titles', () => {
    expect(() => createCase('   ')).toThrow(/title/i)
  })

  it('adds addresses once per chain and bumps updatedAt', () => {
    let item = createCase('Case', { now: T0 })
    item = addAddressToCase(item, '0xABC0000000000000000000000000000000000001', 'ethereum', T0 + 1000)
    item = addAddressToCase(item, '0xabc0000000000000000000000000000000000001', 'ethereum', T0 + 2000)
    expect(item.addresses).toHaveLength(1)
    expect(item.updatedAt).toBe(T0 + 1000)

    // same address on a different chain is a separate lead
    item = addAddressToCase(item, '0xabc0000000000000000000000000000000000001', 'base', T0 + 3000)
    expect(item.addresses).toHaveLength(2)
  })

  it('removes addresses', () => {
    let item = createCase('Case', { now: T0 })
    item = addAddressToCase(item, '0xabc0000000000000000000000000000000000001', 'ethereum', T0 + 1000)
    item = removeAddressFromCase(item, '0xABC0000000000000000000000000000000000001', 'ethereum')
    expect(item.addresses).toHaveLength(0)
  })

  it('prepends notes and ignores blank ones', () => {
    let item = createCase('Case', { now: T0 })
    item = addNoteToCase(item, 'first', T0 + 1000)
    item = addNoteToCase(item, 'second', T0 + 2000)
    item = addNoteToCase(item, '   ', T0 + 3000)
    expect(item.notes.map((note) => note.text)).toEqual(['second', 'first'])
    expect(item.updatedAt).toBe(T0 + 2000)
  })

  it('transitions status and priority without touching identical values', () => {
    const item = createCase('Case', { now: T0 })
    const investigating = setCaseStatus(item, 'investigating', T0 + 1000)
    expect(investigating.status).toBe('investigating')
    expect(setCaseStatus(investigating, 'investigating')).toBe(investigating)

    const high = setCasePriority(item, 'high', T0 + 1000)
    expect(high.priority).toBe('high')
    expect(setCasePriority(high, 'high')).toBe(high)
  })

  it('summarizes risk deterministically across attached addresses', () => {
    let item = createCase('Case', { now: T0 })
    item = addAddressToCase(item, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ethereum', T0)
    item = addAddressToCase(item, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'ethereum', T0)

    const rollup = summarizeCaseRisk(item)
    expect(rollup.addressCount).toBe(2)
    expect(rollup.highestRisk).toBeGreaterThan(0)
    expect(summarizeCaseRisk(item)).toEqual(rollup)
  })

  it('exports a markdown report with metadata, addresses, and notes', () => {
    let item = createCase('Bridge drain', { summary: 'Funds hopping chains.', now: T0 })
    item = addAddressToCase(item, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ethereum', T0 + 1000)
    item = addNoteToCase(item, 'Counterparty overlaps with case 12.', T0 + 2000)

    const markdown = caseToMarkdown(item, T0 + 5000)
    expect(markdown).toContain('# Investigation: Bridge drain')
    expect(markdown).toContain('Funds hopping chains.')
    expect(markdown).toContain('| Address | Chain | Risk | Sanctions |')
    expect(markdown).toContain('0xf39F')
    expect(markdown).toContain('Counterparty overlaps with case 12.')
    expect(markdown).toContain('- **Status:** open')
  })

  it('sorts by status, then priority, then recency', () => {
    const open = setCasePriority(createCase('open-low', { now: T0 }), 'low', T0)
    const openHigh = setCasePriority(createCase('open-high', { now: T0 + 1 }), 'high', T0 + 1)
    const resolved = setCaseStatus(createCase('resolved', { now: T0 + 2 }), 'resolved', T0 + 2)
    const investigating = createCase('investigating', { now: T0 + 3 })
    const inv = setCaseStatus(investigating, 'investigating', T0 + 3)

    const sorted = sortCases([resolved, open, inv, openHigh]).map((item) => item.title)
    expect(sorted).toEqual(['open-high', 'open-low', 'investigating', 'resolved'])
  })
})
