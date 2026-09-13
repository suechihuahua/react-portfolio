import { Fragment, useMemo } from 'react'
import { Line } from '@react-three/drei'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getOrbit, orbitPosition } from './systemLayout.js'
import Planet from './Planet.jsx'

function OrbitRing({ orbit }) {
  const points = useMemo(
    () => Array.from({ length: 129 }, (_, i) => orbitPosition(orbit, (i / 128) * Math.PI * 2)),
    [orbit],
  )
  return <Line points={points} color="#4df1ff" transparent opacity={0.18} lineWidth={1} />
}

export default function OrbitSystem({ full }) {
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const system = useMemo(
    () => pages.map((page, i) => ({ page, orbit: getOrbit(i, pages.length, { narrow }) })),
    [narrow],
  )

  return (
    <group>
      {system.map(({ page, orbit }) => (
        <Fragment key={page.slug}>
          <OrbitRing orbit={orbit} />
          <Planet page={page} orbit={orbit} full={full} />
        </Fragment>
      ))}
    </group>
  )
}
