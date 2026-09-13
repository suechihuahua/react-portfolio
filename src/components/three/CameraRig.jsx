import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getCameraTarget, getHomeCamera } from './systemLayout.js'

const FLY_DURATION = 1.4

export default function CameraRig() {
  const { camera } = useThree()
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const focus = useSceneStore((s) => s.focus)
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const setFlyProgress = useSceneStore((s) => s.setFlyProgress)
  const lookAt = useRef({ x: 0, y: 0, z: 0 })
  const idle = useRef(0)
  const home = useMemo(() => getHomeCamera({ narrow }, pages.length), [narrow])

  useEffect(() => {
    let target
    if (!activeSlug) {
      target = home
    } else if (focus && focus.slug === activeSlug) {
      target = getCameraTarget(focus.position, focus.orbit)
    } else {
      return undefined // the planet has not reported its frozen position yet
    }

    idle.current = 0
    setFlyProgress(0)
    const progress = { t: 0 }
    const timeline = gsap.timeline({
      defaults: { duration: FLY_DURATION, ease: 'power3.inOut' },
      onUpdate: () => camera.lookAt(lookAt.current.x, lookAt.current.y, lookAt.current.z),
    })
    timeline.to(
      camera.position,
      { x: target.position[0], y: target.position[1], z: target.position[2] },
      0,
    )
    timeline.to(
      lookAt.current,
      { x: target.lookAt[0], y: target.lookAt[1], z: target.lookAt[2] },
      0,
    )
    timeline.to(progress, { t: 1, ease: 'none', onUpdate: () => setFlyProgress(progress.t) }, 0)

    return () => timeline.kill()
  }, [activeSlug, focus, narrow, home, camera, setFlyProgress])

  useFrame((_, delta) => {
    if (activeSlug) return
    if (useSceneStore.getState().flyProgress < 1) return
    idle.current += delta
    const ramp = Math.min(idle.current / 2, 1)
    camera.position.x = home.position[0] + Math.sin(idle.current * 0.12) * 0.6 * ramp
    camera.position.y = home.position[1] + Math.cos(idle.current * 0.09) * 0.25 * ramp
    camera.lookAt(0, 0, 0)
  })

  return null
}
