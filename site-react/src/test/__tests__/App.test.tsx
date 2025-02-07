// src/__tests__/App.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/utils/test-utils'
import App from '@/App'

describe('App', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />)
    expect(screen.getByText(/PAN-GO/i)).toBeInTheDocument()
  })

  it('renders home page by default', () => {
    renderWithProviders(<App />)
    expect(screen.getByText(/Functions of Human Genes/i)).toBeInTheDocument()
  })

  it('renders about page on /about route', () => {
    window.history.pushState({}, '', '/about')
    renderWithProviders(<App />)
    expect(screen.getByTestId('about-page')).toBeInTheDocument()
  })
})