import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Welcome from './Welcome.jsx'
import { COMMAND, WELCOME_DURATION_MS } from '../lib/welcomeTimeline.js'
import { person } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

const step = (ms = WELCOME_DURATION_MS + 400) => {
  for (let i = 0; i < ms / 20; i += 1) act(() => vi.advanceTimersByTime(20))
}

describe('Welcome', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useConsoleStore.setState({ prefersReducedMotion: false })
  })

  afterEach(() => vi.useRealTimers())

  it('announces the name once for assistive tech', () => {
    render(<Welcome onDone={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: person.name })).toBeInTheDocument()
  })

  it('renders one span per command and name character', () => {
    const { container } = render(<Welcome onDone={() => {}} />)
    expect(container.querySelectorAll('.welcome__char')).toHaveLength(COMMAND.length)
    expect(container.querySelectorAll('.welcome__letter')).toHaveLength(
      person.name.toUpperCase().length,
    )
  })

  it('settles every name character by the end', () => {
    const { container } = render(<Welcome onDone={() => {}} />)
    step()
    const letters = [...container.querySelectorAll('.welcome__letter')]
    expect(letters.map((el) => el.textContent).join('')).toBe(person.name.toUpperCase())
  })

  it('finishes on its own once the sequence has run', () => {
    const onDone = vi.fn()
    render(<Welcome onDone={onDone} />)
    expect(onDone).not.toHaveBeenCalled()
    step()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips on a click anywhere, and only reports done once', () => {
    const onDone = vi.fn()
    const { container } = render(<Welcome onDone={onDone} />)
    fireEvent.click(container.querySelector('.welcome'))
    expect(onDone).toHaveBeenCalledTimes(1)
    step()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips from the skip button too', () => {
    const onDone = vi.fn()
    render(<Welcome onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips on any key except Tab', () => {
    const onDone = vi.fn()
    render(<Welcome onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('shows the finished card at once under reduced motion', () => {
    useConsoleStore.setState({ prefersReducedMotion: true })
    const onDone = vi.fn()
    const { container } = render(<Welcome onDone={onDone} />)
    const letters = [...container.querySelectorAll('.welcome__letter')]
    expect(letters.map((el) => el.textContent).join('')).toBe(person.name.toUpperCase())
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1400))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
