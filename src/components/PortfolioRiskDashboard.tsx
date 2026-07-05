import clsx from 'clsx'
import { PieChart, Shield } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { AddressBadge } from './AddressBadge'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { computePortfolioRisk } from '../lib/portfolio'
import { DEFAULT_WATCHLIST, normalizeWatchlistEntry } from '../lib/watchlist'
import { formatCurrency, scoreLabel } from '../lib/utils'
import { SectionTitle } from './SectionTitle'

export function PortfolioRiskDashboard() {
  const [rawWatchlist] = useLocalStorage('chainwatch-watchlist', DEFAULT_WATCHLIST)
  const watchlist = useMemo(() => rawWatchlist.map(normalizeWatchlistEntry), [rawWatchlist])

  const portfolio = useMemo(() => computePortfolioRisk(watchlist), [watchlist])

  if (watchlist.length === 0) {
    return (
      <section className="panel portfolio-risk-panel">
        <SectionTitle icon={Shield} eyebrow="Portfolio" title="Portfolio risk dashboard" />
        <p className="empty-state">Add wallets to your watchlist to see aggregated portfolio risk.</p>
      </section>
    )
  }

  const riskTone = portfolio.portfolioRiskScore >= 70 ? 'critical' : portfolio.portfolioRiskScore >= 45 ? 'watch' : 'healthy'

  return (
    <section className="panel portfolio-risk-panel">
      <SectionTitle icon={Shield} eyebrow="Portfolio" title="Portfolio risk dashboard" action={`${watchlist.length} wallets`} />

      <div className="portfolio-kpis">
        <div className="portfolio-kpi">
          <span>Portfolio risk</span>
          <strong>{portfolio.portfolioRiskScore}/100</strong>
          <span className={clsx('status-pill', riskTone)}>{scoreLabel(portfolio.portfolioRiskScore)}</span>
        </div>
        <div className="portfolio-kpi">
          <span>Diversification</span>
          <strong>{portfolio.diversificationScore}/100</strong>
          <small>Lower chain concentration = higher score</small>
        </div>
        <div className="portfolio-kpi">
          <span>Total tracked value</span>
          <strong>{formatCurrency(portfolio.totalValue)}</strong>
          <small>Across {portfolio.walletCount} wallets</small>
        </div>
      </div>

      <div className="portfolio-labels">
        {watchlist.map((entry) => (
          <div key={entry.id} className="portfolio-label-row">
            <AddressBadge address={entry.address} />
          </div>
        ))}
      </div>

      <div className="portfolio-charts">
        <article className="portfolio-chart-card">
          <h3>
            <PieChart size={16} aria-hidden="true" />
            Chain exposure
          </h3>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={portfolio.chainExposure}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {portfolio.chainExposure.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="allocation-legend">
            {portfolio.chainExposure.map((item) => (
              <span key={item.name}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.value}%</strong>
              </span>
            ))}
          </div>
        </article>

        <article className="portfolio-chart-card">
          <h3>Risk diversification</h3>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={portfolio.diversificationData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f9f8d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  )
}