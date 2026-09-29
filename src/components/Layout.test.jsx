import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import { useConsoleStore } from '../store/useConsoleStore.js'

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

  it('runs the welcome once, then shows the console', () => {
    vi.useFakeTimers()
    renderLayout()
    expect(screen.getByRole('status', { name: /welcome/i })).toBeInTheDocument()
    // The welcome drives itself from rAF, which the fake clock steps.
    for (let i = 0; i < 400; i += 1) act(() => vi.advanceTimersByTime(20))
    expect(useConsoleStore.getState().booted).toBe(true)
    expect(window.sessionStorage.getItem('nf:booted')).toBe('true')
    expect(screen.getByText('home content')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('skips the welcome on a key press', () => {
    renderLayout()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useConsoleStore.getState().booted).toBe(true)
    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('ignores Tab so the welcome does not swallow keyboard focus', () => {
    renderLayout()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(useConsoleStore.getState().booted).toBe(false)
  })

  it('lands straight in the content on a deep link, with no gate', () => {
    renderLayout('/about')
    expect(screen.queryByRole('status', { name: /welcome/i })).not.toBeInTheDocument()
    expect(screen.getByText('about content')).toBeInTheDocument()
    expect(useConsoleStore.getState().activeSlug).toBe('about')
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

  it('shows the sidebar and status bar once booted', () => {
    useConsoleStore.setState({ booted: true })
    renderLayout()
    expect(screen.getByRole('navigation', { name: /sections/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('steps to the first section on a wheel once booted', () => {
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
