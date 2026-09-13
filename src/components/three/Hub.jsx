import { lazy, Suspense } from 'react'
import { Html } from '@react-three/drei'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getPanelPosition } from './hubLayout.js'
import TerminalPanel from './TerminalPanel.jsx'
import HubCore from './HubCore.jsx'

const ProjectGraph = lazy(() => import('./ProjectGraph.jsx'))
const CourseStack = lazy(() => import('./CourseStack.jsx'))

const slugs = pages.map((p) => p.slug)

function ZoneLoading({ position }) {
  return (
    <Html center position={position} occlude={false}>
      <div className="node-label">loading...</div>
    </Html>
  )
}

export default function Hub() {
  const activeSlug = useSceneStore((s) => s.activeSlug)

  return (
    <group>
      <HubCore />

      {pages.map((page) => (
        <TerminalPanel
          key={page.slug}
          page={page}
          position={getPanelPosition(page.slug, slugs)}
        />
      ))}

      {activeSlug === 'projects' && (
        <Suspense fallback={<ZoneLoading position={getPanelPosition('projects', slugs)} />}>
          <ProjectGraph origin={getPanelPosition('projects', slugs)} />
        </Suspense>
      )}

      {activeSlug === 'courses' && (
        <Suspense fallback={<ZoneLoading position={getPanelPosition('courses', slugs)} />}>
          <CourseStack origin={getPanelPosition('courses', slugs)} />
        </Suspense>
      )}
    </group>
  )
}
