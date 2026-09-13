import { useEffect, useRef } from 'react'
import Typewriter from 'typewriter-effect'
import { person } from '../content/site.js'
import { useSceneStore } from '../store/useSceneStore.js'

// Full-screen terminal boot sequence shown once per session before the 3D hub
// resolves. Skippable by clicking or pressing any key. Reduced-motion visitors
// skip it entirely (see Layout.jsx).
export default function BootSequence() {
  const setBooted = useSceneStore((s) => s.setBooted)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setBooted(true)
  }

  useEffect(() => {
    const onKey = () => finish()
    const onClick = () => finish()
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="boot" role="presentation">
      <div className="boot__body">
        <Typewriter
          options={{ delay: 22, cursor: '_' }}
          onInit={(tw) => {
            tw.typeString('&gt; initializing session...')
              .pauseFor(280)
              .typeString('<br/>&gt; user: ' + person.name)
              .pauseFor(220)
              .typeString('<br/>&gt; ' + person.tagline)
              .pauseFor(500)
              .typeString('<br/><br/>&gt; press any key to continue_')
              .callFunction(() => {
                window.setTimeout(finish, 1400)
              })
              .start()
          }}
        />
      </div>
      <button type="button" className="boot__skip" onClick={finish}>
        skip [any key]
      </button>
    </div>
  )
}
