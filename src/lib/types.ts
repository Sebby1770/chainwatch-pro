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

export type ThemeMode = 'light' | 'dark'

export interface AppSettings {
  apiKey: string
  theme: ThemeMode
  notifications: {
    email: boolean
    telegram: boolean
    slack: boolean
    criticalOnly: boolean
  }
  webhookUrl: string
}

export interface WebhookDeliveryLog {
  id: string
  payload: Record<string, unknown>
  status: 'delivered' | 'failed' | 'pending'
  responseCode: number | null
  timestamp: number
  endpoint: string
}

export interface MockTransaction {
  id: string
  hash: string
  type: 'swap' | 'transfer' | 'approve' | 'stake' | 'bridge'
  amount: string
  counterparty: string
  chain: ChainId
  timestamp: number
  riskFlag: Severity | null
  riskReason: string | null
}

export interface PortfolioRiskSummary {
  portfolioRiskScore: number
  diversificationScore: number
  totalValue: number
  walletCount: number
  chainExposure: { name: string; value: number; color: string }[]
  diversificationData: { name: string; value: number }[]
}

export interface ComplianceSummary {
  address: string
  chain: ChainId
  generatedAt: number
  overallStatus: 'compliant' | 'review' | 'flagged'
  riskScore: number
  checks: {
    id: string
    label: string
    status: 'pass' | 'warn' | 'fail'
    detail: string
  }[]
  sanctionsScreening: string
  travelRuleStatus: string
  lastAuditDate: string
}