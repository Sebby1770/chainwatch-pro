import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Bell, LockKeyhole, Menu, ShieldCheck } from 'lucide-react'
import { MobileBottomNav } from './MobileBottomNav'
import { OnboardingTour } from './OnboardingTour'
import { ThemeToggle } from './ThemeToggle'
import { NavLink, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { NetworkBackground } from './NetworkBackground'
import '../App.css'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/vaults', label: 'Vaults' },
  { to: '/scanner', label: 'Scanner' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/webhooks', label: 'Webhooks' },
  { to: '/graphql', label: 'GraphQL' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/api-playground', label: 'API' },
  { to: '/settings', label: 'Settings' },
]

export function Layout() {
  return (
    <div className="app-shell">
      <div className="network-bg-wrap">
        <NetworkBackground />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>ChainWatch Pro</strong>
            <span>Web3 revenue intelligence</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => clsx({ active: isActive })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <ThemeToggle />
          <NavLink to="/alerts" className="icon-button" aria-label="Notifications" title="Notifications">
            <Bell size={18} aria-hidden="true" />
            <span>3</span>
          </NavLink>
          <button type="button" className="icon-button menu" aria-label="Open menu" title="Open menu">
            <Menu size={18} aria-hidden="true" />
          </button>
          <NavLink to="/pricing" className="primary-button">
            <LockKeyhole size={17} aria-hidden="true" />
            Start Pro
          </NavLink>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Outlet />
      </motion.main>

      <MobileBottomNav />
      <OnboardingTour />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}