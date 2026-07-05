import { useCallback, useEffect } from 'react'
import { useSettings } from './useSettings'
import type { ThemeMode } from '../lib/types'

export function useTheme() {
  const { settings, updateSettings } = useSettings()
  const theme = settings.theme

  const applyTheme = useCallback((mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: theme === 'light' ? 'dark' : 'light' })
  }, [theme, updateSettings])

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      updateSettings({ theme: mode })
    },
    [updateSettings],
  )

  return { theme, toggleTheme, setThemeMode }
}