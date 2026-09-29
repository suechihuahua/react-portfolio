import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChapterRail from './ChapterRail.jsx'
import { sections } from '../content/site.js'
import { useRoomStore } from '../store/useRoomStore.js'

function renderRail(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChapterRail />
    </MemoryRouter>,
  )
}

describe('ChapterRail', () => {
  beforeEach(() => useRoomStore.setState({ activeSlug: null, voiceOn: false }))

  it('numbers every section and lists the room first', () => {
    renderRail()
    expect(screen.getByRole('link', { name: /00\s*The room/ })).toBeInTheDocument()
    sections.forEach((section, i) => {
      const num = String(i + 1).padStart(2, '0')
      expect(
        screen.getByRole('link', { name: new RegExp(`${num}\\s*${section.label}`) }),
      ).toBeInTheDocument()
    })
  })

  it('marks the active section from the URL', () => {
    renderRail('/projects')
    const active = screen.getByRole('link', { name: /Projects/ })
    expect(active).toHaveAttribute('aria-current', 'page')
  })

  it('advances the progress bar with the active section', () => {
    const { container, unmount } = renderRail()
    const fill = () => container.querySelector('.progress__fill')
    expect(fill().style.getPropertyValue('--progress')).toBe('0')
    unmount()

    useRoomStore.setState({ activeSlug: sections.at(-1).slug })
    const last = renderRail(`/${sections.at(-1).slug}`)
    expect(
      last.container.querySelector('.progress__fill').style.getPropertyValue('--progress'),
    ).toBe('1')
  })

  it('toggles the voice setting', () => {
    renderRail()
    const toggle = screen.getByRole('button', { name: /voice/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(useRoomStore.getState().voiceOn).toBe(true)
  })
})
