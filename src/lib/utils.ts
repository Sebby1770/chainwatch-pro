import type { Severity } from './types'

export function hashText(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 1000003, 17)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function riskTone(score: number): Severity {
  if (score >= 70) return 'critical'
  if (score >= 45) return 'watch'
  return 'healthy'
}

export function scoreLabel(score: number) {
  if (score >= 70) return 'High risk'
  if (score >= 45) return 'Monitor'
  return 'Healthy'
}

export function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function computeRiskScore(
  address: string,
  chainBaseRisk: number,
  modeDelta: number,
  nonce = 0,
) {
  const scanHash = hashText(`${address}-${chainBaseRisk}-${modeDelta}-${nonce}`)
  const rawRiskScore = chainBaseRisk + modeDelta + (scanHash % 43) - 13
  const riskScore = clamp(Math.round(rawRiskScore), 12, 94)
  const healthScore = clamp(105 - riskScore + (scanHash % 9) - 4, 8, 99)
  const portfolioValue = 18000 + (scanHash % 420000)
  const walletAge = 80 + (scanHash % 1320)
  const activePositions = 5 + (scanHash % 18)

  return {
    scanHash,
    riskScore,
    healthScore,
    portfolioValue,
    walletAge,
    activePositions,
  }
}