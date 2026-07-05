import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface UsageCounters {
  apiCalls: number
  scans: number
  alertsSent: number
  contractScans: number
  lastUpdated: number
}

const DEFAULT_COUNTERS: UsageCounters = {
  apiCalls: 0,
  scans: 0,
  alertsSent: 0,
  contractScans: 0,
  lastUpdated: Date.now(),
}

export type UsageCounterKey = keyof Omit<UsageCounters, 'lastUpdated'>

export function useUsageCounters() {
  const [counters, setCounters] = useLocalStorage<UsageCounters>('chainwatch-usage', DEFAULT_COUNTERS)

  const increment = useCallback(
    (key: UsageCounterKey, amount = 1) => {
      setCounters((current) => ({
        ...current,
        [key]: current[key] + amount,
        lastUpdated: Date.now(),
      }))
    },
    [setCounters],
  )

  const reset = useCallback(() => {
    setCounters({ ...DEFAULT_COUNTERS, lastUpdated: Date.now() })
  }, [setCounters])

  return { counters, increment, reset }
}