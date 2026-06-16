import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

describe('App', () => {
  it('renders the brand name', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByRole('link', { name: /ChainWatch Pro/i })).toBeInTheDocument()
  })

  it('shows sign in button when not authenticated', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getAllByRole('button', { name: /Sign in/i }).length).toBeGreaterThan(0)
  })
})
