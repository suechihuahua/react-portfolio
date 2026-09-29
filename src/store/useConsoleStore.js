import { create } from 'zustand'

const canUseDom = typeof window !== 'undefined'
const BOOTED_KEY = 'nf:booted'

function readSession(key) {
  if (!canUseDom) return false
  try {
    return window.sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export const useConsoleStore = create((set) => ({
  // true once the boot lines have run (or been skipped) this session
  booted: readSession(BOOTED_KEY),
  paletteOpen: false,
  activeSlug: null,
  prefersReducedMotion: canUseDom
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false,

  finishBoot: () => {
    if (canUseDom) {
      try {
        window.sessionStorage.setItem(BOOTED_KEY, 'true')
      } catch {
        /* storage blocked */
      }
    }
    set({ booted: true })
  },
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setActiveSlug: (activeSlug) => set({ activeSlug }),
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),
}))

export function watchMediaPreferences() {
  if (!canUseDom) return () => {}
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onMotion = (e) => useConsoleStore.getState().setPrefersReducedMotion(e.matches)
  motion.addEventListener('change', onMotion)
  return () => motion.removeEventListener('change', onMotion)
}
