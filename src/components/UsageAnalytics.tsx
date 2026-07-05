import { BarChart3, Bell, Radar, Terminal } from 'lucide-react'
import { useUsageCounters } from '../hooks/useUsageCounters'
import { SectionTitle } from './SectionTitle'

export function UsageAnalytics() {
  const { counters, reset } = useUsageCounters()

  const stats = [
    { label: 'API calls', value: counters.apiCalls, icon: Terminal, detail: 'Playground & GraphQL' },
    { label: 'Wallet scans', value: counters.scans, icon: Radar, detail: 'Dashboard scans' },
    { label: 'Contract scans', value: counters.contractScans, icon: BarChart3, detail: 'Scanner page' },
    { label: 'Alerts sent', value: counters.alertsSent, icon: Bell, detail: 'Rules & webhooks' },
  ]

  return (
    <section className="panel usage-analytics-panel">
      <SectionTitle
        icon={BarChart3}
        eyebrow="Analytics"
        title="Usage analytics (local)"
        action={
          <button type="button" className="secondary-button small-btn" onClick={reset}>
            Reset counters
          </button>
        }
      />
      <p className="usage-analytics-intro">
        Simulated usage metrics stored in localStorage. Counters increment as you scan wallets, run API requests, and trigger alerts.
      </p>
      <div className="usage-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="usage-stat-card">
            <stat.icon size={18} aria-hidden="true" />
            <span>{stat.label}</span>
            <strong>{stat.value.toLocaleString()}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>
    </section>
  )
}