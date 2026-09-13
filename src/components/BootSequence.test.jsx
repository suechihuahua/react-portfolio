import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import BootSequence from './BootSequence.jsx'
import { useSceneStore } from '../store/useSceneStore.js'

describe('BootSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSceneStore.setState({ booted: false, sceneReady: false })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('types the two boot lines', () => {
    render(<BootSequence />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText(/> Fujita Natsuo's portfolio/)).toBeInTheDocument()
    expect(screen.getByText(/> press any key to continue/)).toBeInTheDocument()
  })

  it('does not finish on key press until the scene is ready', () => {
    render(<BootSequence />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useSceneStore.getState().booted).toBe(false)
    act(() => useSceneStore.getState().setSceneReady(true))
    expect(useSceneStore.getState().booted).toBe(true)
  })

  it('finishes on key press after the 6 s cap even if the scene never reports ready', () => {
    render(<BootSequence />)
    fireEvent.keyDown(window, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(6000))
    expect(useSceneStore.getState().booted).toBe(true)
  })

  it('labels the button as loading until ready', () => {
    render(<BootSequence />)
    expect(screen.getByRole('button')).toHaveTextContent('loading scene')
    act(() => useSceneStore.getState().setSceneReady(true))
    expect(screen.getByRole('button')).toHaveTextContent('continue')
  })
})
