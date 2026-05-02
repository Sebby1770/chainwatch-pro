import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Database,
  Gauge,
  Globe2,
  Layers,
  LineChart as TrendIcon,
  LockKeyhole,
  Menu,
  RefreshCcw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'solana'
type RiskMode = 'conservative' | 'balanced' | 'aggressive'
type AlertKey = 'slippage' | 'contract' | 'whale'

const chains: Array<{
  id: ChainId
  name: string
  symbol: string
  baseRisk: number
  gas: string
  tvl: string
}> = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', baseRisk: 34, gas: '$7.42', tvl: '$61.2B' },
  { id: 'base', name: 'Base', symbol: 'BASE', baseRisk: 24, gas: '$0.31', tvl: '$9.6B' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', baseRisk: 29, gas: '$0.18', tvl: '$14.1B' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', baseRisk: 31, gas: '$0.04', tvl: '$5.4B' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', baseRisk: 38, gas: '$0.01', tvl: '$12.8B' },
]

const riskModes: Array<{ id: RiskMode; label: string; delta: number }> = [
  { id: 'conservative', label: 'Conservative', delta: -7 },
  { id: 'balanced', label: 'Balanced', delta: 0 },
  { id: 'aggressive', label: 'Aggressive', delta: 9 },
]

const vaults = [
  {
    name: 'Stablecoin Delta Vault',
    chain: 'Base',
    apy: 8.4,
    risk: 22,
    capacity: '$8.1M',
    revenue: '$129/mo pro signal',
    status: 'Low drawdown',
  },
  {
    name: 'LST Loop Monitor',
    chain: 'Ethereum',
    apy: 6.9,
    risk: 31,
    capacity: '$24.8M',
    revenue: '$349/mo desk plan',
    status: 'Crowded trade',
  },
  {
    name: 'Perps Funding Sweep',
    chain: 'Arbitrum',
    apy: 14.7,
    risk: 57,
    capacity: '$3.7M',
    revenue: '2 percent success fee',
    status: 'Active watchlist',
  },
  {
    name: 'Treasury Rebalance Bot',
    chain: 'Solana',
    apy: 10.2,
    risk: 44,
    capacity: '$5.9M',
    revenue: '$799/mo enterprise',
    status: 'API gated',
  },
]

const pricingPlans = [
  {
    name: 'Scout',
    price: '$29',
    market: 'solo wallets',
    features: ['5 wallet scans', 'Gas timing feed', 'Weekly risk report'],
  },
  {
    name: 'Operator',
    price: '$149',
    market: 'active DeFi users',
    features: ['75 wallet scans', 'Vault scoring', 'Telegram alerts'],
  },
  {
    name: 'Desk',
    price: '$799',
    market: 'funds and DAOs',
    features: ['Unlimited seats', 'API access', 'Custom risk rules'],
  },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function hashText(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 1000003, 17)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function riskTone(score: number) {
  if (score >= 70) return 'critical'
  if (score >= 45) return 'watch'
  return 'healthy'
}

function scoreLabel(score: number) {
  if (score >= 70) return 'High risk'
  if (score >= 45) return 'Monitor'
  return 'Healthy'
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  icon: typeof Activity
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

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  action,
}: {
  icon: typeof Activity
  eyebrow: string
  title: string
  action?: string
}) {
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
        <button type="button" className="icon-button small" aria-label={action} title={action}>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function App() {
  const [walletAddress, setWalletAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const [activeChain, setActiveChain] = useState<ChainId>('base')
  const [riskMode, setRiskMode] = useState<RiskMode>('balanced')
  const [scanNonce, setScanNonce] = useState(0)
  const [subscriberCount, setSubscriberCount] = useState(420)
  const [monthlyPrice, setMonthlyPrice] = useState(149)
  const [infraCost, setInfraCost] = useState(2800)
  const [alerts, setAlerts] = useState<Record<AlertKey, boolean>>({
    slippage: true,
    contract: true,
    whale: false,
  })
  const [copied, setCopied] = useState(false)

  const chain = chains.find((item) => item.id === activeChain) ?? chains[0]
  const mode = riskModes.find((item) => item.id === riskMode) ?? riskModes[1]
  const scanHash = useMemo(
    () => hashText(`${walletAddress}-${activeChain}-${riskMode}-${scanNonce}`),
    [walletAddress, activeChain, riskMode, scanNonce],
  )

  const portfolioValue = 18000 + (scanHash % 420000)
  const rawRiskScore = chain.baseRisk + mode.delta + (scanHash % 43) - 13
  const riskScore = clamp(Math.round(rawRiskScore), 12, 94)
  const healthScore = clamp(105 - riskScore + (scanHash % 9) - 4, 8, 99)
  const walletAge = 80 + (scanHash % 1320)
  const activePositions = 5 + (scanHash % 18)
  const savedGas = 190 + (scanHash % 820)
  const conversionRate = 0.024 + (scanHash % 9) / 1000
  const monthlyRevenue = subscriberCount * monthlyPrice
  const paymentFees = monthlyRevenue * 0.032
  const projectedProfit = monthlyRevenue - paymentFees - infraCost
  const annualRunRate = monthlyRevenue * 12
  const activeAlerts = Object.values(alerts).filter(Boolean).length

  const riskTimeline = useMemo(
    () =>
      months.map((month, index) => {
        const drift = ((scanHash >> (index % 7)) % 18) - 7
        const opportunity = clamp(72 - riskScore + drift + index * 1.2, 18, 92)

        return {
          month,
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
      Array.from({ length: 8 }, (_, index) => {
        const incoming = 5 + ((scanHash + index * 17) % 34)
        const outgoing = 3 + ((scanHash + index * 11) % 27)

        return {
          day: `D${index + 1}`,
          incoming,
          outgoing,
        }
      }),
    [scanHash],
  )

  const allocationData = useMemo(
    () => [
      { name: 'Keep', value: clamp(100 - riskScore, 18, 72), color: '#14b8a6' },
      { name: 'Hedge', value: clamp(riskScore / 2, 14, 42), color: '#f59e0b' },
      { name: 'Review', value: clamp(riskScore / 3, 9, 30), color: '#ef4444' },
    ],
    [riskScore],
  )

  const alertsFeed = [
    {
      title: 'Contract privilege changed',
      detail: `${chain.name} vault admin role moved in the last scan window`,
      severity: riskScore > 62 ? 'critical' : 'watch',
    },
    {
      title: 'Gas window opening',
      detail: `${chain.gas} median fee, execution batch rated efficient`,
      severity: 'healthy',
    },
    {
      title: 'Liquidity concentration',
      detail: `${activePositions} positions share correlated stablecoin exposure`,
      severity: riskScore > 48 ? 'watch' : 'healthy',
    },
  ]

  const handleCopy = () => {
    const report = `ChainWatch Pro scan: ${chain.name} wallet ${walletAddress.slice(0, 8)}... risk ${riskScore}/100, health ${healthScore}/100, value ${formatCurrency(portfolioValue)}.`
    void navigator.clipboard?.writeText(report)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const toggleAlert = (key: AlertKey) => {
    setAlerts((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>ChainWatch Pro</strong>
            <span>Web3 revenue intelligence</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#vaults">Vaults</a>
          <a href="#pricing">Pricing</a>
          <a href="#launch">Launch</a>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="icon-button" aria-label="Notifications" title="Notifications">
            <Bell size={18} aria-hidden="true" />
            <span>{activeAlerts}</span>
          </button>
          <button type="button" className="icon-button menu" aria-label="Open menu" title="Open menu">
            <Menu size={18} aria-hidden="true" />
          </button>
          <button type="button" className="primary-button">
            <LockKeyhole size={17} aria-hidden="true" />
            Start Pro
          </button>
        </div>
      </header>

      <main id="dashboard">
        <section className="dashboard-hero">
          <div className="scanner-panel">
            <span className="eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Wallet scanner
            </span>
            <h1>Risk scores, yield signals, and paid alerts in one Web3 control room.</h1>
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
                <button type="button" onClick={() => setScanNonce((value) => value + 1)} aria-label="Analyze wallet">
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

          <div className="hero-media" aria-label="Blockchain intelligence dashboard preview">
            <img src="/media/chainwatch-dashboard.png" alt="A blockchain intelligence dashboard with transaction flows and risk charts" />
            <div className="hero-overlay">
              <div>
                <span>Live monitor</span>
                <strong>{chain.name}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{riskScore}/100</strong>
              </div>
            </div>
          </div>
        </section>

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

        <section className="dashboard-grid">
          <article className="panel wide-panel">
            <SectionTitle icon={TrendIcon} eyebrow="Risk engine" title="Wallet risk and opportunity curve" action="Open analytics" />
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
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
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

          <article className="panel">
            <SectionTitle icon={AlertCircle} eyebrow="Alerts" title="Signal feed" action="Review feed" />
            <div className="alert-list">
              {alertsFeed.map((item) => (
                <div key={item.title} className={clsx('alert-row', item.severity)}>
                  <span />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <SectionTitle icon={BrainCircuit} eyebrow="Allocation" title="Action split" />
            <div className="allocation-panel">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={3}>
                    {allocationData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="allocation-legend">
                {allocationData.map((entry) => (
                  <span key={entry.name}>
                    <i style={{ background: entry.color }} />
                    {entry.name} {Math.round(entry.value)}%
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="panel automation-panel">
            <SectionTitle icon={Bot} eyebrow="Automation" title="Paid alert rules" action="Open rules" />
            <div className="toggle-list">
              <label>
                <span>
                  <strong>Slippage guard</strong>
                  <small>Pause when route impact breaks threshold</small>
                </span>
                <input type="checkbox" checked={alerts.slippage} onChange={() => toggleAlert('slippage')} />
              </label>
              <label>
                <span>
                  <strong>Contract watcher</strong>
                  <small>Track upgrade, mint, pause, and owner events</small>
                </span>
                <input type="checkbox" checked={alerts.contract} onChange={() => toggleAlert('contract')} />
              </label>
              <label>
                <span>
                  <strong>Whale movement</strong>
                  <small>Alert on major inflows before liquidity shifts</small>
                </span>
                <input type="checkbox" checked={alerts.whale} onChange={() => toggleAlert('whale')} />
              </label>
            </div>
          </article>
        </section>

        <section id="vaults" className="section-band">
          <div className="band-heading">
            <span className="eyebrow">
              <Rocket size={14} aria-hidden="true" />
              Monetizable vault intelligence
            </span>
            <h2>Sell the data layer, not financial promises.</h2>
            <p>Package wallet diagnostics, vault risk scoring, and alert workflows into subscription tiers for traders, DAOs, and small funds.</p>
          </div>

          <div className="vault-grid">
            {vaults.map((vault) => (
              <article key={vault.name} className="vault-card">
                <div>
                  <span className={clsx('status-pill', riskTone(vault.risk))}>{vault.status}</span>
                  <h3>{vault.name}</h3>
                  <p>{vault.chain} capacity {vault.capacity}</p>
                </div>
                <dl>
                  <div>
                    <dt>Projected APY</dt>
                    <dd>{vault.apy}%</dd>
                  </div>
                  <div>
                    <dt>Risk</dt>
                    <dd>{vault.risk}/100</dd>
                  </div>
                  <div>
                    <dt>Revenue model</dt>
                    <dd>{vault.revenue}</dd>
                  </div>
                </dl>
                <button type="button" className="secondary-button">
                  <span>Open signal</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="monetization-grid">
          <article className="panel revenue-panel">
            <SectionTitle icon={CircleDollarSign} eyebrow="Revenue planner" title="Subscription model simulator" />
            <div className="planner-grid">
              <label>
                <span>Subscribers</span>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="10"
                  value={subscriberCount}
                  onChange={(event) => setSubscriberCount(Number(event.target.value))}
                />
                <strong>{subscriberCount.toLocaleString()}</strong>
              </label>
              <label>
                <span>Monthly price</span>
                <input
                  type="range"
                  min="29"
                  max="799"
                  step="10"
                  value={monthlyPrice}
                  onChange={(event) => setMonthlyPrice(Number(event.target.value))}
                />
                <strong>{formatCurrency(monthlyPrice)}</strong>
              </label>
              <label>
                <span>Infra and tools</span>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="100"
                  value={infraCost}
                  onChange={(event) => setInfraCost(Number(event.target.value))}
                />
                <strong>{formatCurrency(infraCost)}</strong>
              </label>
            </div>
            <div className="revenue-results">
              <KpiCard icon={CircleDollarSign} label="MRR" value={formatCurrency(monthlyRevenue)} detail={`${(conversionRate * 100).toFixed(1)}% demo conversion`} tone="good" />
              <KpiCard icon={Activity} label="Monthly profit" value={formatCurrency(projectedProfit)} detail="After fees and infra" tone={projectedProfit > 0 ? 'good' : 'warn'} />
              <KpiCard icon={TrendingUp} label="ARR" value={formatCurrency(annualRunRate)} detail="Before annual discounts" />
            </div>
          </article>

          <aside className="pricing-stack">
            {pricingPlans.map((plan) => (
              <article key={plan.name} className="pricing-card">
                <div>
                  <span>{plan.market}</span>
                  <h3>{plan.name}</h3>
                  <strong>
                    {plan.price}
                    <small>/mo</small>
                  </strong>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </aside>
        </section>

        <section id="launch" className="launch-band">
          <div>
            <span className="eyebrow">
              <Globe2 size={14} aria-hidden="true" />
              GitHub launch kit
            </span>
            <h2>Built as a repo-ready Vite app with a clear path to paid production.</h2>
            <p>
              Demo data is isolated in the React layer. Connect an on-chain indexer, Stripe Checkout, and webhook delivery to convert this into a paid SaaS.
            </p>
          </div>
          <div className="launch-actions">
            <button type="button" className="primary-button" onClick={handleCopy}>
              <Copy size={17} aria-hidden="true" />
              {copied ? 'Copied scan' : 'Copy demo scan'}
            </button>
            <button type="button" className="secondary-button" onClick={() => setScanNonce((value) => value + 1)}>
              <RefreshCcw size={17} aria-hidden="true" />
              Refresh demo data
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
