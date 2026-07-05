import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

export function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
}) {
  return (
    <article className={clsx('kpi-card', tone)}>
      <div className="kpi-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}