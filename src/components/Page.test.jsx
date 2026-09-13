import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from './Page.jsx'
import { pageBySlug } from '../content/site.js'

describe('Page', () => {
  it('shows the planet name and an in-development note for empty planets', () => {
    render(<Page page={pageBySlug.saturn} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Saturn' })).toBeInTheDocument()
    expect(screen.getByText(/in development\.\.\./i)).toBeInTheDocument()
  })

  it('captions content pages with their planet', () => {
    render(<Page page={pageBySlug.about} />)
    expect(screen.getByRole('heading', { level: 1, name: 'About me' })).toBeInTheDocument()
    expect(screen.getByText('Earth')).toBeInTheDocument()
    expect(screen.queryByText(/in development/i)).not.toBeInTheDocument()
  })
})
