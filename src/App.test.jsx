import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { pages } from './content/site.js'

vi.mock('./components/Layout.jsx', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})

describe('routes', () => {
  it.each(pages.map((p) => [p.slug, p.label]))('/%s renders its page heading', (slug, label) => {
    render(
      <MemoryRouter initialEntries={[`/${slug}`]}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
  })

  it('redirects unknown paths to home', () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Natsuo Fujita' })).toBeInTheDocument()
  })
})
