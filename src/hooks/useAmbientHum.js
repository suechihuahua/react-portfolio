import { useEffect, useRef } from 'react'

// Very small ambient control-room drone, entirely synthesized (no audio
// asset to ship/manage). Only ever starts from a user gesture (the mute
// toggle itself), so it never fights browser autoplay policies.
export function useAmbientHum(muted) {
  const ctxRef = useRef(null)

  useEffect(() => {
    if (muted) return undefined

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return undefined

    const ctx = new AudioCtx()
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.value = 55
    osc2.type = 'sine'
    osc2.frequency.value = 82.4

    gain.gain.value = 0
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start()
    osc2.start()
    gain.gain.setTargetAtTime(0.03, ctx.currentTime, 0.8)

    ctxRef.current = ctx

    return () => {
      const stopTime = ctx.currentTime
      gain.gain.setTargetAtTime(0, stopTime, 0.15)
      window.setTimeout(() => {
        try {
          osc1.stop()
          osc2.stop()
          ctx.close()
        } catch {
          /* already stopped/closed */
        }
      }, 250)
      ctxRef.current = null
    }
  }, [muted])
}
