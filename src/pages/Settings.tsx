import { Copy, KeyRound, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { ThemeToggle } from '../components/ThemeToggle'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'
import type { ThemeMode } from '../lib/types'

export function Settings() {
  const { settings, updateSettings, updateNotifications, regenerateApiKey, ensureApiKey } = useSettings()
  const { setThemeMode } = useTheme()

  const handleGenerateKey = () => {
    const key = settings.apiKey ? regenerateApiKey() : ensureApiKey()
    toast.success('API key generated')
    return key
  }

  const copyApiKey = async () => {
    const key = settings.apiKey || ensureApiKey()
    await navigator.clipboard.writeText(key)
    toast.success('API key copied')
  }

  const handleThemeChange = (theme: ThemeMode) => {
    setThemeMode(theme)
  }

  return (
    <div className="page settings-page">
      <section className="panel">
        <SectionTitle icon={SettingsIcon} eyebrow="Settings" title="Account & preferences" />

        <div className="settings-section">
          <h3>
            <KeyRound size={18} aria-hidden="true" />
            API key
          </h3>
          <p className="settings-hint">Generate and persist an API key for the playground and webhook simulator.</p>
          <div className="settings-api-row">
            <input
              readOnly
              value={settings.apiKey || 'No key generated yet'}
              aria-label="API key"
              className="api-key-input"
            />
            <button type="button" className="secondary-button" onClick={handleGenerateKey}>
              <RefreshCw size={16} aria-hidden="true" />
              {settings.apiKey ? 'Regenerate' : 'Generate'}
            </button>
            <button type="button" className="icon-button" onClick={copyApiKey} aria-label="Copy API key">
              <Copy size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Theme preference</h3>
          <div className="settings-theme-row">
            <label className={settings.theme === 'light' ? 'active' : ''}>
              <input
                type="radio"
                name="theme"
                checked={settings.theme === 'light'}
                onChange={() => handleThemeChange('light')}
              />
              Light
            </label>
            <label className={settings.theme === 'dark' ? 'active' : ''}>
              <input
                type="radio"
                name="theme"
                checked={settings.theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
              />
              Dark
            </label>
            <ThemeToggle />
          </div>
        </div>

        <div className="settings-section">
          <h3>Notification toggles</h3>
          <div className="settings-toggles">
            <label>
              <span>
                <strong>Email alerts</strong>
                <small>Risk threshold breaches via email</small>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(event) => updateNotifications({ email: event.target.checked })}
              />
            </label>
            <label>
              <span>
                <strong>Telegram bot</strong>
                <small>Push alerts to Telegram channel</small>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications.telegram}
                onChange={(event) => updateNotifications({ telegram: event.target.checked })}
              />
            </label>
            <label>
              <span>
                <strong>Slack webhook</strong>
                <small>Post alerts to Slack workspace</small>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications.slack}
                onChange={(event) => updateNotifications({ slack: event.target.checked })}
              />
            </label>
            <label>
              <span>
                <strong>Critical only</strong>
                <small>Suppress watch-level notifications</small>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications.criticalOnly}
                onChange={(event) => updateNotifications({ criticalOnly: event.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Webhook URL</h3>
          <p className="settings-hint">Endpoint for outbound alert delivery and webhook simulator tests.</p>
          <input
            value={settings.webhookUrl}
            onChange={(event) => updateSettings({ webhookUrl: event.target.value })}
            placeholder="https://your-server.com/v1/webhooks/receive"
            spellCheck="false"
            aria-label="Webhook URL"
            className="webhook-url-input"
          />
        </div>
      </section>
    </div>
  )
}