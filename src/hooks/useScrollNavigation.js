import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const SCROLL_COOLDOWN_MS = 900
const WHEEL_THRESHOLD = 24
const SWIPE_THRESHOLD = 60
const SCROLL_CONTAINER = '.overlay-pane__inner, .dialogue'

// One planet per gesture: wheel, vertical swipe, or arrow/page keys step
// through `routes` in order. Gestures that start inside the content card are
// left alone so long sections can still be scrolled.
export function useScrollNavigation(routes, enabled = true) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const lastNav = useRef(0)
  const touchStartY = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined

    const step = (direction) => {
      const now = Date.now()
      if (now - lastNav.current < SCROLL_COOLDOWN_MS) return
      const index = routes.indexOf(pathname)
      const next = Math.min(routes.length - 1, Math.max(0, index + direction))
      if (next === index) return
      lastNav.current = now
      navigate(routes[next])
    }

    const insideCard = (target) =>
      target instanceof Element && target.closest(SCROLL_CONTAINER) !== null

    const onWheel = (e) => {
      if (insideCard(e.target) || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return
      step(e.deltaY > 0 ? 1 : -1)
    }

    const onKey = (e) => {
      if (insideCard(e.target)) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') step(1)
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') step(-1)
    }

    const onTouchStart = (e) => {
      touchStartY.current = insideCard(e.target) ? null : e.touches[0].clientY
    }

    const onTouchEnd = (e) => {
      if (touchStartY.current === null) return
      const dy = touchStartY.current - e.changedTouches[0].clientY
      touchStartY.current = null
      if (Math.abs(dy) < SWIPE_THRESHOLD) return
      step(dy > 0 ? 1 : -1)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, routes, pathname, navigate])
}
