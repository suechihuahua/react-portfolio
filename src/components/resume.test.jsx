import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home.jsx'
import Sidebar from './Sidebar.jsx'
import { person } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

describe('resume download', () => {
  beforeEach(() => useConsoleStore.setState({ activeSlug: null, paletteOpen: false }))

  it.each([
    ['Home', Home],
    ['Sidebar', Sidebar],
  ])('%s links to the resume with download', (_, Component) => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /résumé/i })
    expect(link).toHaveAttribute('href', person.resume)
    expect(link).toHaveAttribute('download')
  })
})
