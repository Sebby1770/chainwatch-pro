import clsx from 'clsx'
import { ClipboardCheck, FileSearch, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { chains } from '../lib/constants'
import { generateComplianceSummary } from '../lib/compliance'
import type { ChainId } from '../lib/types'
import { scoreLabel } from '../lib/utils'

export function Compliance() {
  const [address, setAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const [chain, setChain] = useState<ChainId>('base')
  const [nonce, setNonce] = useState(0)

  const chainMeta = chains.find((item) => item.id === chain) ?? chains[0]

  const report = useMemo(
    () => generateComplianceSummary(address, chain, chainMeta.baseRisk, 0, nonce),
    [address, chain, chainMeta.baseRisk, nonce],
  )

  const statusTone =
    report.overallStatus === 'flagged' ? 'critical' : report.overallStatus === 'review' ? 'watch' : 'healthy'

  const generateReport = () => {
    setNonce((value) => value + 1)
    toast.success('Compliance report generated')
  }

  return (
    <div className="page compliance-page">
      <section className="panel">
        <SectionTitle icon={ClipboardCheck} eyebrow="Compliance" title="Compliance report generator" />

        <div className="compliance-form">
          <label>
            <span>Wallet address</span>
            <div className="wallet-form">
              <div>
                <Wallet size={18} aria-hidden="true" />
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  spellCheck="false"
                  aria-label="Wallet address"
                />
              </div>
            </div>
          </label>

          <label>
            <span>Chain</span>
            <select value={chain} onChange={(event) => setChain(event.target.value as ChainId)}>
              {chains.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="primary-button" onClick={generateReport}>
            <FileSearch size={16} aria-hidden="true" />
            Generate report
          </button>
        </div>
      </section>

      <section className="panel compliance-report">
        <div className="compliance-report-header">
          <div>
            <span className="eyebrow">Summary</span>
            <h2>Mock compliance summary</h2>
            <p>
              <code>{report.address.slice(0, 12)}...{report.address.slice(-8)}</code> on {chainMeta.name}
            </p>
          </div>
          <span className={clsx('status-pill', statusTone)}>{report.overallStatus}</span>
        </div>

        <div className="compliance-meta">
          <div>
            <span>Risk score</span>
            <strong>{report.riskScore}/100</strong>
            <small>{scoreLabel(report.riskScore)}</small>
          </div>
          <div>
            <span>Sanctions</span>
            <strong>{report.sanctionsScreening}</strong>
          </div>
          <div>
            <span>Travel Rule</span>
            <strong>{report.travelRuleStatus}</strong>
          </div>
          <div>
            <span>Last audit</span>
            <strong>{report.lastAuditDate}</strong>
          </div>
        </div>

        <div className="compliance-checks">
          {report.checks.map((check) => (
            <article key={check.id} className={clsx('compliance-check', check.status)}>
              <div className="compliance-check-header">
                <strong>{check.label}</strong>
                <span className={clsx('status-pill', check.status === 'pass' ? 'healthy' : check.status === 'warn' ? 'watch' : 'critical')}>
                  {check.status}
                </span>
              </div>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>

        <p className="compliance-disclaimer">
          Demo compliance output for product evaluation. Replace with licensed screening providers before production use.
        </p>
      </section>
    </div>
  )
}