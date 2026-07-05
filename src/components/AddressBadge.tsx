import clsx from 'clsx'
import { Tag } from 'lucide-react'
import { useWatchlistLabels } from '../hooks/useWatchlistLabels'

export function AddressBadge({ address, showAddress = true }: { address: string; showAddress?: boolean }) {
  const { resolveAddress } = useWatchlistLabels()
  const entry = resolveAddress(address)

  if (!entry) {
    return showAddress ? (
      <code className="address-code">{address.slice(0, 10)}...{address.slice(-6)}</code>
    ) : null
  }

  return (
    <div className="address-badge">
      <strong>{entry.label}</strong>
      {showAddress ? (
        <code className="address-code">{address.slice(0, 10)}...{address.slice(-6)}</code>
      ) : null}
      {entry.tags.length > 0 ? (
        <div className="address-tags" aria-label="Wallet tags">
          {entry.tags.map((tag) => (
            <span key={tag} className="address-tag">
              <Tag size={10} aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AddressTagList({ address }: { address: string }) {
  const { resolveAddress } = useWatchlistLabels()
  const entry = resolveAddress(address)
  if (!entry?.tags.length) return null

  return (
    <div className={clsx('address-tags', 'inline')}>
      {entry.tags.map((tag) => (
        <span key={tag} className="address-tag">
          {tag}
        </span>
      ))}
    </div>
  )
}