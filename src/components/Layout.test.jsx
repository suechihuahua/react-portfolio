import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
          <Route path="*" element={<p>other content</p>} />
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

  it('reveals the pane on the static tier even with flyProgress stuck at 0', async () => {
    // The static tier has no camera flight, so a flyProgress left over from an
    // interrupted flight must not keep the pane hidden.
    useSceneStore.setState({ renderTier: 'static', flyProgress: 0 })
    renderLayout()
    expect(screen.getByText('home content')).toBeInTheDocument()
    const pane = document.getElementById('overlay-content')
    expect(pane).not.toBeNull()
    await waitFor(() => expect(pane.style.opacity).not.toBe('0'))
  })

  it('lists every contact link and the texture credit in the footer', () => {
    useSceneStore.setState({ renderTier: 'static' })
    renderLayout()
    expect(screen.getByRole('link', { name: 'fujita.natsuo@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:fujita.natsuo@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'natsuo001@e.ntu.edu.sg' })).toHaveAttribute(
      'href',
      'mailto:natsuo001@e.ntu.edu.sg',
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/natsuo-fujita',
    )
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Solar System Scope/ })).toBeInTheDocument()
  })

  it('steps to the first planet on a wheel once booted', () => {
    useSceneStore.setState({ renderTier: 'static' })
    renderLayout()
    expect(screen.getByText('home content')).toBeInTheDocument()
    // The wheel lands on the scene layer, outside the content card.
    fireEvent.wheel(document.querySelector('.scene-layer'), { deltaY: 120 })
    expect(useSceneStore.getState().activeSlug).toBe('mercury')
  })

  it('mirrors the URL into activeSlug', () => {
    useSceneStore.setState({ renderTier: 'static' })
    renderLayout('/about')
    expect(useSceneStore.getState().activeSlug).toBe('about')
  })
})
