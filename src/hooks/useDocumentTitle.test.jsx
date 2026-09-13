import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useDocumentTitle } from './useDocumentTitle.js'

function Titled({ title }) {
  useDocumentTitle(title)
  return null
}

describe('useDocumentTitle', () => {
  it('sets and updates document.title', () => {
    const { rerender } = render(<Titled title="Natsuo Fujita — portfolio" />)
    expect(document.title).toBe('Natsuo Fujita — portfolio')
    rerender(<Titled title="Natsuo Fujita — About me" />)
    expect(document.title).toBe('Natsuo Fujita — About me')
  })
})
