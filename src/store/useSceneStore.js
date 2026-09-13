// Shared state for the 3D experience. Kept intentionally small: which zone the
// camera/overlay should be showing (driven by the current route), whether the
// visitor prefers a flat/simple rendering, and a couple of HUD toggles.
import { create } from 'zustand'

const canUseDom = typeof window !== 'undefined'

const reducedMotionQuery = canUseDom
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null

const narrowViewportQuery = canUseDom
  ? window.matchMedia('(max-width: 720px)')
  : null

function readStoredSimpleView() {
  if (!canUseDom) return null
  const stored = window.localStorage.getItem('nf:simpleView')
  return stored === null ? null : stored === 'true'
}

const initialReducedMotion = reducedMotionQuery?.matches ?? false

export const useSceneStore = create((set) => ({
  // true once the boot sequence has finished (or been skipped)
  booted: false,
  // slug of the page the camera/overlay is focused on; null === hub/home
  activeSlug: null,
  // slug of the panel currently hovered/focused in the 3D hub
  hoveredSlug: null,
  // ambient ui sound; starts muted so nothing autoplays without a gesture
  muted: true,
  prefersReducedMotion: initialReducedMotion,
  isNarrowViewport: narrowViewportQuery?.matches ?? false,
  // explicit accessibility/perf escape hatch: renders the flat 2D layout
  simpleView: readStoredSimpleView() ?? initialReducedMotion,

  setBooted: (booted) => set({ booted }),
  setActiveSlug: (activeSlug) => set({ activeSlug }),
  setHoveredSlug: (hoveredSlug) => set({ hoveredSlug }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),
  setIsNarrowViewport: (isNarrowViewport) => set({ isNarrowViewport }),
  setSimpleView: (simpleView) => {
    if (canUseDom) window.localStorage.setItem('nf:simpleView', String(simpleView))
    set({ simpleView })
  },
}))

// Keep the store synced with live media-query changes (e.g. an OS setting
// flipped mid-session, or the window being resized/rotated).
export function watchMediaPreferences() {
  if (!canUseDom) return () => {}

  const onMotionChange = (e) =>
    useSceneStore.getState().setPrefersReducedMotion(e.matches)
  const onWidthChange = (e) =>
    useSceneStore.getState().setIsNarrowViewport(e.matches)

  reducedMotionQuery.addEventListener('change', onMotionChange)
  narrowViewportQuery.addEventListener('change', onWidthChange)

  return () => {
    reducedMotionQuery.removeEventListener('change', onMotionChange)
    narrowViewportQuery.removeEventListener('change', onWidthChange)
  }
}
