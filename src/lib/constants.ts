import type { Chain, RiskModeOption } from './types'
import { VAULT_CATALOG } from './vaults'

export const chains: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', baseRisk: 34, gas: '$7.42', tvl: '$61.2B' },
  { id: 'base', name: 'Base', symbol: 'BASE', baseRisk: 24, gas: '$0.31', tvl: '$9.6B' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', baseRisk: 29, gas: '$0.18', tvl: '$14.1B' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', baseRisk: 31, gas: '$0.04', tvl: '$5.4B' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', baseRisk: 38, gas: '$0.01', tvl: '$12.8B' },
]

export const riskModes: RiskModeOption[] = [
  { id: 'conservative', label: 'Conservative', delta: -7 },
  { id: 'balanced', label: 'Balanced', delta: 0 },
  { id: 'aggressive', label: 'Aggressive', delta: 9 },
]

export const vaults = VAULT_CATALOG.map((vault) => ({
  name: vault.name,
  chain: vault.chainLabel,
  apy: vault.apy,
  risk: vault.risk,
  capacity: vault.capacity,
  revenue: vault.revenue,
  status: vault.status,
}))

export const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    market: 'explorers & hobbyists',
    features: ['10 wallet scans / month', 'Basic risk score', 'Community support'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$149',
    market: 'active DeFi users',
    features: ['Unlimited scans', 'Vault scoring', 'Telegram & email alerts', 'API access (1k req/day)'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$799',
    market: 'funds and DAOs',
    features: ['Unlimited seats', 'Custom risk rules', 'Dedicated support', 'SLA & webhooks'],
    highlighted: false,
  },
]

export const LIVE_ALERT_TEMPLATES = [
  { title: 'Contract privilege changed', detail: 'vault admin role moved in the last scan window', severity: 'watch' as const },
  { title: 'Gas window opening', detail: 'median fee rated efficient for batch execution', severity: 'healthy' as const },
  { title: 'Liquidity concentration', detail: 'positions share correlated stablecoin exposure', severity: 'watch' as const },
  { title: 'Whale inflow detected', detail: 'large transfer into monitored pool', severity: 'critical' as const },
  { title: 'Slippage spike', detail: 'route impact exceeded threshold on swap', severity: 'watch' as const },
  { title: 'New contract interaction', detail: 'unverified contract called from wallet', severity: 'critical' as const },
]

export const API_ENDPOINTS = [
  {
    id: 'scan',
    method: 'POST',
    path: '/v1/scan',
    description: 'Scan a wallet address and return risk metrics',
    defaultBody: {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chain: 'base',
      mode: 'balanced',
    },
  },
  {
    id: 'vaults',
    method: 'GET',
    path: '/v1/vaults',
    description: 'List monitored vaults with APY, TVL, and risk scores',
    defaultBody: null,
  },
  {
    id: 'usage',
    method: 'GET',
    path: '/v1/usage',
    description: 'Usage analytics for API calls, scans, and alerts',
    defaultBody: null,
  },
  {
    id: 'contract-scan',
    method: 'POST',
    path: '/v1/scan/contract',
    description: 'Scan a smart contract for audit score and vulnerabilities',
    defaultBody: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chain: 'ethereum',
    },
  },
  {
    id: 'alerts',
    method: 'GET',
    path: '/v1/alerts',
    description: 'Fetch recent alert events',
    defaultBody: null,
  },
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    description: 'Service health check',
    defaultBody: null,
  },
  {
    id: 'webhooks',
    method: 'POST',
    path: '/v1/webhooks/receive',
    description: 'Receive webhook alert payloads (logs to server)',
    defaultBody: {
      event: 'risk.alert',
      severity: 'watch',
      chain: 'base',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      message: 'Slippage exceeded 2.5% on swap route',
      risk_score: 52,
    },
  },
] as const