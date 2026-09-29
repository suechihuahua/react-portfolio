import { useCallback, useEffect } from 'react'

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined)

// Browser text-to-speech for the dialogue. No audio files; stops whenever the
// component that owns it unmounts or the line changes.
export function useSpeech(enabled) {
  const speak = useCallback(
    (text) => {
      const api = synth()
      if (!enabled || !api || !text) return
      api.cancel()
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      api.speak(utterance)
    },
    [enabled],
  )

  useEffect(() => () => synth()?.cancel(), [])

  return { speak, supported: Boolean(synth()) }
}
