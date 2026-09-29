import { useEffect, useState } from 'react'
import { useRoomStore } from '../store/useRoomStore.js'
import { useSpeech } from '../hooks/useSpeech.js'

export const CHAR_DELAY = 28

// Visual-novel style box: types each line, click to complete the line or move
// on, and calls `onDone` after the last one. Mount with a `key` per section so
// the typing state starts fresh for every spot.
export default function Dialogue({ speaker, lines, onDone }) {
  const voiceOn = useRoomStore((s) => s.voiceOn)
  const reducedMotion = useRoomStore((s) => s.prefersReducedMotion)
  const { speak } = useSpeech(voiceOn)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(0)
  const line = lines[index] ?? ''
  const shown = reducedMotion ? line.length : Math.min(typed, line.length)
  const complete = shown >= line.length

  useEffect(() => {
    speak(line)
  }, [line, speak])

  useEffect(() => {
    if (complete) return undefined
    const timer = window.setTimeout(() => setTyped((n) => n + 1), CHAR_DELAY)
    return () => window.clearTimeout(timer)
  }, [shown, complete])

  const advance = () => {
    if (!complete) {
      setTyped(line.length)
      return
    }
    if (index + 1 < lines.length) {
      setIndex(index + 1)
      setTyped(0)
    } else {
      onDone()
    }
  }

  return (
    <div className="dialogue" role="dialog" aria-live="polite">
      <button type="button" className="dialogue__box" onClick={advance}>
        <span className="dialogue__speaker">{speaker}</span>
        <span className="dialogue__text">
          {line.slice(0, shown)}
          <span className="dialogue__caret" aria-hidden="true" />
        </span>
        <span className="dialogue__hint">
          {index + 1 < lines.length || !complete ? '▼' : 'continue'}
        </span>
      </button>
      <button type="button" className="dialogue__skip" onClick={onDone}>
        skip
      </button>
    </div>
  )
}
