import { create } from 'zustand'

const canUseDom = typeof window !== 'undefined'

export const useConsoleStore = create((set) => ({
  // The CRT loading page shows on every load, so this always starts false.
  booted: false,
  paletteOpen: false,
  activeSlug: null,
  prefersReducedMotion: canUseDom
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false,

  finishBoot: () => set({ booted: true }),
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
