import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  const stored = localStorage.getItem('chainwatch-settings')
  if (stored) {
    const settings = JSON.parse(stored) as { theme?: string }
    document.documentElement.setAttribute('data-theme', settings.theme === 'dark' ? 'dark' : 'light')
  }
} catch {
  document.documentElement.setAttribute('data-theme', 'light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
