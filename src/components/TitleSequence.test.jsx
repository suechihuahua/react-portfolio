import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TitleSequence from './TitleSequence.jsx'
import { ART_TIMEOUT_MS, INTRO_DURATION_MS, TITLE_TEXT } from '../lib/introTimeline.js'
import { useRoomStore } from '../store/useRoomStore.js'

// jsdom has no rAF clock of its own; drive it off the fake timers.
function installRaf() {
  let now = 0
  window.requestAnimationFrame = (cb) =>
    window.setTimeout(() => {
      now += 16
      cb(now)
    }, 16)
  window.cancelAnimationFrame = (id) => window.clearTimeout(id)
}

describe('TitleSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installRaf()
    useRoomStore.setState({ prefersReducedMotion: false })
  })

  afterEach(() => vi.useRealTimers())

  it('announces the name once for assistive tech', () => {
    render(<TitleSequence onDone={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Natsuo Fujita' })).toBeInTheDocument()
  })

  it('renders one word group per word and one span per visible character', () => {
    const { container } = render(<TitleSequence onDone={() => {}} />)
    const words = TITLE_TEXT.split(' ')
    expect(container.querySelectorAll('.intro__word')).toHaveLength(words.length)
    expect(container.querySelectorAll('.intro__letter')).toHaveLength(
      TITLE_TEXT.replaceAll(' ', '').length,
    )
  })

  it('staggers the reveal continuously across both words', () => {
    const { container } = render(<TitleSequence onDone={() => {}} />)
    const indices = [...container.querySelectorAll('.intro__letter')].map((el) =>
      Number(el.style.getPropertyValue('--i')),
    )
    expect(indices).toEqual(indices.map((_, i) => i))
  })

  it('waits for the artwork before the clock starts', async () => {
    const { container } = render(<TitleSequence onDone={() => {}} />)
    expect(container.querySelector('.intro').dataset.playing).toBeUndefined()
    // jsdom never fires load for these images, so the safety timeout opens the gate.
    await act(async () => vi.advanceTimersByTime(ART_TIMEOUT_MS + 20))
    expect(container.querySelector('.intro').dataset.playing).toBe('true')
  })

  it('finishes on its own once the sequence has run', async () => {
    const onDone = vi.fn()
    render(<TitleSequence onDone={onDone} />)
    await act(async () => vi.advanceTimersByTime(ART_TIMEOUT_MS + 20))
    expect(onDone).not.toHaveBeenCalled()
    await act(async () => vi.advanceTimersByTime(INTRO_DURATION_MS + 200))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips on a click and only reports done once', () => {
    const onDone = vi.fn()
    render(<TitleSequence onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /skip intro/i }))
    act(() => vi.advanceTimersByTime(INTRO_DURATION_MS + 200))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips on any key except Tab', () => {
    const onDone = vi.fn()
    render(<TitleSequence onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('holds a static card briefly under reduced motion', () => {
    useRoomStore.setState({ prefersReducedMotion: true })
    const onDone = vi.fn()
    const { container } = render(<TitleSequence onDone={onDone} />)
    // Painted at its open state rather than animated.
    expect(container.querySelector('.intro').style.getPropertyValue('--title')).not.toBe('')
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1500))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
