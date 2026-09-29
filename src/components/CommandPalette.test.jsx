import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import CommandPalette from './CommandPalette.jsx'
import { useConsoleStore } from '../store/useConsoleStore.js'
import { person } from '../content/site.js'

function Probe() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPalette() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Probe />
      <Routes>
        <Route path="*" element={<CommandPalette />} />
      </Routes>
    </MemoryRouter>,
  )
}

const input = () => screen.getByRole('textbox', { name: /search sections and actions/i })

describe('CommandPalette', () => {
  beforeEach(() => useConsoleStore.setState({ paletteOpen: true }))

  it('renders nothing while closed', () => {
    useConsoleStore.setState({ paletteOpen: false })
    renderPalette()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists every command and narrows as you type', () => {
    renderPalette()
    const before = screen.getAllByRole('option').length
    expect(before).toBeGreaterThan(6)
    fireEvent.change(input(), { target: { value: 'proj' } })
    const after = screen.getAllByRole('option')
    expect(after.length).toBeLessThan(before)
    expect(after[0]).toHaveTextContent('Projects')
  })

  it('navigates on Enter and closes', () => {
    renderPalette()
    fireEvent.change(input(), { target: { value: 'educ' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(screen.getByTestId('path')).toHaveTextContent('/education')
    expect(useConsoleStore.getState().paletteOpen).toBe(false)
  })

  it('moves the selection with the arrow keys and wraps around', () => {
    renderPalette()
    fireEvent.change(input(), { target: { value: 'e' } })
    const first = screen.getAllByRole('option')[0]
    expect(first).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    const options = screen.getAllByRole('option')
    expect(options.at(-1)).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape', () => {
    renderPalette()
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(useConsoleStore.getState().paletteOpen).toBe(false)
  })

  it('copies the email address without navigating away', () => {
    const writeText = vi.fn()
    Object.assign(navigator, { clipboard: { writeText } })
    renderPalette()
    fireEvent.change(input(), { target: { value: 'copy email' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(writeText).toHaveBeenCalledWith(person.email)
    expect(screen.getByTestId('path')).toHaveTextContent('/')
    expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
  })

  it('reports when nothing matches', () => {
    renderPalette()
    fireEvent.change(input(), { target: { value: 'zzzqqq' } })
    expect(screen.getByText('No matches')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
