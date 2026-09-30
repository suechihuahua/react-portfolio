import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import { useConsoleStore } from '../store/useConsoleStore.js'

// The CRT page needs WebGL, which jsdom has none of; its own behaviour is
// covered by the crtPresets and bootScreen tests.
vi.mock('./CrtBoot.jsx', () => ({
  default: ({ onEnter }) => (
    <button type="button" data-testid="crt" onClick={onEnter}>
      loading
    </button>
  ),
}))

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>home content</p>} />
          <Route path="about" element={<p>about content</p>} />
          <Route path="*" element={<p>other content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  beforeEach(() => {
    useConsoleStore.setState({
      booted: false,
      paletteOpen: false,
      activeSlug: null,
      prefersReducedMotion: false,
    })
    window.sessionStorage.clear()
  })

  it('opens on the CRT loading page, with the console hidden behind it', () => {
    renderLayout()
    expect(screen.getByTestId('crt')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /sections/i })).not.toBeInTheDocument()
  })

  it('enters the console on a click', () => {
    renderLayout()
    fireEvent.click(screen.getByTestId('crt'))
    expect(useConsoleStore.getState().booted).toBe(true)
    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('shows the loading page on a deep link too, then lands on that route', () => {
    renderLayout('/about')
    expect(screen.getByTestId('crt')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('crt'))
    expect(screen.getByText('about content')).toBeInTheDocument()
    expect(useConsoleStore.getState().activeSlug).toBe('about')
  })

  it('remembers nothing between loads, so a fresh store shows it again', () => {
    // A refresh is a fresh store: `booted` is not persisted anywhere.
    renderLayout()
    fireEvent.click(screen.getByTestId('crt'))
    expect(window.sessionStorage.getItem('nf:booted')).toBeNull()
    expect(useConsoleStore.getInitialState().booted).toBe(false)
  })

  it('skips the loading page for capture runs', () => {
    render(
      <MemoryRouter initialEntries={['/?capture']}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<p>home content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('crt')).not.toBeInTheDocument()
    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('opens and closes the command palette with the keyboard shortcut', () => {
    useConsoleStore.setState({ booted: true })
    renderLayout()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog', { name: /command palette/i })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the sidebar and status bar once entered', () => {
    useConsoleStore.setState({ booted: true })
    renderLayout()
    expect(screen.getByRole('navigation', { name: /sections/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('steps to the first section on a wheel once entered', () => {
    useConsoleStore.setState({ booted: true })
    renderLayout()
    fireEvent.wheel(screen.getByRole('main'), { deltaY: 120 })
    expect(useConsoleStore.getState().activeSlug).toBe('about')
  })

  it('leaves arrow keys to the palette while it is open', () => {
    useConsoleStore.setState({ booted: true, paletteOpen: true })
    renderLayout()
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(useConsoleStore.getState().activeSlug).toBeNull()
  })
})
