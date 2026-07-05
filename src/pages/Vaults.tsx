import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowDownAZ, ArrowUpDown, Filter, Vault } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionTitle } from '../components/SectionTitle'
import { chains } from '../lib/constants'
import {
  VAULT_CATALOG,
  filterVaults,
  sortVaults,
  vaultRiskTone,
  type VaultSortDir,
  type VaultSortKey,
} from '../lib/vaults'
import type { ChainId } from '../lib/types'
import { scoreLabel } from '../lib/utils'

export function Vaults() {
  const [chainFilter, setChainFilter] = useState<ChainId | 'all'>('all')
  const [sortKey, setSortKey] = useState<VaultSortKey>('apy')
  const [sortDir, setSortDir] = useState<VaultSortDir>('desc')

  const vaults = useMemo(() => {
    const filtered = filterVaults(VAULT_CATALOG, chainFilter)
    return sortVaults(filtered, sortKey, sortDir)
  }, [chainFilter, sortKey, sortDir])

  const toggleSort = (key: VaultSortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'risk' ? 'asc' : 'desc')
  }

  return (
    <div className="page vaults-page">
      <section className="panel">
        <SectionTitle icon={Vault} eyebrow="DeFi" title="Vault intelligence" action={`${vaults.length} vaults`} />
        <div className="vaults-toolbar">
          <div className="vaults-filters" aria-label="Filter vaults by chain">
            <span className="toolbar-label">
              <Filter size={14} aria-hidden="true" />
              Chain
            </span>
            <button
              type="button"
              className={clsx('filter-chip', { active: chainFilter === 'all' })}
              onClick={() => setChainFilter('all')}
            >
              All
            </button>
            {chains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                className={clsx('filter-chip', { active: chainFilter === chain.id })}
                onClick={() => setChainFilter(chain.id)}
              >
                {chain.name}
              </button>
            ))}
          </div>

          <div className="vaults-sort" aria-label="Sort vaults">
            <span className="toolbar-label">
              <ArrowUpDown size={14} aria-hidden="true" />
              Sort
            </span>
            {(['apy', 'tvl', 'risk', 'name'] as VaultSortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={clsx('filter-chip', { active: sortKey === key })}
                onClick={() => toggleSort(key)}
              >
                {key.toUpperCase()}
                {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="vault-grid">
        {vaults.map((vault, index) => {
          const tone = vaultRiskTone(vault.risk)
          return (
            <motion.article
              key={vault.id}
              className="vault-card panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <span className={clsx('status-pill', tone)}>{vault.status}</span>
              <h3>{vault.name}</h3>
              <p>{vault.protocol} · {vault.chainLabel}</p>
              <dl>
                <div>
                  <dt>APY</dt>
                  <dd>{vault.apy.toFixed(1)}%</dd>
                </div>
                <div>
                  <dt>TVL</dt>
                  <dd>{vault.tvlLabel}</dd>
                </div>
                <div>
                  <dt>Risk score</dt>
                  <dd>{vault.risk}/100 · {scoreLabel(vault.risk)}</dd>
                </div>
                <div>
                  <dt>Depositors</dt>
                  <dd>{vault.depositors.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Auditors</dt>
                  <dd>{vault.auditors.join(', ')}</dd>
                </div>
                <div>
                  <dt>Revenue</dt>
                  <dd>{vault.revenue}</dd>
                </div>
              </dl>
            </motion.article>
          )
        })}
      </section>

      {vaults.length === 0 ? (
        <p className="empty-state">
          <ArrowDownAZ size={16} aria-hidden="true" /> No vaults match this filter.
        </p>
      ) : null}
    </div>
  )
}