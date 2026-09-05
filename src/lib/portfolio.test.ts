import { describe, expect, it } from 'vitest'
import { computePortfolioRisk } from './portfolio'
import type { WatchlistEntry } from './types'

function entry(address: string, index: number): WatchlistEntry {
  return { id: String(index), address, label: `w${index}`, tags: [], addedAt: index }
}

describe('computePortfolioRisk', () => {
  it('is independent of watchlist ordering', () => {
    const a = entry('0xAAA', 1)
    const b = entry('0xBBB', 2)
    const c = entry('0xCCC', 3)

    const forward = computePortfolioRisk([a, b, c])
    const reversed = computePortfolioRisk([c, b, a])

    expect(reversed.portfolioRiskScore).toBe(forward.portfolioRiskScore)
    expect(reversed.totalValue).toBe(forward.totalValue)
    expect(reversed.diversificationScore).toBe(forward.diversificationScore)
    expect(sortExposure(reversed.chainExposure)).toEqual(sortExposure(forward.chainExposure))
  })

  it('keeps a wallet on the same chain when another wallet is added', () => {
    const solo = computePortfolioRisk([entry('0xAAA', 1)])
    const withNeighbour = computePortfolioRisk([entry('0xZZZ', 0), entry('0xAAA', 1)])

    const soloValue = solo.totalValue
    const combinedValue = withNeighbour.totalValue
    const neighbourOnly = computePortfolioRisk([entry('0xZZZ', 0)]).totalValue

    expect(combinedValue).toBe(soloValue + neighbourOnly)
  })

  it('returns an empty summary for an empty watchlist', () => {
    expect(computePortfolioRisk([])).toEqual({
      portfolioRiskScore: 0,
      diversificationScore: 0,
      totalValue: 0,
      walletCount: 0,
      chainExposure: [],
      diversificationData: [],
    })
  })
})

function sortExposure<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}
