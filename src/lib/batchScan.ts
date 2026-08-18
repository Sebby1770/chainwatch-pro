import { chains } from './constants'
import type { ChainId, RiskMode, ScanResult } from './types'
import { computeRiskScore } from './utils'

export interface BatchScanRequest {
  addresses: string[]
  chain?: ChainId
  mode?: RiskMode
}

export interface BatchScanSummary {
  count: number
  averageRisk: number
  results: ScanResult[]
}

export function batchScanWallets(request: BatchScanRequest): BatchScanSummary {
  const unique = [...new Set(request.addresses.map((address) => address.trim()).filter(Boolean))]
  const chain = request.chain ?? 'ethereum'
  const mode = request.mode ?? 'balanced'
  const chainBase = chains.find((item) => item.id === chain)?.baseRisk ?? 34
  const modeDelta = mode === 'conservative' ? -7 : mode === 'aggressive' ? 9 : 0

  const results = unique.map((address) => {
    const scored = computeRiskScore(address, chainBase, modeDelta)
    return {
      address,
      chain,
      riskScore: scored.riskScore,
      healthScore: scored.healthScore,
      portfolioValue: scored.portfolioValue,
      activePositions: scored.activePositions,
      walletAge: scored.walletAge,
    }
  })

  const averageRisk =
    results.length === 0
      ? 0
      : Math.round(results.reduce((sum, item) => sum + item.riskScore, 0) / results.length)

  return { count: results.length, averageRisk, results }
}
