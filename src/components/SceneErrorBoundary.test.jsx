import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SceneErrorBoundary from './SceneErrorBoundary.jsx'

function Boom() {
  throw new Error('webgl gone')
}

describe('SceneErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <SceneErrorBoundary onError={() => {}}>
        <p>scene</p>
      </SceneErrorBoundary>,
    )
    expect(screen.getByText('scene')).toBeInTheDocument()
  })

  it('calls onError and renders nothing when a child throws', () => {
    const onError = vi.fn()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <SceneErrorBoundary onError={onError}>
        <Boom />
      </SceneErrorBoundary>,
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(container).toBeEmptyDOMElement()
    spy.mockRestore()
  })
})
