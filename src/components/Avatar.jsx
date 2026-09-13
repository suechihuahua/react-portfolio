import { AnimatePresence, motion } from 'framer-motion'

// The pose sprite, anchored by its bottom-centre at a point on the room, and
// cross-faded whenever the pose changes.
export default function Avatar({ pose, placement, onClick }) {
  return (
    <div
      className="avatar"
      style={{ left: `${placement.x}%`, top: `${placement.y}%`, height: `${placement.height}%` }}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={pose}
          className="avatar__sprite"
          src={`/room/pose-${pose}.png`}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClick}
          data-pose={pose}
        />
      </AnimatePresence>
    </div>
  )
}
