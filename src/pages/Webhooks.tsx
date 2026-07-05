import clsx from 'clsx'
import { Send, Webhook } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSettings } from '../hooks/useSettings'
import type { WebhookDeliveryLog } from '../lib/types'
import { formatTimeAgo } from '../lib/utils'

const LOG_KEY = 'chainwatch-webhook-log'

const DEFAULT_PAYLOAD = {
  event: 'risk.alert',
  severity: 'watch',
  chain: 'base',
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  message: 'Slippage exceeded 2.5% on swap route',
  risk_score: 52,
  timestamp: new Date().toISOString(),
}

export function Webhooks() {
  const { settings } = useSettings()
  const [log, setLog] = useLocalStorage<WebhookDeliveryLog[]>(LOG_KEY, [])
  const [payloadText, setPayloadText] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2))
  const [sending, setSending] = useState(false)

  const sendWebhook = async () => {
    setSending(true)
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>
    } catch {
      toast.error('Invalid JSON payload')
      setSending(false)
      return
    }

    const endpoint = settings.webhookUrl || 'http://localhost:8000/v1/webhooks/receive'
    const entry: WebhookDeliveryLog = {
      id: crypto.randomUUID(),
      payload,
      status: 'pending',
      responseCode: null,
      timestamp: Date.now(),
      endpoint,
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey ? { 'X-API-Key': settings.apiKey } : {}),
        },
        body: JSON.stringify(payload),
      })

      const delivered: WebhookDeliveryLog = {
        ...entry,
        status: response.ok ? 'delivered' : 'failed',
        responseCode: response.status,
      }

      setLog((current) => [delivered, ...current].slice(0, 50))
      toast[response.ok ? 'success' : 'error'](
        response.ok ? 'Webhook delivered' : `Delivery failed (${response.status})`,
      )
    } catch {
      const failed: WebhookDeliveryLog = {
        ...entry,
        status: 'failed',
        responseCode: 0,
      }
      setLog((current) => [failed, ...current].slice(0, 50))
      toast.error('Could not reach webhook endpoint')
    } finally {
      setSending(false)
    }
  }

  const clearLog = () => {
    setLog([])
    toast.info('Delivery log cleared')
  }

  return (
    <div className="page webhooks-page">
      <section className="panel">
        <SectionTitle icon={Webhook} eyebrow="Webhooks" title="Webhook simulator" action="Test delivery" />

        <p className="api-intro">
          Send test payloads to your configured endpoint ({settings.webhookUrl || 'not set'}). Delivery history is stored in localStorage.
        </p>

        <label className="api-body-label">
          <span>Payload (JSON)</span>
          <textarea
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            rows={12}
            spellCheck="false"
          />
        </label>

        <div className="webhook-actions">
          <button type="button" className="primary-button" onClick={sendWebhook} disabled={sending}>
            <Send size={16} aria-hidden="true" />
            {sending ? 'Sending…' : 'Send test webhook'}
          </button>
          <button type="button" className="secondary-button" onClick={() => setPayloadText(JSON.stringify(DEFAULT_PAYLOAD, null, 2))}>
            Reset payload
          </button>
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={Webhook} eyebrow="Log" title="Delivery log" action={<button type="button" className="secondary-button small-btn" onClick={clearLog}>Clear</button>} />

        {log.length === 0 ? (
          <p className="empty-state">No webhook deliveries yet. Send a test payload above.</p>
        ) : (
          <div className="webhook-log">
            {log.map((entry) => (
              <article key={entry.id} className={clsx('webhook-log-row', entry.status)}>
                <div className="webhook-log-header">
                  <span className={clsx('status-pill', entry.status === 'delivered' ? 'healthy' : entry.status === 'failed' ? 'critical' : 'watch')}>
                    {entry.status}
                  </span>
                  <strong>{entry.responseCode ?? '—'}</strong>
                  <small>{formatTimeAgo(entry.timestamp)}</small>
                </div>
                <p>
                  <code>{entry.endpoint}</code>
                </p>
                <pre>{JSON.stringify(entry.payload, null, 2)}</pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}