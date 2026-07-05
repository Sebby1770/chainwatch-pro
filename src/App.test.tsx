import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the home page with brand name', () => {
    render(<App />)
    expect(screen.getByText('ChainWatch Pro')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /risk scores/i })).toBeInTheDocument()
  })

  it('renders primary navigation links', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(nav).toBeInTheDocument()
    expect(nav.querySelector('a[href="/dashboard"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/watchlist"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/vaults"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/api-playground"]')).toBeInTheDocument()
  })
})