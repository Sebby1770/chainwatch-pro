import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Plus, Search, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { chains } from '../lib/constants'
import type { WatchlistEntry } from '../lib/types'
import { computeRiskScore, scoreLabel } from '../lib/utils'

const DEFAULT_WATCHLIST: WatchlistEntry[] = [
  {
    id: '1',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    label: 'Demo vault',
    addedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    label: 'Treasury',
    addedAt: Date.now() - 172800000,
  },
]

export function Watchlist() {
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistEntry[]>('chainwatch-watchlist', DEFAULT_WATCHLIST)
  const [newAddress, setNewAddress] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const addWallet = () => {
    const trimmed = newAddress.trim()
    if (!trimmed) {
      toast.error('Enter a wallet address')
      return
    }
    if (watchlist.some((entry) => entry.address.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Address already on watchlist')
      return
    }

    const entry: WatchlistEntry = {
      id: crypto.randomUUID(),
      address: trimmed,
      label: newLabel.trim() || `Wallet ${watchlist.length + 1}`,
      addedAt: Date.now(),
    }

    setWatchlist((current) => [entry, ...current])
    setNewAddress('')
    setNewLabel('')
    toast.success('Wallet added to watchlist')
  }

  const removeWallet = (id: string) => {
    setWatchlist((current) => current.filter((entry) => entry.id !== id))
    toast.success('Removed from watchlist')
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
          <button type="button" className="primary-button" onClick={addWallet}>
            <Plus size={17} aria-hidden="true" />
            Add
          </button>
        </div>
      </section>

      <section className="watchlist-grid">
        {watchlist.map((entry, index) => {
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

      {watchlist.length === 0 ? (
        <p className="empty-state">No wallets on your watchlist yet. Add an address above.</p>
      ) : null}
    </div>
  )
}