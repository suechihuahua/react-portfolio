import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home.jsx'
import HUD from './HUD.jsx'
import { person } from '../content/site.js'
import { useSceneStore } from '../store/useSceneStore.js'

describe('resume download', () => {
  beforeEach(() => useSceneStore.setState({ activeSlug: null, simpleView: false }))

  it.each([
    ['Home', Home],
    ['HUD', HUD],
  ])('%s links to the resume with download', (_, Component) => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /résumé/i })
    expect(link).toHaveAttribute('href', person.resume)
    expect(link).toHaveAttribute('download')
  })
})
