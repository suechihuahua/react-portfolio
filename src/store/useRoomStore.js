import { create } from 'zustand'

const canUseDom = typeof window !== 'undefined'
const ENTERED_KEY = 'nf:entered'
const VOICE_KEY = 'nf:voice'

function readSession(key) {
  if (!canUseDom) return false
  try {
    return window.sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeSession(key, value) {
  if (!canUseDom) return
  try {
    window.sessionStorage.setItem(key, String(value))
  } catch {
    /* storage blocked */
  }
}

export const useRoomStore = create((set) => ({
  // true once the visitor has walked through the door this session
  entered: readSession(ENTERED_KEY),
  activeSlug: null,
  // the dialogue for the current spot has finished (or was skipped)
  dialogueDone: false,
  voiceOn: readSession(VOICE_KEY),
  prefersReducedMotion: canUseDom
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false,
  isNarrowViewport: canUseDom ? window.matchMedia('(max-width: 768px)').matches : false,

  enter: () => {
    writeSession(ENTERED_KEY, true)
    set({ entered: true })
  },
  setActiveSlug: (activeSlug) => set({ activeSlug, dialogueDone: false }),
  finishDialogue: () => set({ dialogueDone: true }),
  setVoiceOn: (voiceOn) => {
    writeSession(VOICE_KEY, voiceOn)
    set({ voiceOn })
  },
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),
  setIsNarrowViewport: (isNarrowViewport) => set({ isNarrowViewport }),
}))

export function watchMediaPreferences() {
  if (!canUseDom) return () => {}
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const narrow = window.matchMedia('(max-width: 768px)')
  const onMotion = (e) => useRoomStore.getState().setPrefersReducedMotion(e.matches)
  const onNarrow = (e) => useRoomStore.getState().setIsNarrowViewport(e.matches)
  motion.addEventListener('change', onMotion)
  narrow.addEventListener('change', onNarrow)
  return () => {
    motion.removeEventListener('change', onMotion)
    narrow.removeEventListener('change', onNarrow)
  }
}
