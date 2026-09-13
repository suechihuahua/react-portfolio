import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import { useSceneStore } from '../store/useSceneStore.js'

vi.mock('./three/Scene.jsx', () => ({
  default: () => <div data-testid="scene" />,
}))

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>home content</p>} />
          <Route path="about" element={<p>about content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  beforeEach(() => {
    useSceneStore.setState({
      booted: false,
      sceneReady: false,
      activeSlug: null,
      flyProgress: 1,
      renderTier: 'lite',
    })
  })

  it('shows the boot screen and mounts the scene on 3D tiers', async () => {
    renderLayout()
    expect(screen.getByRole('button', { name: /loading scene/ })).toBeInTheDocument()
    expect(await screen.findByTestId('scene')).toBeInTheDocument()
    expect(screen.queryByText('home content')).not.toBeInTheDocument()
  })

  it('skips the boot screen and shows the poster on the static tier', () => {
    useSceneStore.setState({ renderTier: 'static' })
    renderLayout()
    expect(screen.queryByRole('button', { name: /loading scene/ })).not.toBeInTheDocument()
    expect(document.querySelector('img.static-hero')).not.toBeNull()
    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('mirrors the URL into activeSlug', () => {
    useSceneStore.setState({ renderTier: 'static' })
    renderLayout('/about')
    expect(useSceneStore.getState().activeSlug).toBe('about')
  })
})
