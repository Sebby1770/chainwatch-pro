import type { ChainId } from './types'

export type VaultSortKey = 'apy' | 'tvl' | 'risk' | 'name'
export type VaultSortDir = 'asc' | 'desc'

export interface VaultItem {
  id: string
  name: string
  chain: ChainId
  chainLabel: string
  apy: number
  tvl: number
  tvlLabel: string
  risk: number
  capacity: string
  revenue: string
  status: string
  protocol: string
  auditors: string[]
  depositors: number
}

export const VAULT_CATALOG: VaultItem[] = [
  {
    id: 'stable-delta',
    name: 'Stablecoin Delta Vault',
    chain: 'base',
    chainLabel: 'Base',
    apy: 8.4,
    tvl: 8100000,
    tvlLabel: '$8.1M',
    risk: 22,
    capacity: '$8.1M',
    revenue: '$129/mo pro signal',
    status: 'Low drawdown',
    protocol: 'Aave v3',
    auditors: ['OpenZeppelin', 'Trail of Bits'],
    depositors: 412,
  },
  {
    id: 'lst-loop',
    name: 'LST Loop Monitor',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    apy: 6.9,
    tvl: 24800000,
    tvlLabel: '$24.8M',
    risk: 31,
    capacity: '$24.8M',
    revenue: '$349/mo desk plan',
    status: 'Crowded trade',
    protocol: 'Lido + Curve',
    auditors: ['Spearbit', 'Consensys Diligence'],
    depositors: 1284,
  },
  {
    id: 'perps-funding',
    name: 'Perps Funding Sweep',
    chain: 'arbitrum',
    chainLabel: 'Arbitrum',
    apy: 14.7,
    tvl: 3700000,
    tvlLabel: '$3.7M',
    risk: 57,
    capacity: '$3.7M',
    revenue: '2% success fee',
    status: 'Active watchlist',
    protocol: 'GMX v2',
    auditors: ['Sherlock'],
    depositors: 198,
  },
  {
    id: 'treasury-rebalance',
    name: 'Treasury Rebalance Bot',
    chain: 'solana',
    chainLabel: 'Solana',
    apy: 10.2,
    tvl: 5900000,
    tvlLabel: '$5.9M',
    risk: 44,
    capacity: '$5.9M',
    revenue: '$799/mo enterprise',
    status: 'API gated',
    protocol: 'Jupiter + Marinade',
    auditors: ['OtterSec'],
    depositors: 67,
  },
  {
    id: 'polygon-yield',
    name: 'Polygon Yield Optimizer',
    chain: 'polygon',
    chainLabel: 'Polygon',
    apy: 11.3,
    tvl: 4200000,
    tvlLabel: '$4.2M',
    risk: 38,
    capacity: '$4.2M',
    revenue: '$199/mo pro signal',
    status: 'Rebalancing',
    protocol: 'Balancer',
    auditors: ['Halborn'],
    depositors: 523,
  },
  {
    id: 'eth-restake',
    name: 'ETH Restake Sentinel',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    apy: 5.8,
    tvl: 31200000,
    tvlLabel: '$31.2M',
    risk: 28,
    capacity: '$31.2M',
    revenue: '$449/mo desk plan',
    status: 'Stable inflow',
    protocol: 'EigenLayer',
    auditors: ['Sigma Prime', 'OpenZeppelin'],
    depositors: 2104,
  },
]

export function filterVaults(vaults: VaultItem[], chain: ChainId | 'all'): VaultItem[] {
  if (chain === 'all') return vaults
  return vaults.filter((vault) => vault.chain === chain)
}

export function sortVaults(vaults: VaultItem[], key: VaultSortKey, dir: VaultSortDir): VaultItem[] {
  const sorted = [...vaults].sort((left, right) => {
    if (key === 'name') return left.name.localeCompare(right.name)
    return left[key] - right[key]
  })
  return dir === 'desc' ? sorted.reverse() : sorted
}

export function vaultRiskTone(risk: number) {
  if (risk >= 50) return 'critical' as const
  if (risk >= 35) return 'watch' as const
  return 'healthy' as const
}

export function vaultToApiPayload(vault: VaultItem) {
  return {
    id: vault.id,
    name: vault.name,
    chain: vault.chain,
    apy: vault.apy,
    tvl: vault.tvl,
    tvl_label: vault.tvlLabel,
    risk_score: vault.risk,
    capacity: vault.capacity,
    protocol: vault.protocol,
    auditors: vault.auditors,
    depositors: vault.depositors,
    status: vault.status,
    revenue_model: vault.revenue,
  }
}