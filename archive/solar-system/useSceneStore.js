import { create } from 'zustand'
import { detectRenderTier, readEnvironment } from '../lib/renderTier.js'

const canUseDom = typeof window !== 'undefined'
const STORAGE_KEY = 'nf:simpleView'

const reducedMotionQuery = canUseDom
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null

const narrowViewportQuery = canUseDom ? window.matchMedia('(max-width: 768px)') : null

function readStoredSimpleView() {
  if (!canUseDom) return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function computeTier(simpleView) {
  if (!canUseDom) return 'static'
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'full' || forced === 'lite' || forced === 'static') return forced
  return detectRenderTier({ ...readEnvironment(window), simpleView })
}

// Every recompute path goes through this so a degraded (crashed) scene stays
// static no matter what the environment now says.
function tierFor(state, simpleView) {
  return state.degraded ? 'static' : computeTier(simpleView)
}

const initialSimpleView = readStoredSimpleView()

export const useSceneStore = create((set, get) => ({
  booted: false,
  sceneReady: false,
  activeSlug: null,
  hoveredSlug: null,
  focus: null,
  flyProgress: 1,
  effectsEnabled: true,
  prefersReducedMotion: reducedMotionQuery?.matches ?? false,
  isNarrowViewport: narrowViewportQuery?.matches ?? false,
  simpleView: initialSimpleView,
  renderTier: computeTier(initialSimpleView),
  degraded: false,
  dprScale: 1,

  setBooted: (booted) => set({ booted }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setActiveSlug: (activeSlug) => set({ activeSlug }),
  setHoveredSlug: (hoveredSlug) => set({ hoveredSlug }),
  setFocus: (focus) => set({ focus }),
  setFlyProgress: (flyProgress) => set({ flyProgress }),
  setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
  setDprScale: (dprScale) => set({ dprScale }),
  setPrefersReducedMotion: (prefersReducedMotion) =>
    set({ prefersReducedMotion, renderTier: tierFor(get(), get().simpleView) }),
  setIsNarrowViewport: (isNarrowViewport) =>
    set({ isNarrowViewport, renderTier: tierFor(get(), get().simpleView) }),
  setSimpleView: (simpleView) => {
    if (canUseDom) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(simpleView))
      } catch {
        /* storage blocked */
      }
    }
    // The Scene unmounts/remounts across this toggle; leaving flyProgress mid
    // flight would strand the overlay pane invisible.
    set({ simpleView, renderTier: tierFor(get(), simpleView), flyProgress: 1 })
  },
  // Sticky: once the scene has crashed we never resurrect it from a resize or
  // a media-query change.
  degradeToStatic: () => set({ degraded: true, renderTier: 'static', flyProgress: 1 }),
}))

export function watchMediaPreferences() {
  if (!canUseDom) return () => {}

  const onMotionChange = (e) => useSceneStore.getState().setPrefersReducedMotion(e.matches)
  const onWidthChange = (e) => useSceneStore.getState().setIsNarrowViewport(e.matches)

  reducedMotionQuery.addEventListener('change', onMotionChange)
  narrowViewportQuery.addEventListener('change', onWidthChange)

  return () => {
    reducedMotionQuery.removeEventListener('change', onMotionChange)
    narrowViewportQuery.removeEventListener('change', onWidthChange)
  }
}
