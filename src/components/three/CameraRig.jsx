import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getPanelCameraTarget, HOME_CAMERA } from './hubLayout.js'

const slugs = pages.map((p) => p.slug)

// Flies the camera to the panel matching the current route, and gives it a
// gentle idle drift while parked at the hub. Position tweens run through gsap
// (time-based, so they're already frame-rate independent); the idle drift
// uses delta time directly for the same reason.
export default function CameraRig() {
  const { camera } = useThree()
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const prefersReducedMotion = useSceneStore((s) => s.prefersReducedMotion)
  const lookAt = useRef({ ...pointToVec(HOME_CAMERA.lookAt) })
  const elapsed = useRef(0)
  const tweensRef = useRef([])

  useEffect(() => {
    const target = activeSlug ? getPanelCameraTarget(activeSlug, slugs) : HOME_CAMERA
    const duration = prefersReducedMotion ? 0 : 1.5

    tweensRef.current.forEach((t) => t.kill())
    tweensRef.current = []

    const posTween = gsap.to(camera.position, {
      x: target.position[0],
      y: target.position[1],
      z: target.position[2],
      duration,
      ease: 'power3.inOut',
    })

    const lookTween = gsap.to(lookAt.current, {
      x: target.lookAt[0],
      y: target.lookAt[1],
      z: target.lookAt[2],
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.lookAt(lookAt.current.x, lookAt.current.y, lookAt.current.z)
      },
    })

    tweensRef.current = [posTween, lookTween]

    return () => {
      posTween.kill()
      lookTween.kill()
    }
  }, [activeSlug, prefersReducedMotion, camera])

  useFrame((_, delta) => {
    if (prefersReducedMotion || activeSlug) return
    elapsed.current += delta
    camera.position.x = HOME_CAMERA.position[0] + Math.sin(elapsed.current * 0.15) * 0.5
    camera.position.y = HOME_CAMERA.position[1] + Math.cos(elapsed.current * 0.11) * 0.18
    camera.lookAt(lookAt.current.x, lookAt.current.y, lookAt.current.z)
  })

  return null
}

function pointToVec([x, y, z]) {
  return { x, y, z }
}
