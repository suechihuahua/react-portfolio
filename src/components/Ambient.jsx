// The background: a slowly drifting grid and three soft colour fields.
// Everything animates on `transform` only, so it composites on the GPU and
// never repaints over the content. Held still under reduced motion.
export default function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__grid" />
      <span className="ambient__glow ambient__glow--mint" />
      <span className="ambient__glow ambient__glow--blue" />
      <span className="ambient__glow ambient__glow--violet" />
      <div className="ambient__vignette" />
    </div>
  )
}
