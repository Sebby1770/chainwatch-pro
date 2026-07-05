import { motion } from 'framer-motion'
import { ArrowRight, Globe2, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { title: 'Wallet risk scoring', detail: 'Deterministic scans across Ethereum, Base, Arbitrum, and more.' },
  { title: 'Live alert feed', detail: 'Simulated WebSocket stream with severity-ranked signals.' },
  { title: 'API playground', detail: 'Test /v1/scan, /v1/vaults, and /v1/alerts against the FastAPI stub.' },
]

export function Home() {
  return (
    <div className="page home-page">
      <section className="home-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            ChainWatch Pro v2
          </span>
          <h1>Risk scores, yield signals, and paid alerts in one Web3 control room.</h1>
          <p>
            A production-ready SaaS starter with routing, watchlists, alert rules, API console, and a FastAPI backend stub.
          </p>
          <div className="home-actions">
            <Link to="/dashboard" className="primary-button">
              Open dashboard
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/api-playground" className="secondary-button">
              Try the API
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-media"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          aria-label="Blockchain intelligence dashboard preview"
        >
          <img src="/media/chainwatch-dashboard.png" alt="ChainWatch dashboard preview" />
          <div className="hero-overlay">
            <div>
              <span>Live monitor</span>
              <strong>Multi-chain</strong>
            </div>
            <div>
              <span>Routes</span>
              <strong>7 pages</strong>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="home-features">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            className="panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * index }}
          >
            <ShieldCheck size={22} aria-hidden="true" />
            <h3>{feature.title}</h3>
            <p>{feature.detail}</p>
          </motion.article>
        ))}
      </section>

      <section className="launch-band">
        <div>
          <span className="eyebrow">
            <Globe2 size={14} aria-hidden="true" />
            Get started
          </span>
          <h2>Explore the full product surface.</h2>
          <p>Dashboard, watchlist, alerts, pricing, docs, and API playground — all wired with react-router-dom.</p>
        </div>
        <div className="launch-actions">
          <Link to="/watchlist" className="secondary-button">
            <Rocket size={17} aria-hidden="true" />
            Build watchlist
          </Link>
          <Link to="/docs" className="primary-button">
            Read docs
          </Link>
        </div>
      </section>
    </div>
  )
}