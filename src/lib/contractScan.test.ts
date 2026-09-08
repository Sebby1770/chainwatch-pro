import { describe, expect, it } from 'vitest'
import { scanContract } from './contractScan'

const ADDRESSES = [
  '0xaaa',
  '0xbbb',
  '0xccc',
  '0xddd',
  '0xeee',
  '0xfff',
  '0x123',
  '0x456',
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
]

describe('scanContract', () => {
  it('never reports the same finding twice in one scan', () => {
    for (const address of ADDRESSES) {
      const { vulnerabilities } = scanContract(address, 'ethereum')
      const titles = vulnerabilities.map((item) => item.title)
      expect(new Set(titles).size, `duplicate finding for ${address}`).toBe(titles.length)
    }
  })

  it('gives every finding a unique id', () => {
    for (const address of ADDRESSES) {
      const ids = scanContract(address, 'ethereum').vulnerabilities.map((item) => item.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('orders findings by descending severity', () => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const
    for (const address of ADDRESSES) {
      const severities = scanContract(address, 'ethereum').vulnerabilities.map(
        (item) => rank[item.severity],
      )
      expect([...severities].sort((a, b) => a - b)).toEqual(severities)
    }
  })

  it('stays deterministic for the same address and chain', () => {
    expect(scanContract('0xaaa', 'base')).toEqual(scanContract('0xaaa', 'base'))
  })

  it('scales finding count with the audit score', () => {
    for (const address of ADDRESSES) {
      const result = scanContract(address, 'ethereum')
      const expected =
        result.auditScore >= 80 ? 1 : result.auditScore >= 60 ? 2 : result.auditScore >= 45 ? 3 : 4
      expect(result.vulnerabilities).toHaveLength(expected)
    }
  })
})
