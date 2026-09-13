import { AnimatePresence, motion } from 'framer-motion'

// The pose sprite, anchored by its bottom-centre at a point on the room, and
// cross-faded whenever the pose changes. A soft ground shadow sits under him
// instead of a per-frame drop-shadow filter.
export default function Avatar({ pose, placement, onClick }) {
  return (
    <div
      className="avatar"
      style={{ left: `${placement.x}%`, top: `${placement.y}%`, height: `${placement.height}%` }}
    >
      <span className="avatar__shadow" />
      <AnimatePresence initial={false}>
        <motion.img
          key={pose}
          className="avatar__sprite"
          src={`/room/pose-${pose}.png`}
          alt=""
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClick}
          data-pose={pose}
        />
      </AnimatePresence>
    </div>
  )
}
