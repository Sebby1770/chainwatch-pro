import clsx from 'clsx'
import { Play, Terminal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { API_ENDPOINTS } from '../lib/constants'
import { hashText, clamp } from '../lib/utils'

function mockResponse(endpointId: string, body: Record<string, unknown> | null) {
  if (endpointId === 'health') {
    return { status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }
  }

  if (endpointId === 'vaults') {
    return {
      vaults: [
        { name: 'Stablecoin Delta Vault', chain: 'base', apy: 8.4, risk: 22, capacity: '$8.1M' },
        { name: 'LST Loop Monitor', chain: 'ethereum', apy: 6.9, risk: 31, capacity: '$24.8M' },
        { name: 'Perps Funding Sweep', chain: 'arbitrum', apy: 14.7, risk: 57, capacity: '$3.7M' },
      ],
    }
  }

  if (endpointId === 'alerts') {
    return {
      alerts: [
        { id: '1', severity: 'watch', chain: 'base', message: 'Slippage exceeded 2.5% on swap route' },
        { id: '2', severity: 'critical', chain: 'ethereum', message: 'Contract admin role transferred' },
        { id: '3', severity: 'healthy', chain: 'arbitrum', message: 'Gas window efficient for batch' },
      ],
    }
  }

  const address = String(body?.address ?? '0x0')
  const chain = String(body?.chain ?? 'base')
  const mode = String(body?.mode ?? 'balanced')
  const seed = hashText(`${address}-${chain}-${mode}`)
  const modeDelta = mode === 'conservative' ? -7 : mode === 'aggressive' ? 9 : 0
  const baseRisk = chain === 'ethereum' ? 34 : chain === 'base' ? 24 : 29
  const riskScore = clamp(baseRisk + modeDelta + (seed % 43) - 13, 12, 94)

  return {
    address,
    chain,
    mode,
    risk_score: riskScore,
    health_score: clamp(105 - riskScore + (seed % 9) - 4, 8, 99),
    portfolio_value: 18000 + (seed % 420000),
    active_positions: 5 + (seed % 18),
    wallet_age_days: 80 + (seed % 1320),
  }
}

export function ApiPlayground() {
  const [selectedId, setSelectedId] = useState('scan')
  const [bodyText, setBodyText] = useState(
    JSON.stringify(API_ENDPOINTS[0].defaultBody, null, 2),
  )
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)

  const endpoint = useMemo(
    () => API_ENDPOINTS.find((item) => item.id === selectedId) ?? API_ENDPOINTS[0],
    [selectedId],
  )

  const selectEndpoint = (id: string) => {
    const next = API_ENDPOINTS.find((item) => item.id === id)
    if (!next) return
    setSelectedId(id)
    setBodyText(next.defaultBody ? JSON.stringify(next.defaultBody, null, 2) : '')
    setResponseText('')
    setStatus(null)
  }

  const execute = async () => {
    setLoading(true)
    const start = performance.now()

    try {
      let parsedBody: Record<string, unknown> | null = null
      if (endpoint.defaultBody !== null || bodyText.trim()) {
        parsedBody = bodyText.trim() ? (JSON.parse(bodyText) as Record<string, unknown>) : null
      }

      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))

      const data = mockResponse(endpoint.id, parsedBody)
      const elapsed = Math.round(performance.now() - start)

      setResponseText(JSON.stringify({ ...data, _meta: { latency_ms: elapsed, mock: true } }, null, 2))
      setStatus(200)
      toast.success(`${endpoint.method} ${endpoint.path} — 200 OK`)
    } catch {
      setStatus(400)
      setResponseText(JSON.stringify({ error: 'Invalid JSON body' }, null, 2))
      toast.error('Invalid JSON body')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page api-page">
      <section className="panel">
        <SectionTitle icon={Terminal} eyebrow="Console" title="Interactive API playground" />
        <p className="api-intro">
          Mock responses for <code>/v1/scan</code>, <code>/v1/vaults</code>, and <code>/v1/alerts</code>.
          Connect to the FastAPI backend at <code>http://localhost:8000</code> in production.
        </p>
      </section>

      <section className="api-console">
        <aside className="panel endpoint-sidebar">
          {API_ENDPOINTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx('endpoint-button', { active: item.id === selectedId })}
              onClick={() => selectEndpoint(item.id)}
            >
              <span className="method">{item.method}</span>
              <span>{item.path}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </aside>

        <div className="api-editor panel">
          <div className="api-editor-header">
            <strong>
              {endpoint.method} {endpoint.path}
            </strong>
            <button type="button" className="primary-button" onClick={execute} disabled={loading}>
              <Play size={16} aria-hidden="true" />
              {loading ? 'Sending...' : 'Send request'}
            </button>
          </div>

          {endpoint.defaultBody !== null || selectedId === 'scan' ? (
            <label className="api-body-label">
              <span>Request body (JSON)</span>
              <textarea
                value={bodyText}
                onChange={(event) => setBodyText(event.target.value)}
                rows={10}
                spellCheck="false"
              />
            </label>
          ) : (
            <p className="api-no-body">No request body required.</p>
          )}

          <div className="api-response">
            <div className="api-response-header">
              <span>Response</span>
              {status ? <span className={clsx('status-code', status === 200 ? 'ok' : 'err')}>{status}</span> : null}
            </div>
            <pre>{responseText || 'Click "Send request" to see the mock response.'}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}