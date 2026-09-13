import { useEffect, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore.js'

const LINES = ["> Fujita Natsuo's portfolio", '> press any key to continue']
const CHAR_DELAY = 28
const LINE_PAUSE = 450
const SCENE_TIMEOUT = 6000

export default function BootSequence() {
  const setBooted = useSceneStore((s) => s.setBooted)
  const sceneReady = useSceneStore((s) => s.sceneReady)
  const [typed, setTyped] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [wantsContinue, setWantsContinue] = useState(false)
  const ready = sceneReady || timedOut

  useEffect(() => {
    const full = LINES.join('\n')
    let index = 0
    let timer
    const tick = () => {
      index += 1
      setTyped(full.slice(0, index))
      if (index >= full.length) return
      timer = window.setTimeout(tick, full[index - 1] === '\n' ? LINE_PAUSE : CHAR_DELAY)
    }
    timer = window.setTimeout(tick, CHAR_DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), SCENE_TIMEOUT)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const request = () => setWantsContinue(true)
    window.addEventListener('keydown', request)
    window.addEventListener('pointerdown', request)
    return () => {
      window.removeEventListener('keydown', request)
      window.removeEventListener('pointerdown', request)
    }
  }, [])

  useEffect(() => {
    if (wantsContinue && ready) setBooted(true)
  }, [wantsContinue, ready, setBooted])

  return (
    <div className="boot" role="presentation">
      <pre className="boot__body" aria-live="polite">
        {typed}
        <span className="boot__caret" aria-hidden="true" />
      </pre>
      <button
        type="button"
        className="boot__skip"
        disabled={!ready}
        onClick={() => setWantsContinue(true)}
      >
        {ready ? 'continue' : 'loading scene…'}
      </button>
    </div>
  )
}
