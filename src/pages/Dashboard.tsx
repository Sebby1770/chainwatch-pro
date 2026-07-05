import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  CircleDollarSign,
  Database,
  Download,
  Gauge,
  Layers,
  LineChart as TrendIcon,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AddressBadge } from '../components/AddressBadge'
import { KpiCard } from '../components/KpiCard'
import { PortfolioRiskDashboard } from '../components/PortfolioRiskDashboard'
import { SectionTitle } from '../components/SectionTitle'
import { TransactionTimeline } from '../components/TransactionTimeline'
import { UsageAnalytics } from '../components/UsageAnalytics'
import { useUsageCounters } from '../hooks/useUsageCounters'
import { generateRiskReportPdf } from '../lib/pdfReport'
import { useLiveAlerts } from '../hooks/useLiveAlerts'
import { chains, riskModes } from '../lib/constants'
import type { ChainId, RiskMode } from '../lib/types'
import { clamp, computeRiskScore, formatCurrency, formatTimeAgo, scoreLabel } from '../lib/utils'

const compareSlots = [0, 1, 2] as const

export function Dashboard() {
  const [walletAddress, setWalletAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const [compareAddresses, setCompareAddresses] = useState([
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  ])
  const [activeChain, setActiveChain] = useState<ChainId>('base')
  const [riskMode, setRiskMode] = useState<RiskMode>('balanced')
  const [scanNonce, setScanNonce] = useState(0)
  const { increment } = useUsageCounters()

  const chain = chains.find((item) => item.id === activeChain) ?? chains[0]
  const mode = riskModes.find((item) => item.id === riskMode) ?? riskModes[1]
  const liveAlerts = useLiveAlerts(activeChain)

  const metrics = useMemo(
    () => computeRiskScore(walletAddress, chain.baseRisk, mode.delta, scanNonce),
    [walletAddress, chain.baseRisk, mode.delta, scanNonce],
  )

  const { riskScore, healthScore, portfolioValue, walletAge, activePositions, scanHash } = metrics
  const savedGas = 190 + (scanHash % 820)

  const riskTimeline = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = `Day ${index + 1}`
        const drift = ((scanHash >> (index % 7)) % 18) - 7
        const opportunity = clamp(72 - riskScore + drift + index * 1.2, 18, 92)
        return {
          day,
          risk: clamp(riskScore + drift + Math.sin(index) * 5, 10, 96),
          opportunity,
        }
      }),
    [riskScore, scanHash],
  )

  const exposureData = useMemo(
    () => [
      { name: 'Stablecoins', value: 28 + (scanHash % 9), color: '#14b8a6' },
      { name: 'LSTs', value: 19 + (scanHash % 13), color: '#f59e0b' },
      { name: 'Perps', value: 9 + (scanHash % 12), color: '#ef4444' },
      { name: 'NFTs', value: 4 + (scanHash % 8), color: '#38bdf8' },
      { name: 'Idle', value: 11 + (scanHash % 11), color: '#94a3b8' },
    ],
    [scanHash],
  )

  const flowData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        day: `D${index + 1}`,
        incoming: 5 + ((scanHash + index * 17) % 34),
        outgoing: 3 + ((scanHash + index * 11) % 27),
      })),
    [scanHash],
  )

  const compareResults = useMemo(
    () =>
      compareAddresses.map((address) => {
        const result = computeRiskScore(address, chain.baseRisk, mode.delta, scanNonce)
        return { address, ...result }
      }),
    [compareAddresses, chain.baseRisk, mode.delta, scanNonce],
  )

  const updateCompareAddress = (index: number, value: string) => {
    setCompareAddresses((current) => current.map((item, i) => (i === index ? value : item)))
  }

  const exportPdfReport = () => {
    generateRiskReportPdf({
      address: walletAddress,
      chain: chain.name,
      riskScore,
      healthScore,
      portfolioValue,
      activePositions,
      walletAge,
      mode: mode.label,
    })
    toast.success('PDF risk report downloaded')
  }

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="scanner-panel">
          <span className="eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            Wallet scanner
          </span>
          <h1>Multi-chain risk intelligence with live signals.</h1>
          <div className="wallet-form">
            <label htmlFor="wallet">Wallet or ENS</label>
            <div>
              <Wallet size={18} aria-hidden="true" />
              <input
                id="wallet"
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => {
                  setScanNonce((value) => value + 1)
                  increment('scans')
                }}
                aria-label="Analyze wallet"
              >
                <Search size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="segmented-control" aria-label="Chain selection">
            {chains.map((item) => (
              <button
                key={item.id}
                type="button"
                className={clsx({ active: item.id === activeChain })}
                onClick={() => setActiveChain(item.id)}
              >
                {item.name}
                <small>{item.baseRisk} base</small>
              </button>
            ))}
          </div>

          <div className="mode-row">
            {riskModes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={clsx('mode-button', { active: item.id === riskMode })}
                onClick={() => setRiskMode(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.delta > 0 ? `+${item.delta}` : item.delta}</small>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          className="hero-media compact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label="Chain metrics"
        >
          <div className="chain-metrics-grid">
            {chains.map((item) => (
              <button
                key={item.id}
                type="button"
                className={clsx('chain-metric-card', { active: item.id === activeChain })}
                onClick={() => setActiveChain(item.id)}
              >
                <strong>{item.name}</strong>
                <span>Gas {item.gas}</span>
                <span>TVL {item.tvl}</span>
                <em>Risk base {item.baseRisk}</em>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <PortfolioRiskDashboard />

      <UsageAnalytics />

      <section className="kpi-grid" aria-label="Key metrics">
        <KpiCard
          icon={Gauge}
          label="Wallet health"
          value={`${healthScore}/100`}
          detail={`${scoreLabel(riskScore)} on ${chain.symbol}`}
          tone={riskScore > 70 ? 'danger' : riskScore > 45 ? 'warn' : 'good'}
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Tracked value"
          value={formatCurrency(portfolioValue)}
          detail={`${activePositions} positions, ${walletAge.toLocaleString()} day wallet age`}
        />
        <KpiCard icon={TrendingUp} label="Gas saved" value={formatCurrency(savedGas)} detail={`${chain.gas} median execution`} tone="good" />
        <KpiCard icon={Database} label="Chain TVL" value={chain.tvl} detail="Demo market feed" />
      </section>

      <section className="compare-section panel">
        <SectionTitle icon={Wallet} eyebrow="Compare" title="Multi-wallet side-by-side (up to 3)" />
        <div className="compare-grid">
          {compareSlots.map((slot) => (
            <div key={slot} className="compare-card">
              <input
                value={compareAddresses[slot]}
                onChange={(event) => updateCompareAddress(slot, event.target.value)}
                spellCheck="false"
                aria-label={`Compare wallet ${slot + 1}`}
              />
              <AddressBadge address={compareAddresses[slot]} />
              <div className="compare-stats">
                <strong>{compareResults[slot].riskScore}/100</strong>
                <span>{formatCurrency(compareResults[slot].portfolioValue)}</span>
                <span className={clsx('status-pill', compareResults[slot].riskScore >= 70 ? 'critical' : compareResults[slot].riskScore >= 45 ? 'watch' : 'healthy')}>
                  {scoreLabel(compareResults[slot].riskScore)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel wide-panel">
          <SectionTitle
            icon={TrendIcon}
            eyebrow="Risk engine"
            title="7-day risk timeline"
            action={
              <button type="button" className="secondary-button small-btn" onClick={exportPdfReport}>
                <Download size={15} aria-hidden="true" />
                Export PDF
              </button>
            }
          />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={riskTimeline} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="opportunityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" fill="url(#riskGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="opportunity" stroke="#14b8a6" fill="url(#opportunityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={Layers} eyebrow="Exposure" title="Portfolio composition" />
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={exposureData} margin={{ top: 10, right: 4, left: -26, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {exposureData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={Activity} eyebrow="Flow" title="Transaction velocity" />
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={flowData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="incoming" stroke="#14b8a6" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="outgoing" stroke="#f59e0b" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <TransactionTimeline address={walletAddress} chain={activeChain} />

        <article className="panel live-feed-panel">
          <SectionTitle icon={AlertCircle} eyebrow="Live feed" title="Simulated WebSocket alerts (5s)" action="Review feed" />
          <div className="alert-list live-alert-list">
            <AnimatePresence initial={false}>
              {liveAlerts.map((item) => (
                <motion.div
                  key={item.id}
                  className={clsx('alert-row', item.severity)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                >
                  <span />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <small>{formatTimeAgo(item.timestamp)} · {item.chain}</small>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </article>
      </section>
    </div>
  )
}