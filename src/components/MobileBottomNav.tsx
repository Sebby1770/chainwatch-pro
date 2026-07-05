import clsx from 'clsx'
import { Bell, Home, LayoutDashboard, ScanSearch, Vault, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const mobileNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Wallet },
  { to: '/vaults', label: 'Vaults', icon: Vault },
  { to: '/scanner', label: 'Scanner', icon: ScanSearch },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => clsx('mobile-nav-item', { active: isActive })}
        >
          <item.icon size={20} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}