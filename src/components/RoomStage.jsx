import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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

// The illustrated room: a stage sized to cover the viewport, panned and zoomed
// with a spring so each section's spot lands where the card leaves space.
export default function RoomStage() {
  const navigate = useNavigate()
  const activeSlug = useRoomStore((s) => s.activeSlug)
  const narrow = useRoomStore((s) => s.isNarrowViewport)
  const reducedMotion = useReducedMotion()
  const viewport = useViewport()
  const stageRef = useRef(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  const current = sections.find((s) => s.slug === activeSlug) ?? home
  const camera = useMemo(
    () => getCameraTransform(current.spot, ROOM_IMAGE, viewport, { narrow }),
    [current, viewport, narrow],
  )

  useEffect(() => {
    if (reducedMotion || narrow) return undefined
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      setParallax({ x: -nx * 18, y: -ny * 12 })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, narrow])

  return (
    <div className="room" aria-hidden="true">
      <motion.div
        ref={stageRef}
        className="room__stage"
        style={{ width: camera.width, height: camera.height, '--zoom': camera.zoom }}
        initial={false}
        animate={{ x: camera.x + parallax.x, y: camera.y + parallax.y, scale: camera.zoom }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 60, damping: 18, mass: 1.1 }
        }
      >
        <img
          className="room__image"
          src={ROOM_IMAGE.src}
          width={ROOM_IMAGE.width}
          height={ROOM_IMAGE.height}
          alt=""
        />
        <span className="room__glow room__glow--monitors" />
        <span className="room__glow room__glow--window" />

        <Avatar
          pose={current.pose}
          placement={current.avatar}
          onClick={() => navigate('/about')}
        />

        {sections.map((section) => (
          <button
            key={section.slug}
            type="button"
            className={`hotspot${activeSlug === section.slug ? ' hotspot--active' : ''}`}
            style={{ left: `${section.spot.x}%`, top: `${section.spot.y}%` }}
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
