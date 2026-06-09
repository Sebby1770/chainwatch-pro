import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Activity, AlertCircle, ArrowUpRight, Bot, BrainCircuit, Check,
  CircleDollarSign, Copy, Database, Gauge, Layers, LineChart as TrendIcon,
  LockKeyhole, Menu, RefreshCcw, Rocket, Search, ShieldCheck, Sparkles, TrendingUp,
  Wallet, X, Key, Download, Play
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import './App.css'

type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'solana'
type RiskMode = 'conservative' | 'balanced' | 'aggressive'
type AlertKey = 'slippage' | 'contract' | 'whale'

interface AlertItem {
  id: number
  title: string
  detail: string
  severity: 'healthy' | 'watch' | 'critical'
  ts: string
}

const chains = [
  { id: 'ethereum' as ChainId, name: 'Ethereum', symbol: 'ETH', baseRisk: 34, gas: '$7.42', tvl: '$61.2B' },
  { id: 'base' as ChainId, name: 'Base', symbol: 'BASE', baseRisk: 24, gas: '$0.31', tvl: '$9.6B' },
  { id: 'arbitrum' as ChainId, name: 'Arbitrum', symbol: 'ARB', baseRisk: 29, gas: '$0.18', tvl: '$14.1B' },
  { id: 'polygon' as ChainId, name: 'Polygon', symbol: 'POL', baseRisk: 31, gas: '$0.04', tvl: '$5.4B' },
  { id: 'solana' as ChainId, name: 'Solana', symbol: 'SOL', baseRisk: 38, gas: '$0.01', tvl: '$12.8B' },
]

const riskModes = [
  { id: 'conservative' as RiskMode, label: 'Conservative', delta: -7 },
  { id: 'balanced' as RiskMode, label: 'Balanced', delta: 0 },
  { id: 'aggressive' as RiskMode, label: 'Aggressive', delta: 9 },
]

const vaults = [
  { name: 'Stablecoin Delta Vault', chain: 'Base', apy: 8.4, risk: 22, capacity: '$8.1M', revenue: '$129/mo pro signal', status: 'Low drawdown' },
  { name: 'LST Loop Monitor', chain: 'Ethereum', apy: 6.9, risk: 31, capacity: '$24.8M', revenue: '$349/mo desk plan', status: 'Crowded trade' },
  { name: 'Perps Funding Sweep', chain: 'Arbitrum', apy: 14.7, risk: 57, capacity: '$3.7M', revenue: '2 percent success fee', status: 'Active watchlist' },
  { name: 'Treasury Rebalance Bot', chain: 'Solana', apy: 10.2, risk: 44, capacity: '$5.9M', revenue: '$799/mo enterprise', status: 'API gated' },
]

const pricingPlans = [
  { name: 'Scout', price: 29, market: 'solo wallets', features: ['5 wallet scans / mo', 'Gas timing feed', 'Weekly risk report', 'Basic alerts'] },
  { name: 'Operator', price: 149, market: 'active DeFi users', features: ['75 wallet scans', 'Vault scoring + signals', 'Telegram + Discord alerts', 'Priority support'], featured: true },
  { name: 'Desk', price: 799, market: 'funds and DAOs', features: ['Unlimited scans & seats', 'Full API + webhooks', 'Custom risk rules', 'Dedicated success manager', 'On-prem option'] },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Stripe test publishable key (replace with your own pk_test_... from Stripe dashboard)
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51REPLACE_WITH_YOUR_TEST_KEY'
const stripePromise = loadStripe(STRIPE_PK)

function hashText(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 1000003, 17)
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
function scoreLabel(score: number) { if (score >= 70) return 'High risk'; if (score >= 45) return 'Monitor'; return 'Healthy' }

function generateApiKey() {
  const rand = Array.from({ length: 18 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
  return `cw_live_${rand}`
}

// Real Stripe Payment Element form (used inside the subscribe modal)
function StripeCheckoutForm({ amount, onSuccess, onError }: { amount: number; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    try {
      // In a real flow we would have fetched a clientSecret from /create-payment-intent
      // For this starter we simulate a successful test payment using the Elements.
      // Replace with real confirmPayment + your backend-created PI secret.
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // For demo we don't redirect; in prod use return_url or handle server confirmation
          return_url: window.location.origin + '/pricing?success=true',
        },
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else {
        // Payment succeeded (in test mode use card 4242424242424242)
        onSuccess()
      }
    } catch (err: any) {
      onError(err?.message || 'Unexpected payment error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="primary-button"
        style={{ width: '100%', height: 48, marginTop: 16 }}
      >
        {loading ? 'Processing…' : `Pay $${amount} & Activate (test mode)`}
      </button>
      <div style={{ fontSize: 11, textAlign: 'center', marginTop: 8, color: 'var(--text-muted)' }}>
        Test card: <strong>4242 4242 4242 4242</strong> • any future date • any CVC
      </div>
    </form>
  )
}

function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = Math.max(820, window.innerHeight * 0.7))
    const points: Array<{x: number, y: number, vx: number, vy: number}> = []

    for (let i = 0; i < 42; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.9,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.18,
      })
    }

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(0, 229, 196, 0.14)'
      ctx.lineWidth = 1

      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 10 || p.y > h * 0.92) p.vy *= -1

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 138) {
            ctx.globalAlpha = (1 - dist / 138) * 0.6
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = 'rgba(0, 229, 196, 0.7)'
      ctx.globalAlpha = 0.8
      for (const p of points) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = Math.max(820, window.innerHeight * 0.72)
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="network-canvas" />
}



function KpiCard({ icon: Icon, label, value, detail, tone = 'neutral' as const }: any) {
  return (
    <div className={`kpi-card glass ${tone}`}>
      <div className="kpi-icon"><Icon size={17} /></div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.05, margin: '3px 0 2px' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{detail}</div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, eyebrow, title, action }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <Icon size={13} /> {eyebrow}
        </div>
        <h3 style={{ fontSize: 18, marginTop: 3 }}>{title}</h3>
      </div>
      {action && <button className="icon-button small" title={action}><ArrowUpRight size={15} /></button>}
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const [walletAddress, setWalletAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const [activeChain, setActiveChain] = useState<ChainId>('base')
  const [riskMode, setRiskMode] = useState<RiskMode>('balanced')
  const [scanNonce, setScanNonce] = useState(0)
  const [isScanning, setIsScanning] = useState(false)

  const [subscriberCount, setSubscriberCount] = useState(487)
  const [monthlyPrice, setMonthlyPrice] = useState(149)
  const [infraCost, setInfraCost] = useState(3100)

  const [alertsEnabled, setAlertsEnabled] = useState<Record<AlertKey, boolean>>({ slippage: true, contract: true, whale: false })
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([
    { id: 1, title: 'Contract privilege changed', detail: 'Base vault admin role updated', severity: 'watch', ts: '2m ago' },
    { id: 2, title: 'Large stable inflow', detail: '0x4a2...f1e deposited 420k USDC', severity: 'healthy', ts: '7m ago' },
  ])
  const [alertCounter, setAlertCounter] = useState(3)

  const [apiKey, setApiKey] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<'free' | 'Scout' | 'Operator' | 'Desk'>('free')
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [subscribePlan, setSubscribePlan] = useState<any>(null)
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success'>('form')

  const [showMobileNav, setShowMobileNav] = useState(false)
  const [copied, setCopied] = useState(false)

  // Persist API key (localStorage + Supabase stub)
  useEffect(() => {
    const saved = localStorage.getItem('cw_api_key')
    if (saved) setApiKey(saved)
    const savedTier = localStorage.getItem('cw_tier') as any
    if (savedTier) setCurrentTier(savedTier)

    // Optional Supabase bootstrap (non-blocking)
    import('../integrations/supabase/client').then(({ ensureDemoProfile }) => {
      ensureDemoProfile().catch(() => {})
    }).catch(() => {})
  }, [])

  const saveApiKey = async (key: string | null) => {
    setApiKey(key)
    if (key) {
      localStorage.setItem('cw_api_key', key)
      // Try Supabase (graceful fallback)
      try {
        const mod = await import('../integrations/supabase/client')
        await mod.saveApiKeyToSupabase(key)
      } catch {}
    } else {
      localStorage.removeItem('cw_api_key')
    }
  }

  const saveTier = (tier: any) => {
    setCurrentTier(tier)
    localStorage.setItem('cw_tier', tier)
    // In real Supabase flow you would also write to subscriptions table here
  }

  // Derived scan data (deterministic + nonce)
  const chain = chains.find(c => c.id === activeChain) ?? chains[0]
  const mode = riskModes.find(m => m.id === riskMode) ?? riskModes[1]
  const scanHash = useMemo(() => hashText(`${walletAddress}-${activeChain}-${riskMode}-${scanNonce}`), [walletAddress, activeChain, riskMode, scanNonce])

  const portfolioValue = 18000 + (scanHash % 420000)
  const rawRisk = chain.baseRisk + mode.delta + (scanHash % 43) - 13
  const riskScore = clamp(Math.round(rawRisk), 12, 94)
  const healthScore = clamp(105 - riskScore + (scanHash % 9) - 4, 8, 99)
  const activePositions = 5 + (scanHash % 18)
  const walletAge = 80 + (scanHash % 1320)
  const savedGas = 190 + (scanHash % 820)

  const riskTimeline = useMemo(() => months.map((m, i) => {
    const drift = ((scanHash >> (i % 7)) % 18) - 7
    return {
      month: m,
      risk: clamp(riskScore + drift + Math.sin(i) * 5, 10, 96),
      opportunity: clamp(72 - riskScore + drift + i * 1.2, 18, 92),
    }
  }), [riskScore, scanHash])

  const exposureData = useMemo(() => [
    { name: 'Stablecoins', value: 28 + (scanHash % 9), color: '#00e5c4' },
    { name: 'LSTs', value: 19 + (scanHash % 13), color: '#fbbf24' },
    { name: 'Perps', value: 9 + (scanHash % 12), color: '#f87171' },
    { name: 'NFTs', value: 4 + (scanHash % 8), color: '#a78bfa' },
    { name: 'Idle', value: 11 + (scanHash % 11), color: '#64748b' },
  ], [scanHash])

  const flowData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    day: `D${i + 1}`,
    incoming: 5 + ((scanHash + i * 17) % 34),
    outgoing: 3 + ((scanHash + i * 11) % 27),
  })), [scanHash])

  const allocationData = useMemo(() => [
    { name: 'Keep', value: clamp(100 - riskScore, 18, 72), color: '#00e5c4' },
    { name: 'Hedge', value: clamp(riskScore / 2, 14, 42), color: '#fbbf24' },
    { name: 'Review', value: clamp(riskScore / 3, 9, 30), color: '#f87171' },
  ], [riskScore])

  // Live alert simulation
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() > 0.62) {
        const templates = [
          { title: 'Whale movement detected', detail: `${chain.name} • 180k ${chain.symbol} moved`, sev: 'watch' as const },
          { title: 'Slippage threshold hit', detail: 'Route impact 1.9% — guard active', sev: 'critical' as const },
          { title: 'New vault deployed', detail: 'Unknown contract on ' + chain.name, sev: 'healthy' as const },
          { title: 'Funding rate spike', detail: 'Perps OI +38% in 12m', sev: 'watch' as const },
        ]
        const t = templates[Math.floor(Math.random() * templates.length)]
        const newAlert: AlertItem = {
          id: alertCounter,
          title: t.title,
          detail: t.detail,
          severity: t.sev,
          ts: 'just now',
        }
        setLiveAlerts(prev => [newAlert, ...prev].slice(0, 7))
        setAlertCounter(c => c + 1)
      }
    }, 5200)
    return () => clearInterval(iv)
  }, [chain, alertCounter])

  // Derived revenue
  const monthlyRevenue = subscriberCount * monthlyPrice
  const projectedProfit = monthlyRevenue - (monthlyRevenue * 0.032) - infraCost

  const activeAlertsCount = Object.values(alertsEnabled).filter(Boolean).length + liveAlerts.length

  const currentPage = useMemo(() => {
    const p = location.pathname
    if (p === '/pricing') return 'pricing'
    if (p === '/docs') return 'docs'
    if (p === '/features') return 'features'
    if (p === '/status') return 'status'
    if (p === '/account' || p === '/settings') return 'account'
    if (p === '/privacy') return 'privacy'
    if (p === '/terms') return 'terms'
    if (p.startsWith('/dashboard') || p === '/console') return 'console'
    return 'home'
  }, [location.pathname])

  // Scanner action
  const runScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setScanNonce(n => n + 1)
      setIsScanning(false)
      toast.success('Scan complete', { description: `${chain.name} • Risk ${riskScore}/100 • Health ${healthScore}/100` })
      // occasionally surface a new alert
      if (Math.random() > 0.5) {
        const a: AlertItem = {
          id: Date.now(),
          title: 'Fresh on-chain signal',
          detail: `New position detected on ${chain.name}`,
          severity: riskScore > 55 ? 'watch' : 'healthy',
          ts: 'just now',
        }
        setLiveAlerts(prev => [a, ...prev].slice(0, 7))
      }
    }, 680)
  }

  const toggleAlert = (k: AlertKey) => {
    setAlertsEnabled(a => ({ ...a, [k]: !a[k] }))
  }

  const copyReport = () => {
    const report = `ChainWatch Pro • ${chain.name} • ${walletAddress.slice(0,10)}... • Risk ${riskScore} • Health ${healthScore} • Value ${formatCurrency(portfolioValue)} • https://chainwatch.pro`
    navigator.clipboard?.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
    toast.info('Report copied to clipboard')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('ChainWatch Pro — Risk Report', 20, 22)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    doc.text(`Wallet: ${walletAddress}`, 20, 38)
    doc.text(`Chain: ${chain.name} (${chain.symbol})`, 20, 45)
    doc.text(`Risk Score: ${riskScore}/100  —  Health: ${healthScore}/100`, 20, 52)
    doc.text(`Portfolio Value (sim): ${formatCurrency(portfolioValue)}`, 20, 59)
    doc.text(`Active Positions: ${activePositions}  |  Wallet Age: ${walletAge} days`, 20, 66)
    doc.text(`Mode: ${mode.label}  |  Gas (median): ${chain.gas}`, 20, 73)

    doc.setFontSize(13)
    doc.text('Allocation Recommendation', 20, 87)
    allocationData.forEach((a, i) => {
      doc.text(`• ${a.name}: ${Math.round(a.value)}%`, 26, 96 + i * 7)
    })

    doc.text('Key Signals', 20, 120)
    liveAlerts.slice(0, 4).forEach((a, i) => {
      doc.text(`- ${a.title}: ${a.detail}`, 26, 129 + i * 7)
    })

    doc.setFontSize(9)
    doc.text('This is a demo report. Not financial advice. ChainWatch Pro © 2026', 20, 280)
    doc.save(`chainwatch-report-${walletAddress.slice(2, 8)}.pdf`)
    toast.success('PDF report downloaded')
  }

  // Auth
  const generateKey = () => {
    const key = generateApiKey()
    saveApiKey(key)
    toast.success('API key generated', { description: 'Stored locally. Use in SDKs & API calls.' })
  }

  const clearKey = () => {
    saveApiKey(null)
    toast('API key cleared')
  }

  // Subscribe flow
  const openCheckout = (plan: any) => {
    setSubscribePlan(plan)
    setCheckoutStep('form')
    setShowSubscribe(true)
  }

  const completeCheckout = () => {
    if (!subscribePlan) return
    const newTier = subscribePlan.name as any
    saveTier(newTier)
    setSubscriberCount(s => Math.max(s, 520 + Math.floor(Math.random() * 80)))
    setCheckoutStep('success')
    toast.success(`Welcome to ${subscribePlan.name}`, { description: 'Payment confirmed (Stripe test mode). Plan active.' })
    setTimeout(() => {
      setShowSubscribe(false)
      setSubscribePlan(null)
      setCheckoutStep('form')
      navigate('/dashboard')
    }, 1450)
  }

  const handleStripeSuccess = () => {
    completeCheckout()
  }

  const handleStripeError = (msg: string) => {
    toast.error('Payment error', { description: msg })
  }

  const closeModal = () => {
    setShowSubscribe(false)
    setSubscribePlan(null)
    setCheckoutStep('form')
  }

  // Fake API playground state
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/v1/scan')
  const [playgroundResult, setPlaygroundResult] = useState<string>('')

  const runPlayground = () => {
    const responses: Record<string, any> = {
      '/v1/scan': { risk_score: riskScore, health: healthScore, chain: chain.name, value_usd: portfolioValue, positions: activePositions },
      '/v1/vaults': { results: vaults.slice(0, 3), total_tvl: '$51.5B' },
      '/v1/alerts': { active: Object.keys(alertsEnabled).filter(k => alertsEnabled[k as AlertKey]), feed: liveAlerts.slice(0, 3) },
    }
    const res = responses[playgroundEndpoint] || { status: 'ok', note: 'demo' }
    const pretty = JSON.stringify(res, null, 2)
    setPlaygroundResult(pretty)
    toast('API response simulated')
  }

  const currentNav = (page: string) => currentPage === page ? 'active' : ''

  // RENDER
  return (
    <div className="app-shell">
      <NetworkBackground />

      {/* TOP NAV */}
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-mark" aria-label="ChainWatch Pro">
            <ShieldCheck size={20} />
          </Link>
          <div>
            <strong style={{ fontSize: 16, letterSpacing: '-0.3px' }}>ChainWatch Pro</strong>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -1 }}>Web3 Risk &amp; Yield Intel</div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/" className={currentNav('home')}>Home</Link>
          <Link to="/dashboard" className={currentNav('console')}>Console</Link>
          <Link to="/features" className={currentNav('features')}>Features</Link>
          <Link to="/pricing" className={currentNav('pricing')}>Pricing</Link>
          <Link to="/docs" className={currentNav('docs')}>Docs &amp; SDKs</Link>
          <Link to="/status" className={currentNav('status')}>Status</Link>
        </nav>

        <div className="user-area">
          {apiKey && (
            <div className="api-key-pill" title={apiKey} onClick={() => { navigator.clipboard.writeText(apiKey); toast('API key copied') }}>
              {apiKey.slice(0, 18)}…
            </div>
          )}
          <div className="live-activity">
            <span className="live-dot" /> {activeAlertsCount} signals live
          </div>

          <button className="icon-button" onClick={() => setShowMobileNav(!showMobileNav)} aria-label="Menu">
            <Menu size={18} />
          </button>

          {!apiKey ? (
            <button className="secondary-button" onClick={generateKey} style={{ gap: 6, padding: '0 13px', fontSize: 13 }}>
              <Key size={15} /> Get API Key
            </button>
          ) : (
            <button className="icon-button" onClick={clearKey} title="Clear key"><X size={16} /></button>
          )}

          <button className="primary-button" onClick={() => navigate('/dashboard')} style={{ padding: '0 18px', fontSize: 13 }}>
            <LockKeyhole size={16} /> Open Console
          </button>
        </div>
      </header>

      {/* HERO / HOME */}
      {currentPage === 'home' && (
        <div className="hero">
          <div className="hero-grid">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.5px', marginBottom: 12 }}>
                <Sparkles size={14} /> PRODUCTION-READY WEB3 SAAS STARTER
              </div>
              <h1>
                Real-time wallet risk.<br /> Vault intelligence.<br /> Paid alerts that scale.
              </h1>
              <p className="subtitle">
                The professional control plane for on-chain risk, yield monitoring and subscription revenue.
                Connect real indexers, Stripe and webhooks to turn this into your live SaaS.
              </p>

              <div className="action-bar" style={{ marginTop: 26 }}>
                <button className="primary-button" onClick={() => navigate('/dashboard')} style={{ padding: '13px 26px', fontSize: 15 }}>
                  Launch Live Console <ArrowUpRight size={17} />
                </button>
                <button className="secondary-button" onClick={() => navigate('/docs')} style={{ padding: '13px 20px', fontSize: 15 }}>
                  Explore SDKs &amp; API
                </button>
                <button className="secondary-button" onClick={() => navigate('/pricing')}>
                  See pricing
                </button>
              </div>

              <div style={{ marginTop: 22, fontSize: 12, color: 'var(--text-muted)' }}>
                Trusted by 480+ demo operators • MIT licensed • Ready for production data
              </div>
            </div>

            {/* Mini live preview card */}
            <div className="glass scanner-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>LIVE DEMO</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Instant risk surface</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  <div className="live-dot" style={{ marginLeft: 'auto' }} /> {chain.name}
                </div>
              </div>

              <div className="scanner-input" style={{ marginBottom: 12 }}>
                <Wallet size={16} style={{ opacity: 0.6 }} />
                <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} spellCheck={false} />
              </div>

              <div className="chain-pills" style={{ marginBottom: 10 }}>
                {chains.map(c => (
                  <button key={c.id} className={`chain-pill ${c.id === activeChain ? 'active' : ''}`} onClick={() => setActiveChain(c.id)}>{c.name}</button>
                ))}
              </div>

              <div className="risk-modes" style={{ marginBottom: 16 }}>
                {riskModes.map(m => (
                  <button key={m.id} className={`risk-mode ${m.id === riskMode ? 'active' : ''}`} onClick={() => setRiskMode(m.id)}>
                    {m.label}<br /><span style={{ fontSize: 11, opacity: 0.7 }}>{m.delta > 0 ? '+' : ''}{m.delta}</span>
                  </button>
                ))}
              </div>

              <button className="primary-button" style={{ width: '100%', height: 46 }} onClick={() => { navigate('/dashboard'); runScan() }}>
                {isScanning ? 'SCANNING…' : 'ANALYZE WALLET →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD / CONSOLE */}
      {(currentPage === 'home' || currentPage === 'console') && (
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 20px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 18px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>PRO CONSOLE</div>
              <h2 style={{ fontSize: 28, marginTop: 2 }}>Wallet Intelligence &amp; Monitoring</h2>
            </div>
            <div className="action-bar">
              <button onClick={runScan} disabled={isScanning} className="secondary-button" style={{ gap: 7 }}>
                <RefreshCcw size={16} /> {isScanning ? 'SCANNING' : 'REFRESH SCAN'}
              </button>
              <button onClick={copyReport} className="secondary-button" style={{ gap: 7 }}>
                <Copy size={16} /> {copied ? 'COPIED' : 'COPY REPORT'}
              </button>
              <button onClick={exportPDF} className="primary-button" style={{ gap: 7, padding: '0 18px' }}>
                <Download size={16} /> EXPORT PDF
              </button>
            </div>
          </div>

          {/* Scanner + chain controls (always visible in console) */}
          <div className="glass" style={{ padding: 22, marginBottom: 18, borderRadius: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>TARGET</div>
                <div className="scanner-input">
                  <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} />
                  <button onClick={runScan} disabled={isScanning}>{isScanning ? '…' : <Search size={18} />}</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>CHAIN • RISK PROFILE</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {chains.map(c => (
                    <button key={c.id} onClick={() => setActiveChain(c.id)} className={`chain-pill ${c.id === activeChain ? 'active' : ''}`}>{c.name}</button>
                  ))}
                  {riskModes.map(m => (
                    <button key={m.id} onClick={() => setRiskMode(m.id)} className={`chain-pill ${m.id === riskMode ? 'active' : ''}`} style={{ background: m.id === riskMode ? 'var(--accent)' : undefined, color: m.id === riskMode ? '#04120f' : undefined }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <KpiCard icon={Gauge} label="Wallet Health" value={`${healthScore}/100`} detail={`${scoreLabel(riskScore)} on ${chain.symbol}`} tone={riskScore > 70 ? 'danger' : riskScore > 45 ? 'warn' : 'good'} />
            <KpiCard icon={CircleDollarSign} label="Tracked Value" value={formatCurrency(portfolioValue)} detail={`${activePositions} positions • ${walletAge.toLocaleString()}d age`} />
            <KpiCard icon={TrendingUp} label="Gas Saved (sim)" value={formatCurrency(savedGas)} detail={`${chain.gas} median`} tone="good" />
            <KpiCard icon={Database} label="Chain TVL" value={chain.tvl} detail="Live market snapshot" />
          </div>

          {/* Charts + Signals Grid */}
          <div className="dashboard-grid">
            <div className="panel glass wide" style={{ padding: 20 }}>
              <SectionHeader icon={TrendIcon} eyebrow="RISK ENGINE" title="Risk vs Opportunity Curve" action="Analytics" />
              <div className="chart-wrap" style={{ height: 262 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTimeline}>
                    <defs>
                      <linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity={0.6} /><stop offset="100%" stopColor="#f87171" stopOpacity={0.02} /></linearGradient>
                      <linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5c4" stopOpacity={0.55} /><stop offset="100%" stopColor="#00e5c4" stopOpacity={0.02} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f141f', border: '1px solid #334155' }} />
                    <Area type="monotone" dataKey="risk" stroke="#f87171" fill="url(#r)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="opportunity" stroke="#00e5c4" fill="url(#o)" strokeWidth={2.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel glass" style={{ padding: 18 }}>
              <SectionHeader icon={Layers} eyebrow="EXPOSURE" title="Portfolio Mix" />
              <div className="chart-wrap" style={{ height: 218 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exposureData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={5}>
                      {exposureData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel glass" style={{ padding: 18 }}>
              <SectionHeader icon={Activity} eyebrow="VELOCITY" title="Transaction Flow (8d)" />
              <div className="chart-wrap" style={{ height: 218 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flowData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="incoming" stroke="#00e5c4" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="outgoing" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Feed + Automation */}
            <div className="panel glass" style={{ padding: 18, gridColumn: 'span 1' }}>
              <SectionHeader icon={AlertCircle} eyebrow="LIVE FEED" title="Signal Stream" action="View all" />
              <div className="alert-feed">
                {liveAlerts.map((a, idx) => (
                  <div key={idx} className={`alert-item ${a.severity}`}>
                    <div style={{ width: 6, height: 6, marginTop: 6, borderRadius: 99, background: a.severity === 'critical' ? 'var(--red)' : a.severity === 'watch' ? 'var(--amber)' : 'var(--accent)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.detail} • {a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel glass" style={{ padding: 18 }}>
              <SectionHeader icon={BrainCircuit} eyebrow="ALLOCATION" title="Recommended Action Split" />
              <div style={{ height: 176 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={4}>
                      {allocationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {allocationData.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '2px 9px', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 9, height: 9, background: e.color, borderRadius: 2 }} /> {e.name} {Math.round(e.value)}%
                  </div>
                ))}
              </div>
            </div>

            <div className="panel glass" style={{ padding: 18, background: '#0a0f18' }}>
              <SectionHeader icon={Bot} eyebrow="AUTOMATION" title="Paid Alert Rules" />
              <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                {(['slippage', 'contract', 'whale'] as AlertKey[]).map((k) => (
                  <label key={k} className="toggle-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>{k === 'slippage' ? 'Slippage Guard' : k === 'contract' ? 'Contract Watcher' : 'Whale Movement'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {k === 'slippage' && 'Pause execution when impact exceeds threshold'}
                        {k === 'contract' && 'Track admin, upgrade, mint & pause events'}
                        {k === 'whale' && 'Notify on large inflows before liquidity moves'}
                      </div>
                    </div>
                    <input type="checkbox" checked={alertsEnabled[k]} onChange={() => toggleAlert(k)} />
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>Alerts delivered via your connected webhooks (enable in Settings → Integrations in prod)</div>
            </div>
          </div>

          {/* Vaults */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Rocket size={18} style={{ color: 'var(--accent)' }} />
              <div style={{ fontWeight: 700, fontSize: 19 }}>Monetizable Vault Intelligence</div>
            </div>
            <div className="vault-grid">
              {vaults.map((v, idx) => (
                <div key={idx} className="vault-card glass">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="status-badge" style={{ background: v.risk > 50 ? 'rgba(248,113,113,0.15)' : v.risk > 35 ? 'rgba(250,204,21,0.15)' : 'rgba(0,229,196,0.15)', color: v.risk > 50 ? 'var(--red)' : v.risk > 35 ? 'var(--amber)' : 'var(--accent)' }}>{v.status}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.chain}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, margin: '8px 0 4px' }}>{v.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Capacity {v.capacity}</div>

                  <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                    <div>APY <strong style={{ display: 'block', color: 'var(--text-strong)' }}>{v.apy}%</strong></div>
                    <div>Risk <strong style={{ display: 'block', color: 'var(--text-strong)' }}>{v.risk}/100</strong></div>
                    <div style={{ gridColumn: '1 / -1', color: 'var(--accent)' }}>{v.revenue}</div>
                  </div>
                  <button className="secondary-button" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/pricing')}>Open signal →</button>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* PRICING */}
      {currentPage === 'pricing' && (
        <div className="section" style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: 1.5, fontSize: 12 }}>SUBSCRIPTION REVENUE ENGINE</div>
            <h2 style={{ fontSize: 36, marginTop: 6 }}>Choose the plan that matches your edge</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '8px auto 0' }}>Upgrade anytime. All plans include the core risk engine and live signals.</p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`pricing-tier glass ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && <div style={{ position: 'absolute', top: -9, right: 18, fontSize: 10, background: 'var(--accent)', color: '#04120f', padding: '1px 9px', borderRadius: 99, fontWeight: 700 }}>MOST POPULAR</div>}
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>{plan.market.toUpperCase()}</div>
                <div style={{ fontSize: 23, fontWeight: 700, marginTop: 4 }}>{plan.name}</div>
                <div className="price" style={{ color: 'var(--text-strong)' }}>${plan.price}<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/mo</span></div>

                <ul style={{ margin: '18px 0', padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
                  {plan.features.map((f, fi) => <li key={fi} style={{ display: 'flex', gap: 8, fontSize: 14 }}><Check size={15} style={{ color: 'var(--accent)', marginTop: 2 }} /> {f}</li>)}
                </ul>

                <button className={plan.featured ? 'primary-button' : 'secondary-button'} style={{ width: '100%', height: 46 }} onClick={() => openCheckout(plan)}>
                  {currentTier === plan.name ? 'CURRENT PLAN' : 'Subscribe'}
                </button>
                <div style={{ fontSize: 10, textAlign: 'center', marginTop: 8, color: 'var(--text-muted)' }}>Billed monthly • Cancel anytime</div>
              </div>
            ))}
          </div>

          {/* Revenue Simulator */}
          <div className="glass" style={{ marginTop: 42, padding: 26, borderRadius: 14 }}>
            <SectionHeader icon={CircleDollarSign} eyebrow="SAAS SIMULATOR" title="Project your MRR &amp; profit" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
              <label>Subscribers<br />
                <input type="range" min="80" max="2800" step="10" value={subscriberCount} onChange={e => setSubscriberCount(+e.target.value)} style={{ width: '100%' }} />
                <strong>{subscriberCount.toLocaleString()}</strong>
              </label>
              <label>Operator price<br />
                <input type="range" min="29" max="799" step="10" value={monthlyPrice} onChange={e => setMonthlyPrice(+e.target.value)} style={{ width: '100%' }} />
                <strong>{formatCurrency(monthlyPrice)}</strong>
              </label>
              <label>Infra + tools cost<br />
                <input type="range" min="400" max="18000" step="100" value={infraCost} onChange={e => setInfraCost(+e.target.value)} style={{ width: '100%' }} />
                <strong>{formatCurrency(infraCost)}</strong>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <div className="glass" style={{ padding: 14, flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MRR</div><div style={{ fontSize: 26, fontWeight: 700 }}>{formatCurrency(monthlyRevenue)}</div></div>
              <div className="glass" style={{ padding: 14, flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly Profit (demo)</div><div style={{ fontSize: 26, fontWeight: 700, color: projectedProfit > 0 ? 'var(--green)' : 'var(--amber)' }}>{formatCurrency(projectedProfit)}</div></div>
              <div className="glass" style={{ padding: 14, flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ARR</div><div style={{ fontSize: 26, fontWeight: 700 }}>{formatCurrency(monthlyRevenue * 12)}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* DOCS + SDKs + API Playground */}
      {currentPage === 'docs' && (
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '30px 20px 80px' }}>
          <h2 style={{ fontSize: 32 }}>Docs &amp; SDKs</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 580 }}>Production-grade clients for your stack. All SDKs target the same REST API. Replace the mock base URL with your deployed backend.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 26 }}>
            <div className="sdk-card glass">
              <div className="sdk-card"><h4>Python SDK + CLI</h4>
                <div style={{ fontSize: 13, margin: '8px 0 14px', color: 'var(--text-muted)' }}>pip install chainwatch-pro<br />Full async client + beautiful CLI.</div>
                <div className="doc-code">from chainwatch import ChainWatchClient<br />client = ChainWatchClient(api_key="cw_live_...")<br />print(client.scan("0x..."))</div>
                <a href="https://github.com/Sebby1770/chainwatch-pro/tree/main/sdks/python" target="_blank" style={{ color: 'var(--accent)', fontSize: 13 }}>View in repo →</a>
              </div>
            </div>
            <div className="sdk-card glass">
              <h4>C++ SDK / CLI</h4>
              <div style={{ fontSize: 13, margin: '8px 0 14px', color: 'var(--text-muted)' }}>High-performance native client.<br />CMake + libcurl example.</div>
              <div className="doc-code">ChainWatchClient c(key);<br />auto r = c.scanWallet(addr, "base");<br />std::cout &lt;&lt; r.risk_score;</div>
              <a href="https://github.com/Sebby1770/chainwatch-pro/tree/main/sdks/cpp" target="_blank" style={{ color: 'var(--accent)', fontSize: 13 }}>View in repo →</a>
            </div>
            <div className="sdk-card glass">
              <h4>TypeScript / Node SDK</h4>
              <div style={{ fontSize: 13, margin: '8px 0 14px', color: 'var(--text-muted)' }}>Browser + server. Same contract as the web app.</div>
              <div className="doc-code">const c = new ChainWatchClient(&#123; apiKey &#125;)<br />await c.scanWallet(addr, &#123; chain: 'base' &#125;)</div>
              <a href="https://github.com/Sebby1770/chainwatch-pro/tree/main/sdks/typescript" target="_blank" style={{ color: 'var(--accent)', fontSize: 13 }}>View in repo →</a>
            </div>
            <div className="sdk-card glass">
              <h4>Go SDK + CLI</h4>
              <div style={{ fontSize: 13, margin: '8px 0 14px', color: 'var(--text-muted)' }}>Fast native CLI + importable package.</div>
              <div className="doc-code">c := chainwatch.NewClient(key)<br />r, _ := c.ScanWallet(addr, "base")</div>
              <a href="https://github.com/Sebby1770/chainwatch-pro/tree/main/sdks/go" target="_blank" style={{ color: 'var(--accent)', fontSize: 13 }}>View in repo →</a>
            </div>
            <div className="sdk-card glass">
              <h4>REST + Supabase + Stripe</h4>
              <div style={{ fontSize: 13, margin: '8px 0 14px' }}>Full contract + integration stubs.</div>
              <button className="secondary-button" onClick={() => navigate('/account')} style={{ fontSize: 13 }}>Open Account</button>
            </div>
          </div>

          <div style={{ marginTop: 42 }}>
            <h3 style={{ marginBottom: 10 }}>API Playground (demo)</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {['/v1/scan', '/v1/vaults', '/v1/alerts'].map(ep => (
                <button key={ep} className={`chain-pill ${playgroundEndpoint === ep ? 'active' : ''}`} onClick={() => setPlaygroundEndpoint(ep)}>{ep}</button>
              ))}
              <button className="primary-button" style={{ marginLeft: 'auto', padding: '0 16px' }} onClick={runPlayground}><Play size={15} /> RUN</button>
            </div>
            <div className="api-playground">{playgroundResult || 'Select endpoint and hit RUN to simulate authenticated response.'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Real calls require a valid API key (generate above) and a running backend (see /backend example).</div>
          </div>

          <div style={{ marginTop: 48, padding: 22, border: '1px dashed var(--border)', borderRadius: 10 }}>
            <strong>Production path</strong><br />
            1. Deploy this frontend (Vercel/Netlify) + a real backend (FastAPI / Node / Go).<br />
            2. Wire real data: Alchemy/Moralis/Helius + DefiLlama + your risk models.<br />
            3. Add Stripe + webhook delivery (Resend / Telegram bot).<br />
            4. Store users + keys in Supabase / Firebase / your DB.<br />
            The SDKs and this demo already speak the same contract.
          </div>
        </div>
      )}

      {/* FEATURES */}
      {currentPage === 'features' && (
        <div className="section" style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center' }}>Everything you need for on-chain intelligence</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 32 }}>
            {[
              ['Real-time Risk Engine', 'Deterministic + ML-ready scoring across 5+ chains with opportunity curves.'],
              ['Vault Yield Signals', 'Monetizable intelligence on high-APY strategies with capacity and crowding data.'],
              ['Paid Alert Rules', 'Slippage, contract events, whale movements delivered via webhooks or SDK.'],
              ['Revenue Simulator', 'Built-in MRR/ARR/profit modeling so you can package and price correctly.'],
              ['API + Multi-lang SDKs', 'Python, Go, TypeScript, C++ clients + OpenAPI contract.'],
              ['Supabase + Stripe Ready', 'Stubs for auth, persistent keys, subscriptions and real payment flows.'],
            ].map(([title, desc], i) => (
              <div key={i} className="glass" style={{ padding: 20 }}>
                <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <p style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <button className="primary-button" onClick={() => navigate('/pricing')}>Start free trial →</button>
          </div>
        </div>
      )}

      {/* STATUS */}
      {currentPage === 'status' && (
        <div className="section" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>System Status</h2>
          <div className="glass" style={{ padding: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="live-dot" style={{ background: 'var(--green)' }} /> <strong style={{ color: 'var(--green)' }}>All systems operational</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div>API <span style={{ color: 'var(--green)' }}>99.98%</span> (30d)</div>
              <div>Scanner Engine <span style={{ color: 'var(--green)' }}>100%</span></div>
              <div>Alert Delivery <span style={{ color: 'var(--green)' }}>99.7%</span></div>
              <div>Webhooks <span style={{ color: 'var(--green)' }}>99.9%</span></div>
            </div>
            <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Last incident: None in the last 90 days.<br />
              Uptime is for the demo environment. Your production deployment will have its own monitoring.
            </div>
          </div>
          <p style={{ marginTop: 20, color: 'var(--text-muted)' }}>Subscribe to status updates via the Operator plan webhooks or our public status page (coming soon).</p>
        </div>
      )}

      {/* ACCOUNT / SETTINGS (SaaS user dashboard stub) */}
      {currentPage === 'account' && (
        <div className="section" style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2>Account &amp; Billing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
            <div className="glass" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 12 }}>Current Plan</h3>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{currentTier === 'free' ? 'Free / Demo' : currentTier}</div>
              <button className="secondary-button" style={{ marginTop: 12 }} onClick={() => navigate('/pricing')}>Manage subscription</button>
            </div>
            <div className="glass" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 12 }}>API Key</h3>
              {apiKey ? (
                <>
                  <div className="api-key-pill" style={{ maxWidth: 'none', padding: '8px 12px' }}>{apiKey}</div>
                  <div style={{ marginTop: 10 }}>
                    <button className="secondary-button" onClick={() => { navigator.clipboard.writeText(apiKey); toast('Copied') }}>Copy</button>
                    <button className="secondary-button" style={{ marginLeft: 8 }} onClick={clearKey}>Revoke</button>
                  </div>
                </>
              ) : (
                <button className="primary-button" onClick={generateKey}>Generate new key</button>
              )}
              <div style={{ fontSize: 12, marginTop: 12, color: 'var(--text-muted)' }}>Keys are stored in Supabase (when configured) + local fallback.</div>
            </div>
          </div>

          <div className="glass" style={{ padding: 22, marginTop: 18 }}>
            <h3>Usage this month (demo)</h3>
            <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
              <div>Scans: <strong>47 / 75</strong></div>
              <div>Alerts delivered: <strong>312</strong></div>
              <div>Reports exported: <strong>8</strong></div>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>Connect real Supabase + Stripe to track and bill usage automatically.</div>
          </div>
        </div>
      )}

      {/* LEGAL PAGES */}
      {(currentPage === 'privacy' || currentPage === 'terms') && (
        <div className="legal-content">
          {currentPage === 'privacy' && (
            <>
              <h1>Privacy Policy</h1>
              <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

              <h2>1. What We Collect</h2>
              <p>ChainWatch Pro (“we”, “us”) collects:</p>
              <ul>
                <li>Wallet addresses and on-chain activity you explicitly submit for analysis.</li>
                <li>Account information (email, name) when you create an account or subscribe.</li>
                <li>Usage data, API key usage, and product interaction events for improving the service.</li>
                <li>Payment metadata via our payment processor (we never store full card numbers).</li>
              </ul>
              <p><strong>Important:</strong> Blockchain data is public by nature. Any wallet address you scan or monitor is already visible on public ledgers. We do not “own” or control this data.</p>

              <h2>2. How We Use Data</h2>
              <ul>
                <li>Deliver risk scores, vault intelligence, alerts, and reports.</li>
                <li>Operate, secure, and improve the SaaS platform.</li>
                <li>Send transactional emails and (with consent) product updates.</li>
                <li>Comply with legal obligations and prevent abuse.</li>
              </ul>

              <h2>3. Sharing</h2>
              <p>We share data with infrastructure providers (hosting, payments, email, analytics) under strict contracts. We never sell your personal information. We may disclose when required by law or to protect the service.</p>

              <h2>4. Your Rights</h2>
              <p>Depending on your location (GDPR, CCPA, etc.) you may request access, correction, deletion, or export of your data. Contact privacy@chainwatch.pro. Note that on-chain history cannot be deleted from public blockchains.</p>

              <h2>5. Security &amp; Retention</h2>
              <p>We use industry-standard encryption in transit and at rest for account data. API keys are stored hashed. We retain account data while your account is active and for a reasonable period afterward for legal and abuse-prevention reasons.</p>

              <h2>6. Children &amp; Sensitive Data</h2>
              <p>Our service is not directed at children. We do not intentionally collect sensitive personal data beyond what is necessary for the product.</p>

              <p style={{ marginTop: 40, fontSize: 12, color: 'var(--text-muted)' }}>This is a template policy for a demo SaaS product. Have a qualified attorney review before charging real customers.</p>
            </>
          )}

          {currentPage === 'terms' && (
            <>
              <h1>Terms of Service</h1>
              <p><strong>Effective:</strong> {new Date().toLocaleDateString()}</p>

              <h2>1. The Service</h2>
              <p>ChainWatch Pro provides software tools, dashboards, APIs, and data analysis related to public blockchain activity (“Service”). The Service includes demo and paid tiers.</p>

              <h2>2. No Financial, Legal, or Investment Advice</h2>
              <p>ALL OUTPUT (risk scores, alerts, vault data, reports) IS FOR INFORMATIONAL PURPOSES ONLY. WE ARE NOT A FIDUCIARY. DO NOT USE THE SERVICE FOR TRADING, LENDING, OR INVESTMENT DECISIONS. Past performance and simulated metrics are not indicative of future results. You are solely responsible for your actions.</p>

              <h2>3. Accounts &amp; API Keys</h2>
              <p>You are responsible for safeguarding your API keys and account credentials. You may not share keys or use the Service to violate laws, harass others, or abuse public infrastructure. We may suspend or terminate accounts that abuse the Service or provide false information.</p>

              <h2>4. Subscriptions &amp; Payments</h2>
              <p>Paid plans are billed in advance. You may cancel at any time; access continues until the end of the paid period. No refunds for partial periods except where required by law. We may change pricing with 30 days notice.</p>

              <h2>5. Intellectual Property &amp; License</h2>
              <p>The software, design, and content are owned by us or our licensors. Subject to these Terms we grant you a limited, non-exclusive, non-transferable license to use the Service for your internal or commercial purposes during the subscription term.</p>

              <h2>6. Disclaimers &amp; Limitation of Liability</h2>
              <p>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE”. WE DISCLAIM ALL WARRANTIES. TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>

              <h2>7. Indemnification</h2>
              <p>You agree to indemnify and hold us harmless from claims arising out of your use of the Service, your content, or your violation of these Terms or applicable law.</p>

              <h2>8. Termination</h2>
              <p>We may terminate or suspend access immediately for material breach or legal reasons. Upon termination your right to use the Service ends.</p>

              <h2>9. Governing Law</h2>
              <p>These Terms are governed by the laws of the jurisdiction in which the company is registered, without regard to conflict of law rules.</p>

              <p style={{ marginTop: 40, fontSize: 12, color: 'var(--text-muted)' }}>This is a starter legal template. Consult legal counsel and adapt to your entity, jurisdiction, and actual data practices before going live with payments.</p>
            </>
          )}

          <div style={{ marginTop: 50, fontSize: 13 }}>
            <Link to="/privacy">Privacy</Link> • <Link to="/terms">Terms</Link> • <a href="https://github.com/Sebby1770/chainwatch-pro" target="_blank">Source</a>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div>© {new Date().getFullYear()} Sebastian Forbes — ChainWatch Pro. Not financial advice.</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/docs">Docs &amp; SDKs</Link>
          <Link to="/status">Status</Link>
          <Link to="/account">Account</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="https://github.com/Sebby1770/chainwatch-pro" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>

      {/* SUBSCRIBE / CHECKOUT MODAL */}
      <AnimatePresence>
        {showSubscribe && subscribePlan && (
          <div className="modal" onClick={closeModal}>
            <motion.div
              className="modal-content glass"
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              onClick={e => e.stopPropagation()}
            >
              {checkoutStep === 'form' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>UPGRADE • POWERED BY STRIPE</div>
                      <div style={{ fontSize: 21, fontWeight: 700 }}>{subscribePlan.name} — ${subscribePlan.price}/mo</div>
                    </div>
                    <button onClick={closeModal} style={{ background: 'transparent', border: 0, color: 'var(--text-muted)' }}><X /></button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Elements 
                      stripe={stripePromise} 
                      options={{ 
                        mode: 'payment', 
                        amount: subscribePlan.price * 100, 
                        currency: 'usd',
                        appearance: { theme: 'night' }
                      }}
                    >
                      <StripeCheckoutForm 
                        amount={subscribePlan.price} 
                        onSuccess={handleStripeSuccess} 
                        onError={handleStripeError} 
                      />
                    </Elements>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                    Real Stripe Elements (test mode). No real money is charged.
                  </div>
                </>
              ) : (
                <div className="success-state">
                  <div className="big" style={{ color: 'var(--accent)' }}>✓</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>You’re on the {subscribePlan.name} plan</div>
                  <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Welcome to the future of on-chain intelligence.<br />Your API key now unlocks higher rate limits.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
