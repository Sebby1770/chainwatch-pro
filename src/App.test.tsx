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
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute('href', '/api-playground')
  })
})