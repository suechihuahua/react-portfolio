import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import { useRoomStore } from '../store/useRoomStore.js'

vi.mock('./RoomStage.jsx', () => ({
  default: () => <div data-testid="room" />,
}))

vi.mock('./TitleSequence.jsx', () => ({
  default: ({ onDone }) => (
    <button type="button" data-testid="intro" onClick={onDone}>
      intro
    </button>
  ),
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
    useRoomStore.setState({
      introSeen: false,
      entered: false,
      activeSlug: null,
      dialogueDone: false,
    })
    window.sessionStorage.clear()
  })

  it('opens on the title sequence alone', () => {
    renderLayout()
    expect(screen.getByTestId('intro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open the door/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('room')).not.toBeInTheDocument()
    expect(screen.queryByText('home content')).not.toBeInTheDocument()
  })

  it('hands off from the title sequence to the door', () => {
    renderLayout()
    fireEvent.click(screen.getByTestId('intro'))
    expect(useRoomStore.getState().introSeen).toBe(true)
    expect(window.sessionStorage.getItem('nf:intro')).toBe('true')
    expect(screen.getByRole('button', { name: /open the door/i })).toBeInTheDocument()
    expect(screen.queryByText('home content')).not.toBeInTheDocument()
  })

  it('enters the room once the door opens', () => {
    useRoomStore.setState({ introSeen: true, prefersReducedMotion: true })
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: /open the door/i }))
    expect(useRoomStore.getState().entered).toBe(true)
    expect(screen.getByTestId('room')).toBeInTheDocument()
    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('skips both gates on a deep link and starts the dialogue', () => {
    renderLayout('/about')
    expect(screen.queryByTestId('intro')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open the door/i })).not.toBeInTheDocument()
    expect(useRoomStore.getState().activeSlug).toBe('about')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('about content')).not.toBeInTheDocument()
  })

  it('shows the card once the dialogue is skipped', () => {
    renderLayout('/about')
    fireEvent.click(screen.getByRole('button', { name: 'skip' }))
    expect(screen.getByText('about content')).toBeInTheDocument()
  })

  it('lists every contact link in the footer', () => {
    useRoomStore.setState({ introSeen: true, entered: true })
    renderLayout()
    expect(screen.getByRole('link', { name: 'fujita.natsuo@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:fujita.natsuo@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'natsuo001@e.ntu.edu.sg' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/natsuo-fujita',
    )
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
  })

  it('steps to the first section on a wheel once inside', () => {
    useRoomStore.setState({ introSeen: true, entered: true })
    renderLayout()
    fireEvent.wheel(screen.getByTestId('room'), { deltaY: 120 })
    expect(useRoomStore.getState().activeSlug).toBe('about')
  })
})
