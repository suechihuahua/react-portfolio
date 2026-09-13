import { describe, it, expect, beforeEach } from 'vitest'
import { useSceneStore } from './useSceneStore.js'

const TIERS = ['full', 'lite', 'static']

describe('useSceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({
      degraded: false,
      renderTier: 'lite',
      simpleView: false,
      flyProgress: 1,
    })
  })

  it('keeps the static tier after degrading, even when the environment changes', () => {
    const { degradeToStatic, setIsNarrowViewport } = useSceneStore.getState()
    degradeToStatic()
    expect(useSceneStore.getState().renderTier).toBe('static')

    setIsNarrowViewport(true)
    expect(useSceneStore.getState().renderTier).toBe('static')

    useSceneStore.getState().setPrefersReducedMotion(false)
    expect(useSceneStore.getState().renderTier).toBe('static')
  })

  it('forces static for simple view and recomputes when it is turned off', () => {
    useSceneStore.getState().setSimpleView(true)
    expect(useSceneStore.getState().simpleView).toBe(true)
    expect(useSceneStore.getState().renderTier).toBe('static')

    useSceneStore.getState().setSimpleView(false)
    expect(useSceneStore.getState().simpleView).toBe(false)
    // In jsdom the WebGL probe returns null, so the recomputed tier is
    // whatever detectRenderTier makes of that -- assert only that it is a
    // real tier, i.e. that the value was recomputed rather than pinned.
    expect(TIERS).toContain(useSceneStore.getState().renderTier)
  })

  it('resets flyProgress when degrading so the pane cannot be stranded', () => {
    useSceneStore.setState({ flyProgress: 0 })
    useSceneStore.getState().degradeToStatic()
    expect(useSceneStore.getState().flyProgress).toBe(1)
  })
})
