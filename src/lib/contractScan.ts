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

export function scanContract(address: string, chain: ChainId): ContractScanResult {
  const seed = hashText(`${address}-${chain}`)
  const auditScore = clamp(38 + (seed % 58) - (address.length % 7), 22, 96)
  const riskGrade: ContractScanResult['riskGrade'] =
    auditScore >= 85 ? 'A' : auditScore >= 70 ? 'B' : auditScore >= 55 ? 'C' : auditScore >= 40 ? 'D' : 'F'

  const vulnCount = auditScore >= 80 ? 1 : auditScore >= 60 ? 2 : auditScore >= 45 ? 3 : 4
  const vulnerabilities = Array.from({ length: vulnCount }, (_, index) => {
    const template = VULN_TEMPLATES[(seed + index * 3) % VULN_TEMPLATES.length]
    return {
      ...template,
      id: `vuln-${index + 1}`,
    }
  })

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