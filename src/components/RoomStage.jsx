import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { ROOM_IMAGE, home, sections } from '../content/site.js'
import { useRoomStore } from '../store/useRoomStore.js'
import { getCameraTransform } from '../lib/camera.js'
import Avatar from './Avatar.jsx'

function useViewport() {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [viewport, setViewport] = useState(read)
  useEffect(() => {
    const onResize = () => setViewport(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}

const CAMERA_SPRING = { stiffness: 55, damping: 17, mass: 1 }
const PARALLAX_SPRING = { stiffness: 40, damping: 14 }

// The illustrated room: a stage sized to cover the viewport, panned and zoomed
// with springs so each section's spot lands where the card leaves space. All
// motion lives in motion values -- pointer parallax never re-renders React.
export default function RoomStage() {
  const navigate = useNavigate()
  const activeSlug = useRoomStore((s) => s.activeSlug)
  const narrow = useRoomStore((s) => s.isNarrowViewport)
  const reducedMotion = useReducedMotion()
  const viewport = useViewport()

  const current = sections.find((s) => s.slug === activeSlug) ?? home
  const camera = useMemo(
    () => getCameraTransform(current.spot, ROOM_IMAGE, viewport, { narrow }),
    [current, viewport, narrow],
  )

  const spring = reducedMotion ? { duration: 0 } : CAMERA_SPRING
  const camX = useSpring(useMotionValue(camera.x), spring)
  const camY = useSpring(useMotionValue(camera.y), spring)
  const scale = useSpring(useMotionValue(camera.zoom), spring)
  const parX = useSpring(useMotionValue(0), PARALLAX_SPRING)
  const parY = useSpring(useMotionValue(0), PARALLAX_SPRING)
  const x = useTransform([camX, parX], ([a, b]) => a + b)
  const y = useTransform([camY, parY], ([a, b]) => a + b)

  useEffect(() => {
    camX.set(camera.x)
    camY.set(camera.y)
    scale.set(camera.zoom)
  }, [camera, camX, camY, scale])

  useEffect(() => {
    if (reducedMotion || narrow) return undefined
    const onMove = (e) => {
      parX.set(-(e.clientX / window.innerWidth - 0.5) * 16)
      parY.set(-(e.clientY / window.innerHeight - 0.5) * 10)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, narrow, parX, parY])

  const showMarkers = !activeSlug

  return (
    <div className="room" aria-hidden="true">
      <motion.div
        className="room__stage"
        style={{ width: camera.width, height: camera.height, x, y, scale, '--zoom': camera.zoom }}
      >
        <img
          className="room__image"
          src={ROOM_IMAGE.src}
          width={ROOM_IMAGE.width}
          height={ROOM_IMAGE.height}
          alt=""
          decoding="async"
        />
        <span className="room__glow room__glow--monitors" />
        <span className="room__glow room__glow--window" />

        <Avatar pose={current.pose} placement={current.avatar} onClick={() => navigate('/about')} />

        {sections.map((section) => (
          <button
            key={section.slug}
            type="button"
            className={`hotspot${showMarkers ? '' : ' hotspot--hidden'}`}
            style={{ left: `${section.marker.x}%`, top: `${section.marker.y}%` }}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => navigate(`/${section.slug}`)}
          >
            <span className="hotspot__ring" />
            <span className="hotspot__label">{section.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}
