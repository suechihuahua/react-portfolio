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

  setBooted: (booted) => set({ booted }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setActiveSlug: (activeSlug) => set({ activeSlug }),
  setHoveredSlug: (hoveredSlug) => set({ hoveredSlug }),
  setFocus: (focus) => set({ focus }),
  setFlyProgress: (flyProgress) => set({ flyProgress }),
  setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
  setPrefersReducedMotion: (prefersReducedMotion) =>
    set({ prefersReducedMotion, renderTier: computeTier(get().simpleView) }),
  setIsNarrowViewport: (isNarrowViewport) =>
    set({ isNarrowViewport, renderTier: computeTier(get().simpleView) }),
  setSimpleView: (simpleView) => {
    if (canUseDom) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(simpleView))
      } catch {
        /* storage blocked */
      }
    }
    set({ simpleView, renderTier: computeTier(simpleView) })
  },
  degradeToStatic: () => set({ renderTier: 'static' }),
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
