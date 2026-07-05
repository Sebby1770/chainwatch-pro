import { useEffect, useState } from 'react'
import { LIVE_ALERT_TEMPLATES } from '../lib/constants'
import type { ChainId, LiveAlert } from '../lib/types'
import { hashText } from '../lib/utils'

const ALERT_INTERVAL_MS = 5000

export function useLiveAlerts(chainId: ChainId, enabled = true) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([])

  useEffect(() => {
    if (!enabled) return

    const pushAlert = () => {
      const seed = hashText(`${chainId}-${Date.now()}`)
      const template = LIVE_ALERT_TEMPLATES[seed % LIVE_ALERT_TEMPLATES.length]
      const severity =
        template.severity === 'watch' && seed % 3 === 0
          ? 'critical'
          : template.severity

      const alert: LiveAlert = {
        id: `${Date.now()}-${seed}`,
        title: template.title,
        detail: template.detail,
        severity,
        chain: chainId,
        timestamp: Date.now(),
      }

      setAlerts((current) => [alert, ...current].slice(0, 12))
    }

    pushAlert()
    const interval = window.setInterval(pushAlert, ALERT_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chainId, enabled])

  return alerts
}