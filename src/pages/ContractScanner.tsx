import clsx from 'clsx'
import { motion } from 'framer-motion'
import { FileCode2, Search, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useUsageCounters } from '../hooks/useUsageCounters'
import { chains } from '../lib/constants'
import { scanContract } from '../lib/contractScan'
import type { ChainId } from '../lib/types'

const SAMPLE_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

export function ContractScanner() {
  const [address, setAddress] = useState(SAMPLE_CONTRACT)
  const [chain, setChain] = useState<ChainId>('ethereum')
  const [scanNonce, setScanNonce] = useState(0)
  const { increment } = useUsageCounters()

  const result = useMemo(() => {
    if (!address.trim()) return null
    return scanContract(address.trim(), chain)
  }, [address, chain, scanNonce])

  const runScan = () => {
    if (!address.trim()) {
      toast.error('Enter a contract address')
      return
    }
    setScanNonce((value) => value + 1)
    increment('contractScans')
    increment('scans')
    toast.success('Contract scan complete')
  }

  return (
    <div className="page scanner-page">
      <section className="panel">
        <SectionTitle icon={FileCode2} eyebrow="Security" title="Contract scanner" />
        <div className="scanner-form">
          <label>
            <span>Contract address</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="0x..."
              spellCheck="false"
              aria-label="Contract address"
            />
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
          <button type="button" className="primary-button" onClick={runScan}>
            <Search size={16} aria-hidden="true" />
            Scan contract
          </button>
        </div>
      </section>

      {result ? (
        <motion.section
          className="scanner-results"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <article className="panel scanner-summary">
            <SectionTitle icon={ShieldAlert} eyebrow="Audit" title={result.contractName} action={`Grade ${result.riskGrade}`} />
            <div className="scanner-kpis">
              <div>
                <span>Audit score</span>
                <strong>{result.auditScore}/100</strong>
              </div>
              <div>
                <span>Verified</span>
                <strong>{result.isVerified ? 'Yes' : 'No'}</strong>
              </div>
              <div>
                <span>Proxy</span>
                <strong>{result.proxyDetected ? 'Detected' : 'None'}</strong>
              </div>
              <div>
                <span>Vulnerabilities</span>
                <strong>{result.vulnerabilities.length}</strong>
              </div>
            </div>
            <div className="compiler-info">
              <h3>Compiler info</h3>
              <dl>
                <div>
                  <dt>Version</dt>
                  <dd>{result.compiler.version}</dd>
                </div>
                <div>
                  <dt>Optimization</dt>
                  <dd>{result.compiler.optimization ? `Enabled (${result.compiler.runs} runs)` : 'Disabled'}</dd>
                </div>
                <div>
                  <dt>EVM</dt>
                  <dd>{result.compiler.evmVersion}</dd>
                </div>
                <div>
                  <dt>Scanned</dt>
                  <dd>{new Date(result.scannedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </article>

          <article className="panel">
            <SectionTitle icon={ShieldAlert} eyebrow="Findings" title="Vulnerability list" />
            <div className="vuln-list">
              {result.vulnerabilities.map((vuln, index) => (
                <div key={vuln.id} className={clsx('vuln-row', vuln.severity)} style={{ animationDelay: `${index * 40}ms` }}>
                  <span className="vuln-severity">{vuln.severity}</span>
                  <div>
                    <strong>{vuln.title}</strong>
                    <p>{vuln.detail}</p>
                    {vuln.line ? <small>Line {vuln.line}</small> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </motion.section>
      ) : null}
    </div>
  )
}