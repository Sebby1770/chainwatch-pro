import clsx from 'clsx'
import { ArrowLeftRight, Clock } from 'lucide-react'
import { useMemo } from 'react'
import { generateMockTransactions } from '../lib/transactions'
import type { ChainId } from '../lib/types'
import { formatTimeAgo } from '../lib/utils'
import { SectionTitle } from './SectionTitle'

interface TransactionTimelineProps {
  address: string
  chain: ChainId
}

const TYPE_LABELS: Record<string, string> = {
  swap: 'Swap',
  transfer: 'Transfer',
  approve: 'Approve',
  stake: 'Stake',
  bridge: 'Bridge',
}

export function TransactionTimeline({ address, chain }: TransactionTimelineProps) {
  const transactions = useMemo(() => generateMockTransactions(address, chain, 10), [address, chain])

  return (
    <article className="panel transaction-timeline-panel">
      <SectionTitle icon={Clock} eyebrow="Activity" title="Transaction timeline" action="Last 10 txs" />

      <div className="transaction-list">
        {transactions.map((tx) => (
          <div key={tx.id} className={clsx('transaction-row', tx.riskFlag ?? 'healthy')}>
            <div className="transaction-icon">
              <ArrowLeftRight size={14} aria-hidden="true" />
            </div>
            <div className="transaction-body">
              <div className="transaction-header">
                <strong>{TYPE_LABELS[tx.type]}</strong>
                <span>{tx.amount}</span>
              </div>
              <p>
                <code>{tx.hash}</code> → <code>{tx.counterparty}</code>
              </p>
              <small>{formatTimeAgo(tx.timestamp)} · {tx.chain}</small>
              {tx.riskFlag && tx.riskReason ? (
                <span className={clsx('status-pill', tx.riskFlag)}>{tx.riskReason}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}