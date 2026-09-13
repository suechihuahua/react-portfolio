import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useScrollNavigation, SCROLL_COOLDOWN_MS } from './useScrollNavigation.js'

const ROUTES = ['/', '/mercury', '/venus']

function Probe({ enabled = true }) {
  useScrollNavigation(ROUTES, enabled)
  return (
    <>
      <p data-testid="path">{useLocation().pathname}</p>
      <div className="overlay-pane__inner">
        <p data-testid="card">card text</p>
      </div>
    </>
  )
}

function renderAt(path, props) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Probe {...props} />
    </MemoryRouter>,
  )
}

describe('useScrollNavigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-13T00:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('steps to the next route on a downward wheel outside the card', () => {
    renderAt('/')
    fireEvent.wheel(window, { deltaY: 120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/mercury')
  })

  it('steps back on an upward wheel and stops at the ends', () => {
    renderAt('/mercury')
    fireEvent.wheel(window, { deltaY: -120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
    act(() => vi.advanceTimersByTime(SCROLL_COOLDOWN_MS + 1))
    fireEvent.wheel(window, { deltaY: -120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it('moves only one step per cooldown window', () => {
    renderAt('/')
    fireEvent.wheel(window, { deltaY: 120 })
    fireEvent.wheel(window, { deltaY: 120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/mercury')
    act(() => vi.advanceTimersByTime(SCROLL_COOLDOWN_MS + 1))
    fireEvent.wheel(window, { deltaY: 120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/venus')
  })

  it('ignores wheel events that start inside the content card', () => {
    renderAt('/')
    fireEvent.wheel(screen.getByTestId('card'), { deltaY: 120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it('steps with arrow and page keys', () => {
    renderAt('/')
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(screen.getByTestId('path')).toHaveTextContent('/mercury')
    act(() => vi.advanceTimersByTime(SCROLL_COOLDOWN_MS + 1))
    fireEvent.keyDown(window, { key: 'PageUp' })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it('steps on a vertical swipe outside the card', () => {
    renderAt('/')
    fireEvent.touchStart(window, { touches: [{ clientY: 400 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientY: 300 }] })
    expect(screen.getByTestId('path')).toHaveTextContent('/mercury')
  })

  it('does nothing while disabled', () => {
    renderAt('/', { enabled: false })
    fireEvent.wheel(window, { deltaY: 120 })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })
})
