import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { AppSettings } from '../lib/types'

const SETTINGS_KEY = 'chainwatch-settings'

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  theme: 'light',
  notifications: {
    email: true,
    telegram: false,
    slack: false,
    criticalOnly: true,
  },
  webhookUrl: 'http://localhost:8000/v1/webhooks/receive',
}

function generateApiKey() {
  const segment = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return `cw_${segment()}${segment()}${segment()}`
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((current) => ({ ...current, ...patch }))
    },
    [setSettings],
  )

  const updateNotifications = useCallback(
    (patch: Partial<AppSettings['notifications']>) => {
      setSettings((current) => ({
        ...current,
        notifications: { ...current.notifications, ...patch },
      }))
    },
    [setSettings],
  )

  const regenerateApiKey = useCallback(() => {
    const apiKey = generateApiKey()
    setSettings((current) => ({ ...current, apiKey }))
    return apiKey
  }, [setSettings])

  const ensureApiKey = useCallback(() => {
    if (settings.apiKey) return settings.apiKey
    const apiKey = generateApiKey()
    setSettings((current) => ({ ...current, apiKey }))
    return apiKey
  }, [settings.apiKey, setSettings])

  return {
    settings,
    setSettings,
    updateSettings,
    updateNotifications,
    regenerateApiKey,
    ensureApiKey,
  }
}