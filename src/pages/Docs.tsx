import { BookOpen, Code2, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'

const endpoints = [
  { method: 'POST', path: '/v1/scan', body: '{ address, chain, mode }', response: 'risk_score, health_score, portfolio_value' },
  { method: 'POST', path: '/v1/scan/contract', body: '{ address, chain }', response: 'audit_score, vulnerabilities, compiler' },
  { method: 'GET', path: '/v1/vaults', body: '—', response: 'vaults[] with apy, tvl, risk_score, auditors' },
  { method: 'GET', path: '/v1/usage', body: '—', response: 'api_calls, wallet_scans, alerts_sent, quota' },
  { method: 'GET', path: '/v1/alerts', body: '—', response: 'alerts[] with severity, chain, message' },
  { method: 'GET', path: '/health', body: '—', response: '{ status: "ok" }' },
]

export function Docs() {
  return (
    <div className="page docs-page">
      <section className="panel">
        <SectionTitle icon={Rocket} eyebrow="Quick start" title="Get up and running" />
        <div className="docs-content">
          <ol>
            <li>Clone the repo and run <code>npm install && npm run dev</code> for the frontend.</li>
            <li>Start the API stub: <code>cd backend && pip install -r requirements.txt && uvicorn app:app --reload</code></li>
            <li>Open <Link to="/api-playground">API Playground</Link> to test endpoints interactively.</li>
            <li>Add wallets to your <Link to="/watchlist">watchlist</Link> — persisted in localStorage.</li>
          </ol>
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={Code2} eyebrow="SDK" title="JavaScript SDK overview" />
        <div className="docs-content">
          <pre className="code-block">{`import { ChainWatchClient } from '@chainwatch/sdk'

const client = new ChainWatchClient({ apiKey: process.env.CHAINWATCH_API_KEY })

const scan = await client.scan({
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  chain: 'base',
  mode: 'balanced',
})

console.log(scan.risk_score, scan.health_score)`}</pre>
          <p>The SDK wraps the REST API with typed responses. Point it at <code>http://localhost:8000</code> during local development.</p>
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={BookOpen} eyebrow="Reference" title="Endpoint reference" />
        <div className="endpoint-table">
          <div className="endpoint-row header">
            <span>Method</span>
            <span>Path</span>
            <span>Body</span>
            <span>Response</span>
          </div>
          {endpoints.map((endpoint) => (
            <div key={endpoint.path} className="endpoint-row">
              <span className="method">{endpoint.method}</span>
              <span><code>{endpoint.path}</code></span>
              <span>{endpoint.body}</span>
              <span>{endpoint.response}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}