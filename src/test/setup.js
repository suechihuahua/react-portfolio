import '@testing-library/jest-dom/vitest'

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
