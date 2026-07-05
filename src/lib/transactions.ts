import { chains } from './constants'
import type { ChainId, MockTransaction, Severity } from './types'
import { hashText } from './utils'

const TX_TYPES: MockTransaction['type'][] = ['swap', 'transfer', 'approve', 'stake', 'bridge']

const RISK_REASONS: Record<Severity, string[]> = {
  critical: ['Sanctioned address interaction', 'Unverified contract call', 'Mixer route detected'],
  watch: ['High slippage swap', 'New token approval', 'Bridge to unknown chain'],
  healthy: [],
}

export function generateMockTransactions(address: string, chainId: ChainId, count = 10): MockTransaction[] {
  const seed = hashText(`${address}-${chainId}-txs`)
  const chain = chains.find((item) => item.id === chainId) ?? chains[0]

  return Array.from({ length: count }, (_, index) => {
    const txSeed = hashText(`${seed}-${index}`)
    const type = TX_TYPES[txSeed % TX_TYPES.length]
    const hoursAgo = index * 3 + (txSeed % 8)
    const riskRoll = txSeed % 100
    let riskFlag: Severity | null = null
    let riskReason: string | null = null

    if (riskRoll > 82) {
      riskFlag = 'critical'
      riskReason = RISK_REASONS.critical[txSeed % RISK_REASONS.critical.length]
    } else if (riskRoll > 58) {
      riskFlag = 'watch'
      riskReason = RISK_REASONS.watch[txSeed % RISK_REASONS.watch.length]
    }

    const amountBase = 50 + (txSeed % 4800)
    const amount =
      type === 'approve'
        ? 'Unlimited USDC'
        : `$${amountBase.toLocaleString()} ${chain.symbol}`

    return {
      id: `tx-${index}-${txSeed}`,
      hash: `0x${(txSeed * 7919 + index * 104729).toString(16).padStart(8, '0')}...${(txSeed % 99999).toString(16)}`,
      type,
      amount,
      counterparty: `0x${(txSeed % 0xffffff).toString(16).padStart(6, '0')}...${((txSeed >> 4) % 0xffff).toString(16)}`,
      chain: chainId,
      timestamp: Date.now() - hoursAgo * 3600000,
      riskFlag,
      riskReason,
    }
  })
}