import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has neither matchMedia nor a canvas implementation; the store and
// tier detection call both at module load.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }),
})

HTMLCanvasElement.prototype.getContext = () => null

// jsdom implements no scrolling, but the chapter rail keeps the active
// section in view on narrow screens.
Element.prototype.scrollIntoView = () => {}

afterEach(cleanup)
