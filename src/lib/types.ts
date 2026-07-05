export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'solana'
export type RiskMode = 'conservative' | 'balanced' | 'aggressive'
export type AlertType = 'slippage' | 'contract' | 'whale'
export type Severity = 'healthy' | 'watch' | 'critical'

export interface Chain {
  id: ChainId
  name: string
  symbol: string
  baseRisk: number
  gas: string
  tvl: string
}

export interface RiskModeOption {
  id: RiskMode
  label: string
  delta: number
}

export interface LiveAlert {
  id: string
  title: string
  detail: string
  severity: Severity
  chain: string
  timestamp: number
}

export interface WatchlistEntry {
  id: string
  address: string
  label: string
  addedAt: number
}

export interface AlertRule {
  id: string
  name: string
  chain: ChainId
  type: AlertType
  threshold: number
  enabled: boolean
}

export interface AlertHistoryItem {
  id: string
  ruleName: string
  message: string
  severity: Severity
  chain: string
  timestamp: number
}

export interface ScanResult {
  address: string
  chain: ChainId
  riskScore: number
  healthScore: number
  portfolioValue: number
  activePositions: number
  walletAge: number
}