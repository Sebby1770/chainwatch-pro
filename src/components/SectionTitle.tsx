import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  action,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  const actionIsString = typeof action === 'string'

  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">
          <Icon size={14} aria-hidden="true" />
          {eyebrow}
        </span>
        <h2>{title}</h2>
      </div>
      {action ? (
        actionIsString ? (
          <button type="button" className="icon-button small" aria-label={action} title={action}>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <div className="section-title-action">{action}</div>
        )
      ) : null}
    </div>
  )
}