import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { chains } from '../lib/constants'
import type { AlertHistoryItem, AlertRule, AlertType, ChainId } from '../lib/types'
import { formatTimeAgo, hashText } from '../lib/utils'

const DEFAULT_RULES: AlertRule[] = [
  {
    id: '1',
    name: 'Slippage guard',
    chain: 'base',
    type: 'slippage',
    threshold: 2.5,
    enabled: true,
  },
  {
    id: '2',
    name: 'Contract watcher',
    chain: 'ethereum',
    type: 'contract',
    threshold: 1,
    enabled: true,
  },
]

const alertTypes: AlertType[] = ['slippage', 'contract', 'whale']

function generateHistory(rules: AlertRule[]): AlertHistoryItem[] {
  return rules.flatMap((rule, index) => {
    const seed = hashText(`${rule.id}-${rule.chain}-${rule.type}`)
    const severities = ['healthy', 'watch', 'critical'] as const
    return Array.from({ length: 2 }, (_, i) => ({
      id: `${rule.id}-hist-${i}`,
      ruleName: rule.name,
      message: `${rule.type} threshold ${rule.threshold}${rule.type === 'slippage' ? '%' : ''} on ${rule.chain}`,
      severity: severities[(seed + i + index) % 3],
      chain: rule.chain,
      timestamp: Date.now() - (index * 3600000 + i * 900000),
    }))
  })
}

export function Alerts() {
  const [rules, setRules] = useLocalStorage<AlertRule[]>('chainwatch-alert-rules', DEFAULT_RULES)
  const [draft, setDraft] = useState({
    name: '',
    chain: 'base' as ChainId,
    type: 'slippage' as AlertType,
    threshold: 2,
  })

  const history = useMemo(() => generateHistory(rules), [rules])

  const addRule = () => {
    if (!draft.name.trim()) {
      toast.error('Rule name is required')
      return
    }

    const rule: AlertRule = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      chain: draft.chain,
      type: draft.type,
      threshold: draft.threshold,
      enabled: true,
    }

    setRules((current) => [rule, ...current])
    setDraft({ name: '', chain: 'base', type: 'slippage', threshold: 2 })
    toast.success('Alert rule created')
  }

  const toggleRule = (id: string) => {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    )
  }

  const removeRule = (id: string) => {
    setRules((current) => current.filter((rule) => rule.id !== id))
    toast.success('Rule removed')
  }

  return (
    <div className="page alerts-page">
      <section className="panel">
        <SectionTitle icon={Bell} eyebrow="Rules" title="Alert rule builder" />
        <div className="rule-builder">
          <label>
            <span>Name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="My alert rule"
            />
          </label>
          <label>
            <span>Chain</span>
            <select
              value={draft.chain}
              onChange={(event) => setDraft((current) => ({ ...current, chain: event.target.value as ChainId }))}
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select
              value={draft.type}
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as AlertType }))}
            >
              {alertTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Threshold</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.threshold}
              onChange={(event) => setDraft((current) => ({ ...current, threshold: Number(event.target.value) }))}
            />
          </label>
          <button type="button" className="primary-button" onClick={addRule}>
            <Plus size={17} aria-hidden="true" />
            Add rule
          </button>
        </div>
      </section>

      <section className="alerts-layout">
        <article className="panel">
          <SectionTitle icon={Bell} eyebrow="Active" title="Configured rules" />
          <div className="rule-list">
            {rules.map((rule) => (
              <div key={rule.id} className="rule-row">
                <div>
                  <strong>{rule.name}</strong>
                  <p>
                    {rule.type} · {rule.chain} · threshold {rule.threshold}
                    {rule.type === 'slippage' ? '%' : ''}
                  </p>
                </div>
                <div className="rule-actions">
                  <label className="toggle-inline">
                    <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                    <span>{rule.enabled ? 'On' : 'Off'}</span>
                  </label>
                  <button type="button" className="icon-button" onClick={() => removeRule(rule.id)} aria-label="Delete rule">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={Bell} eyebrow="History" title="Simulated alert history" />
          <div className="alert-list history-list">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                className={clsx('alert-row', item.severity)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <span />
                <div>
                  <strong>{item.ruleName}</strong>
                  <p>{item.message}</p>
                  <small>{formatTimeAgo(item.timestamp)} · {item.chain}</small>
                </div>
              </motion.div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}