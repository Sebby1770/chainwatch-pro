import { describe, expect, it } from 'vitest'
import { screenAddress } from './sanctions'
import { batchScanWallets } from './batchScan'

describe('sanctions and batch scan', () => {
  it('returns a deterministic screen for the same address', () => {
    const first = screenAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    const second = screenAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    expect(first).toEqual(second)
    expect(['clear', 'watch', 'hit']).toContain(first.status)
  })

  it('averages risk across unique addresses', () => {
    const summary = batchScanWallets({
      addresses: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      ],
      chain: 'base',
    })
    expect(summary.count).toBe(2)
    expect(summary.results).toHaveLength(2)
    expect(summary.averageRisk).toBeGreaterThan(0)
  })
})
