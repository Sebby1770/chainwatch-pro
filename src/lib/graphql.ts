import { VAULT_CATALOG, vaultToApiPayload } from './vaults'
import { computeRiskScore, hashText, clamp } from './utils'
import type { ChainId } from './types'

export const GRAPHQL_SAMPLES = [
  {
    id: 'wallet-scan',
    label: 'Wallet risk scan',
    query: `query WalletScan($address: String!, $chain: Chain!) {
  scan(address: $address, chain: $chain, mode: balanced) {
    risk_score
    health_score
    portfolio_value
    active_positions
    wallet_age_days
  }
}`,
    variables: {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chain: 'base',
    },
  },
  {
    id: 'vault-list',
    label: 'Vault intelligence',
    query: `query VaultList($chain: Chain) {
  vaults(chain: $chain) {
    id
    name
    chain
    apy
    tvl_label
    risk_score
    protocol
    auditors
  }
}`,
    variables: {
      chain: null,
    },
  },
  {
    id: 'contract-audit',
    label: 'Contract audit',
    query: `query ContractAudit($address: String!, $chain: Chain!) {
  contractScan(address: $address, chain: $chain) {
    audit_score
    risk_grade
    compiler { version optimization runs }
    vulnerabilities { severity title detail }
  }
}`,
    variables: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chain: 'ethereum',
    },
  },
] as const

const CHAIN_BASE_RISK: Record<ChainId, number> = {
  ethereum: 34,
  base: 24,
  arbitrum: 29,
  polygon: 31,
  solana: 38,
}

export function executeMockGraphQL(query: string, variables: Record<string, unknown>) {
  const normalized = query.replace(/\s+/g, ' ').trim()

  if (normalized.includes('scan(')) {
    const address = String(variables.address ?? '0x0')
    const chain = (variables.chain ?? 'base') as ChainId
    const baseRisk = CHAIN_BASE_RISK[chain] ?? 30
    const metrics = computeRiskScore(address, baseRisk, 0)
    return {
      data: {
        scan: {
          risk_score: metrics.riskScore,
          health_score: metrics.healthScore,
          portfolio_value: metrics.portfolioValue,
          active_positions: metrics.activePositions,
          wallet_age_days: metrics.walletAge,
        },
      },
    }
  }

  if (normalized.includes('vaults(')) {
    const chain = variables.chain as ChainId | null | undefined
    const vaults = chain
      ? VAULT_CATALOG.filter((vault) => vault.chain === chain)
      : VAULT_CATALOG
    return {
      data: {
        vaults: vaults.map(vaultToApiPayload),
      },
    }
  }

  if (normalized.includes('contractScan(')) {
    const address = String(variables.address ?? '0x0')
    const chain = (variables.chain ?? 'ethereum') as ChainId
    const seed = hashText(`${address}-${chain}`)
    const auditScore = clamp(38 + (seed % 58), 22, 96)
    return {
      data: {
        contractScan: {
          audit_score: auditScore,
          risk_grade: auditScore >= 70 ? 'B' : 'C',
          compiler: {
            version: 'v0.8.20+commit.a1b79de6',
            optimization: true,
            runs: 500,
          },
          vulnerabilities: [
            { severity: 'medium', title: 'Centralized admin role', detail: 'Single EOA holds admin role.' },
            { severity: 'low', title: 'Floating pragma', detail: 'Compiler version not pinned.' },
          ],
        },
      },
    }
  }

  return {
    errors: [{ message: 'Unknown query. Try a sample query for scan, vaults, or contractScan.' }],
  }
}