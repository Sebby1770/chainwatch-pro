import clsx from 'clsx'
import { Braces, Play, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useUsageCounters } from '../hooks/useUsageCounters'
import { GRAPHQL_SAMPLES, executeMockGraphQL } from '../lib/graphql'

export function GraphQLPlayground() {
  const [selectedSample, setSelectedSample] = useState<string>(GRAPHQL_SAMPLES[0].id)
  const [query, setQuery] = useState<string>(GRAPHQL_SAMPLES[0].query)
  const [variablesText, setVariablesText] = useState<string>(JSON.stringify(GRAPHQL_SAMPLES[0].variables, null, 2))
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const { increment } = useUsageCounters()

  const sample = useMemo(
    () => GRAPHQL_SAMPLES.find((item) => item.id === selectedSample) ?? GRAPHQL_SAMPLES[0],
    [selectedSample],
  )

  const loadSample = (id: string) => {
    const next = GRAPHQL_SAMPLES.find((item) => item.id === id)
    if (!next) return
    setSelectedSample(id)
    setQuery(next.query)
    setVariablesText(JSON.stringify(next.variables, null, 2))
    setResponseText('')
  }

  const execute = async () => {
    setLoading(true)
    try {
      const variables = variablesText.trim() ? (JSON.parse(variablesText) as Record<string, unknown>) : {}
      await new Promise((resolve) => setTimeout(resolve, 350))
      const result = executeMockGraphQL(query, variables)
      setResponseText(JSON.stringify(result, null, 2))
      increment('apiCalls')
      toast.success('GraphQL query executed (mock)')
    } catch {
      setResponseText(JSON.stringify({ errors: [{ message: 'Invalid variables JSON' }] }, null, 2))
      toast.error('Invalid variables JSON')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page graphql-page">
      <section className="panel">
        <SectionTitle icon={Sparkles} eyebrow="GraphQL" title="Query playground" />
        <p className="api-intro">
          Mock GraphQL responses for wallet scans, vault intelligence, and contract audits.
          Connect a real GraphQL gateway in production.
        </p>
      </section>

      <section className="graphql-console">
        <aside className="panel endpoint-sidebar">
          {GRAPHQL_SAMPLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx('endpoint-button', { active: item.id === selectedSample })}
              onClick={() => loadSample(item.id)}
            >
              <span className="method">QUERY</span>
              <span>{item.label}</span>
              <small>{item.id}</small>
            </button>
          ))}
        </aside>

        <div className="api-editor panel">
          <div className="api-editor-header">
            <strong>
              <Braces size={16} aria-hidden="true" /> {sample.label}
            </strong>
            <button type="button" className="primary-button" onClick={execute} disabled={loading}>
              <Play size={16} aria-hidden="true" />
              {loading ? 'Running...' : 'Run query'}
            </button>
          </div>

          <label className="api-body-label">
            <span>Query</span>
            <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={12} spellCheck="false" />
          </label>

          <label className="api-body-label">
            <span>Variables (JSON)</span>
            <textarea
              value={variablesText}
              onChange={(event) => setVariablesText(event.target.value)}
              rows={6}
              spellCheck="false"
            />
          </label>

          <div className="api-response">
            <div className="api-response-header">
              <span>Response</span>
            </div>
            <pre>{responseText || 'Run a sample query to see the mock response.'}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}