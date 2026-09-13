import { Fragment, useMemo } from 'react'
import { Line } from '@react-three/drei'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getOrbit, orbitPosition } from './systemLayout.js'
import { PLANETS } from './planets.js'
import Planet from './Planet.jsx'

function OrbitRing({ orbit }) {
  const points = useMemo(
    () => Array.from({ length: 161 }, (_, i) => orbitPosition(orbit, (i / 160) * Math.PI * 2)),
    [orbit],
  )
  return <Line points={points} color="#aab3c8" transparent opacity={0.28} lineWidth={1} />
}

export default function OrbitSystem({ full }) {
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const system = useMemo(
    () =>
      pages.map((page, i) => {
        const planet = PLANETS[page.planet]
        return { page, planet, orbit: getOrbit(i, pages.length, { narrow, size: planet.size }) }
      }),
    [narrow],
  )

  return (
    <group>
      {system.map(({ page, planet, orbit }) => (
        <Fragment key={page.slug}>
          <OrbitRing orbit={orbit} />
          <Planet page={page} orbit={orbit} planet={planet} full={full} />
        </Fragment>
      ))}
    </group>
  )
}
