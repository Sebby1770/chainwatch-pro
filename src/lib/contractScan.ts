import type { ChainId } from './types'
import { clamp, hashText } from './utils'

export interface ContractVulnerability {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  detail: string
  line?: number
}

export interface ContractScanResult {
  address: string
  chain: ChainId
  auditScore: number
  riskGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  compiler: {
    version: string
    optimization: boolean
    runs: number
    evmVersion: string
  }
  contractName: string
  isVerified: boolean
  proxyDetected: boolean
  vulnerabilities: ContractVulnerability[]
  scannedAt: string
}

const VULN_TEMPLATES: Omit<ContractVulnerability, 'id'>[] = [
  {
    severity: 'critical',
    title: 'Unchecked external call return value',
    detail: 'Low-level call result is not validated before state update.',
    line: 142,
  },
  {
    severity: 'high',
    title: 'Centralized admin role',
    detail: 'Single EOA holds DEFAULT_ADMIN_ROLE without timelock.',
    line: 58,
  },
  {
    severity: 'medium',
    title: 'Missing events on privileged functions',
    detail: 'Role grants and parameter updates emit no indexed events.',
    line: 201,
  },
  {
    severity: 'medium',
    title: 'Integer truncation in fee calculation',
    detail: 'Division before multiplication may undercharge fees on small amounts.',
    line: 89,
  },
  {
    severity: 'low',
    title: 'Floating pragma',
    detail: 'Contract allows any compiler version >=0.8.0.',
  },
  {
    severity: 'low',
    title: 'Unused state variable',
    detail: 'Dead storage slot increases deployment cost.',
    line: 34,
  },
]

const COMPILER_VERSIONS = ['v0.8.19+commit.7dd6d404', 'v0.8.20+commit.a1b79de6', 'v0.8.24+commit.e11b9ed9']
const CONTRACT_NAMES = ['VaultStrategy', 'TimelockController', 'RewardDistributor', 'LiquidityRouter', 'AccessManager']

const SEVERITY_RANK: Record<ContractVulnerability['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Deterministically draws `count` *distinct* findings for a seed.
 *
 * The previous implementation indexed the template list with a fixed stride
 * (`seed + index * 3` over six templates), which aliases back onto itself after
 * two steps — any scan reporting three or four findings listed the same
 * vulnerability twice under different ids. A seeded Fisher-Yates shuffle draws
 * without replacement instead, so a finding can never be double-counted.
 */
function selectVulnerabilities(seed: number, count: number): ContractVulnerability[] {
  const order = VULN_TEMPLATES.map((_, index) => index)
  let cursor = seed + 1
  for (let i = order.length - 1; i > 0; i -= 1) {
    cursor = (cursor * 1103515245 + 12345) % 2147483648
    const j = cursor % (i + 1)
    const swap = order[i]
    order[i] = order[j]
    order[j] = swap
  }

  return order
    .slice(0, Math.min(count, VULN_TEMPLATES.length))
    .map((index) => VULN_TEMPLATES[index])
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .map((template, index) => ({ ...template, id: `vuln-${index + 1}` }))
}

export function scanContract(address: string, chain: ChainId): ContractScanResult {
  const seed = hashText(`${address}-${chain}`)
  const auditScore = clamp(38 + (seed % 58) - (address.length % 7), 22, 96)
  const riskGrade: ContractScanResult['riskGrade'] =
    auditScore >= 85 ? 'A' : auditScore >= 70 ? 'B' : auditScore >= 55 ? 'C' : auditScore >= 40 ? 'D' : 'F'

  const vulnCount = auditScore >= 80 ? 1 : auditScore >= 60 ? 2 : auditScore >= 45 ? 3 : 4
  const vulnerabilities = selectVulnerabilities(seed, vulnCount)

  return {
    address,
    chain,
    auditScore,
    riskGrade,
    compiler: {
      version: COMPILER_VERSIONS[seed % COMPILER_VERSIONS.length],
      optimization: seed % 3 !== 0,
      runs: 200 + (seed % 800),
      evmVersion: seed % 2 === 0 ? 'paris' : 'shanghai',
    },
    contractName: CONTRACT_NAMES[seed % CONTRACT_NAMES.length],
    isVerified: seed % 5 !== 0,
    proxyDetected: seed % 4 === 0,
    vulnerabilities,
    scannedAt: new Date().toISOString(),
  }
}