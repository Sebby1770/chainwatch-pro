import { chains } from './constants'
import type { PortfolioRiskSummary, WatchlistEntry } from './types'
import { clamp, computeRiskScore } from './utils'

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: '#627eea',
  Base: '#0052ff',
  Arbitrum: '#28a0f0',
  Polygon: '#8247e5',
  Solana: '#14f195',
}

export function computePortfolioRisk(watchlist: WatchlistEntry[]): PortfolioRiskSummary {
  if (watchlist.length === 0) {
    return {
      portfolioRiskScore: 0,
      diversificationScore: 0,
      totalValue: 0,
      walletCount: 0,
      chainExposure: [],
      diversificationData: [],
    }
  }

  const walletMetrics = watchlist.map((entry, index) => {
    const chain = chains[index % chains.length]
    const metrics = computeRiskScore(entry.address, chain.baseRisk, 0)
    return {
      entry,
      chain,
      ...metrics,
    }
  })

  const totalValue = walletMetrics.reduce((sum, item) => sum + item.portfolioValue, 0)
  const weightedRisk =
    walletMetrics.reduce((sum, item) => sum + item.riskScore * item.portfolioValue, 0) /
    Math.max(totalValue, 1)
  const portfolioRiskScore = clamp(Math.round(weightedRisk), 0, 100)

  const chainTotals = new Map<string, number>()
  walletMetrics.forEach((item) => {
    const current = chainTotals.get(item.chain.name) ?? 0
    chainTotals.set(item.chain.name, current + item.portfolioValue)
  })

  const chainExposure = Array.from(chainTotals.entries()).map(([name, value]) => ({
    name,
    value: Math.round((value / Math.max(totalValue, 1)) * 100),
    color: CHAIN_COLORS[name] ?? '#94a3b8',
  }))

  const maxChainShare = Math.max(...chainExposure.map((item) => item.value), 0)
  const diversificationScore = clamp(Math.round(100 - maxChainShare * 0.85), 12, 98)

  const diversificationData = [
    { name: 'Low risk', value: walletMetrics.filter((item) => item.riskScore < 45).length },
    { name: 'Monitor', value: walletMetrics.filter((item) => item.riskScore >= 45 && item.riskScore < 70).length },
    { name: 'High risk', value: walletMetrics.filter((item) => item.riskScore >= 70).length },
  ]

  return {
    portfolioRiskScore,
    diversificationScore,
    totalValue,
    walletCount: watchlist.length,
    chainExposure,
    diversificationData,
  }
}