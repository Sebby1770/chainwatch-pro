import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Plus, Search, Tag, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { chains } from '../lib/constants'
import { DEFAULT_WATCHLIST, normalizeWatchlistEntry } from '../lib/watchlist'
import type { WatchlistEntry } from '../lib/types'
import { computeRiskScore, scoreLabel } from '../lib/utils'

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6)
}

export function Watchlist() {
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistEntry[]>('chainwatch-watchlist', DEFAULT_WATCHLIST)
  const [newAddress, setNewAddress] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newTags, setNewTags] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTags, setEditTags] = useState('')

  const normalizedWatchlist = watchlist.map(normalizeWatchlistEntry)

  const addWallet = () => {
    const trimmed = newAddress.trim()
    if (!trimmed) {
      toast.error('Enter a wallet address')
      return
    }
    if (normalizedWatchlist.some((entry) => entry.address.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Address already on watchlist')
      return
    }

    const entry: WatchlistEntry = {
      id: crypto.randomUUID(),
      address: trimmed,
      label: newLabel.trim() || `Wallet ${normalizedWatchlist.length + 1}`,
      tags: parseTags(newTags),
      addedAt: Date.now(),
    }

    setWatchlist((current) => [entry, ...current.map(normalizeWatchlistEntry)])
    setNewAddress('')
    setNewLabel('')
    setNewTags('')
    toast.success('Wallet added to watchlist')
  }

  const removeWallet = (id: string) => {
    setWatchlist((current) => current.filter((entry) => entry.id !== id))
    toast.success('Removed from watchlist')
  }

  const saveTags = (id: string) => {
    setWatchlist((current) =>
      current.map((entry) =>
        entry.id === id ? { ...normalizeWatchlistEntry(entry), tags: parseTags(editTags) } : normalizeWatchlistEntry(entry),
      ),
    )
    setEditingId(null)
    toast.success('Tags updated')
  }

  const quickScan = (address: string) => {
    navigate(`/dashboard?wallet=${encodeURIComponent(address)}`)
    toast.info('Opening dashboard scan')
  }

  return (
    <div className="page watchlist-page">
      <section className="panel">
        <SectionTitle icon={Wallet} eyebrow="Watchlist" title="Tracked wallets" action="Add wallet" />
        <div className="watchlist-form">
          <input
            value={newAddress}
            onChange={(event) => setNewAddress(event.target.value)}
            placeholder="0x..."
            spellCheck="false"
            aria-label="Wallet address"
          />
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Label (optional)"
            aria-label="Wallet label"
          />
          <input
            value={newTags}
            onChange={(event) => setNewTags(event.target.value)}
            placeholder="Tags (comma-separated)"
            aria-label="Wallet tags"
          />
          <button type="button" className="primary-button" onClick={addWallet}>
            <Plus size={17} aria-hidden="true" />
            Add
          </button>
        </div>
      </section>

      <section className="watchlist-grid">
        {normalizedWatchlist.map((entry, index) => {
          const chain = chains[index % chains.length]
          const { riskScore } = computeRiskScore(entry.address, chain.baseRisk, 0)
          const tone = riskScore >= 70 ? 'critical' : riskScore >= 45 ? 'watch' : 'healthy'

          return (
            <motion.article
              key={entry.id}
              className="watchlist-card panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="watchlist-card-header">
                <div>
                  <h3>{entry.label}</h3>
                  <code>{entry.address.slice(0, 10)}...{entry.address.slice(-6)}</code>
                </div>
                <span className={clsx('status-pill', tone)}>{scoreLabel(riskScore)}</span>
              </div>

              <div className="watchlist-tags-row">
                {entry.tags.length > 0 ? (
                  <div className="address-tags">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="address-tag">
                        <Tag size={10} aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="muted-text">No tags</span>
                )}
                {editingId === entry.id ? (
                  <div className="tag-edit-row">
                    <input
                      value={editTags}
                      onChange={(event) => setEditTags(event.target.value)}
                      placeholder="defi, treasury, ops"
                      aria-label={`Edit tags for ${entry.label}`}
                    />
                    <button type="button" className="secondary-button small-btn" onClick={() => saveTags(entry.id)}>
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="secondary-button small-btn"
                    onClick={() => {
                      setEditingId(entry.id)
                      setEditTags(entry.tags.join(', '))
                    }}
                  >
                    Edit tags
                  </button>
                )}
              </div>

              <div className="watchlist-card-body">
                <strong>{riskScore}/100</strong>
                <span>{chain.name} risk</span>
              </div>
              <div className="watchlist-card-actions">
                <button type="button" className="secondary-button" onClick={() => quickScan(entry.address)}>
                  <Search size={16} aria-hidden="true" />
                  Quick scan
                </button>
                <button type="button" className="icon-button" onClick={() => removeWallet(entry.id)} aria-label="Remove wallet">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          )
        })}
      </section>

      {normalizedWatchlist.length === 0 ? (
        <p className="empty-state">No wallets on your watchlist yet. Add an address above.</p>
      ) : null}
    </div>
  )
}