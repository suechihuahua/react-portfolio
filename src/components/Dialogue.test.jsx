import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Dialogue, { CHAR_DELAY } from './Dialogue.jsx'
import { useRoomStore } from '../store/useRoomStore.js'

const LINES = ['Hello there.', 'Second line.']

describe('Dialogue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useRoomStore.setState({ voiceOn: false, prefersReducedMotion: false })
  })

  afterEach(() => vi.useRealTimers())

  it('types the first line character by character', () => {
    render(<Dialogue speaker="Natsuo" lines={LINES} onDone={() => {}} />)
    // Each character's timer is scheduled by an effect after the previous
    // tick commits, so advance one tick at a time.
    const tick = (n) => {
      for (let i = 0; i < n; i += 1) act(() => vi.advanceTimersByTime(CHAR_DELAY + 1))
    }
    tick(5)
    expect(screen.getByRole('dialog')).toHaveTextContent('Hello')
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Hello there.')
    tick(20)
    expect(screen.getByRole('dialog')).toHaveTextContent('Hello there.')
  })

  it('completes the line on click, then advances, then calls onDone', () => {
    const onDone = vi.fn()
    render(<Dialogue speaker="Natsuo" lines={LINES} onDone={onDone} />)
    const box = screen.getByRole('dialog').querySelector('.dialogue__box')
    fireEvent.click(box)
    expect(screen.getByRole('dialog')).toHaveTextContent('Hello there.')
    fireEvent.click(box)
    fireEvent.click(box)
    expect(screen.getByRole('dialog')).toHaveTextContent('Second line.')
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(box)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skip calls onDone immediately', () => {
    const onDone = vi.fn()
    render(<Dialogue speaker="Natsuo" lines={LINES} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'skip' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('speaks each line when voice is on', () => {
    const speak = vi.fn()
    const cancel = vi.fn()
    window.speechSynthesis = { speak, cancel }
    window.SpeechSynthesisUtterance = function Utterance(text) {
      this.text = text
    }
    useRoomStore.setState({ voiceOn: true })
    render(<Dialogue speaker="Natsuo" lines={LINES} onDone={() => {}} />)
    expect(speak).toHaveBeenCalledTimes(1)
    expect(speak.mock.calls[0][0].text).toBe('Hello there.')
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  it('shows the whole line at once under reduced motion', () => {
    useRoomStore.setState({ prefersReducedMotion: true })
    render(<Dialogue speaker="Natsuo" lines={LINES} onDone={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveTextContent('Hello there.')
  })
})
