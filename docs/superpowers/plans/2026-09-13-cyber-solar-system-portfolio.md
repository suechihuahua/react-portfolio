# Cyber Solar System Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the control-room hub with a physically shaded cyber solar system hero (sun + orbiting section planets), add render tiers, lazy 3D loading, meta/OG, resume download, and Vercel deployment.

**Architecture:** Single persistent `<Layout>` route holds a lazily loaded React Three Fiber `<Scene>` (or a static poster on weak devices) behind plain-HTML HUD and overlay pane. The URL drives `activeSlug` in a zustand store; planets freeze when active and report their position so the camera rig can fly to them. Pure helpers (`renderTier.js`, `systemLayout.js`) hold every decision that needs unit tests.

**Tech Stack:** React 19, Vite 8, react-router 7, zustand 5, three 0.186, @react-three/fiber 9, @react-three/drei 10, @react-three/postprocessing 3, gsap, maath, framer-motion; Vitest + Testing Library (jsdom) for tests; Playwright (Chromium) for captures/screenshots; Vercel + @vercel/analytics.

**Spec:** `docs/superpowers/specs/2026-09-13-cyber-solar-system-portfolio-design.md`

## Global Constraints

- Work only in the worktree `C:\Projects\React-portfolio\.claude\worktrees\agent-af640168a247859cb` on branch `feature/cyber-solar-system`. Never `cd` to the repo root until the final merge task.
- No downloaded 3D models, HDR files, or textures. All geometry, lighting, and textures are procedural.
- The initial JS chunk (`dist/assets/index-*.js`) must not contain three.js. `three`, `@react-three/*`, `postprocessing`, `maath`, `gsap` go in a `vendor-three` chunk loaded only by the lazy `Scene`.
- Render tiers are exactly `'full' | 'lite' | 'static'`, decided by `detectRenderTier(env)` in `src/lib/renderTier.js`.
- Palette tokens (copy verbatim): `--bg: #06040c`, `--haze: #1b1035`, `--ink: #e6e9f2`, `--ink-soft: #8f93a8`, `--accent: #4df1ff`, `--sun: #ffb347`.
- Monospace font stack: `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`. Display/text fonts unchanged (Fraunces, Hanken Grotesque).
- Boot screen copy is exactly two lines: `> Fujita Natsuo's portfolio` and `> press any key to continue` (the blinking caret supplies the trailing `_`). No tagline, no `user:` line.
- Boot completes when the visitor presses a key/clicks AND (`sceneReady` OR 6000 ms elapsed).
- Content pane fade-in begins when `flyProgress >= 0.6`.
- Breakpoint for compact HUD / bottom-sheet pane / lite tier viewport check: `768px`.
- `person.resume` is `'/resume.pdf'`; resume links use the `download` attribute.
- Commit after every task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Run `npm run lint` before each commit; it must pass.

---

### Task 1: Test tooling and dependency cleanup

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/test/setup.js`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: `npm test` (Vitest, jsdom, `src/test/setup.js` loaded), a `matchMedia` stub and a `HTMLCanvasElement.getContext` stub available in every test.

- [ ] **Step 1: Install test dependencies and remove unused ones**

```bash
npm uninstall leva r3f-perf lenis
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

If npm reports a peer conflict between `vitest` and `vite@8`, run `npm install -D vitest@^4` instead.

- [ ] **Step 2: Add the test script and Vitest config**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Write the test setup file**

Create `src/test/setup.js`:

```js
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
```

- [ ] **Step 4: Write a failing route test**

Create `src/App.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { pages } from './content/site.js'

vi.mock('./components/Layout.jsx', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})

describe('routes', () => {
  it.each(pages.map((p) => [p.slug, p.label]))('/%s renders its page heading', (slug, label) => {
    render(
      <MemoryRouter initialEntries={[`/${slug}`]}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
  })

  it('redirects unknown paths to home', () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Natsuo Fujita' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS (4 tests). If `Layout` mocking fails to resolve, confirm the relative path matches `src/App.jsx`'s import (`./components/Layout.jsx`).

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add package.json package-lock.json vite.config.js src/test/setup.js src/App.test.jsx
git commit -m "Add Vitest + Testing Library and drop unused 3D dev deps

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Render tier detection and store rewrite

**Files:**
- Create: `src/lib/renderTier.js`
- Test: `src/lib/renderTier.test.js`
- Modify: `src/store/useSceneStore.js` (full rewrite)
- Delete: `src/hooks/useAmbientHum.js`
- Modify: `src/components/HUD.jsx` (remove sound toggle + hook import only; full restyle comes in Task 8)

**Interfaces:**
- Produces: `detectRenderTier(env) -> 'full'|'lite'|'static'`, `readEnvironment(win) -> env`.
- Produces store fields: `booted, sceneReady, activeSlug, hoveredSlug, focus, flyProgress, effectsEnabled, prefersReducedMotion, isNarrowViewport, simpleView, renderTier` and setters `setBooted, setSceneReady, setActiveSlug, setHoveredSlug, setFocus, setFlyProgress, setEffectsEnabled, setPrefersReducedMotion, setIsNarrowViewport, setSimpleView, degradeToStatic`, plus `watchMediaPreferences()`.
- `focus` shape: `null | { slug: string, position: [x, y, z], orbit: Orbit }` (Orbit defined in Task 5).
- URL override: `?tier=full|lite|static` forces the tier (used by capture/screenshot scripts).

- [ ] **Step 1: Write the failing tier tests**

Create `src/lib/renderTier.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { detectRenderTier } from './renderTier.js'

const strong = {
  webgl2: true,
  reducedMotion: false,
  simpleView: false,
  viewportWidth: 1440,
  cores: 8,
  deviceMemory: 8,
  saveData: false,
}

describe('detectRenderTier', () => {
  it('returns full for a strong desktop', () => {
    expect(detectRenderTier(strong)).toBe('full')
  })

  it.each([
    ['no webgl2', { webgl2: false }],
    ['reduced motion', { reducedMotion: true }],
    ['simple view toggle', { simpleView: true }],
  ])('returns static for %s', (_, override) => {
    expect(detectRenderTier({ ...strong, ...override })).toBe('static')
  })

  it.each([
    ['narrow viewport', { viewportWidth: 768 }],
    ['few cores', { cores: 4 }],
    ['low memory', { deviceMemory: 4 }],
    ['save-data', { saveData: true }],
  ])('returns lite for %s', (_, override) => {
    expect(detectRenderTier({ ...strong, ...override })).toBe('lite')
  })

  it('static beats lite when both apply', () => {
    expect(detectRenderTier({ ...strong, viewportWidth: 375, reducedMotion: true })).toBe('static')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/renderTier.test.js`
Expected: FAIL — cannot resolve `./renderTier.js`.

- [ ] **Step 3: Implement renderTier.js**

Create `src/lib/renderTier.js`:

```js
export function detectRenderTier(env) {
  if (!env.webgl2 || env.reducedMotion || env.simpleView) return 'static'
  if (env.viewportWidth <= 768 || env.cores <= 4 || env.deviceMemory <= 4 || env.saveData) {
    return 'lite'
  }
  return 'full'
}

let webgl2Support = null

function supportsWebGL2(win) {
  if (webgl2Support !== null) return webgl2Support
  try {
    const canvas = win.document.createElement('canvas')
    webgl2Support = Boolean(canvas.getContext('webgl2'))
  } catch {
    webgl2Support = false
  }
  return webgl2Support
}

export function readEnvironment(win) {
  const nav = win.navigator
  return {
    webgl2: supportsWebGL2(win),
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    simpleView: false,
    viewportWidth: win.innerWidth,
    cores: nav.hardwareConcurrency ?? 8,
    deviceMemory: nav.deviceMemory ?? 8,
    saveData: nav.connection?.saveData ?? false,
  }
}
```

- [ ] **Step 4: Run the tier tests**

Run: `npx vitest run src/lib/renderTier.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Rewrite the store**

Replace `src/store/useSceneStore.js` with:

```js
import { create } from 'zustand'
import { detectRenderTier, readEnvironment } from '../lib/renderTier.js'

const canUseDom = typeof window !== 'undefined'
const STORAGE_KEY = 'nf:simpleView'

const reducedMotionQuery = canUseDom
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null

const narrowViewportQuery = canUseDom ? window.matchMedia('(max-width: 768px)') : null

function readStoredSimpleView() {
  if (!canUseDom) return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function computeTier(simpleView) {
  if (!canUseDom) return 'static'
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'full' || forced === 'lite' || forced === 'static') return forced
  return detectRenderTier({ ...readEnvironment(window), simpleView })
}

const initialSimpleView = readStoredSimpleView()

export const useSceneStore = create((set, get) => ({
  booted: false,
  sceneReady: false,
  activeSlug: null,
  hoveredSlug: null,
  focus: null,
  flyProgress: 1,
  effectsEnabled: true,
  prefersReducedMotion: reducedMotionQuery?.matches ?? false,
  isNarrowViewport: narrowViewportQuery?.matches ?? false,
  simpleView: initialSimpleView,
  renderTier: computeTier(initialSimpleView),

  setBooted: (booted) => set({ booted }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setActiveSlug: (activeSlug) => set({ activeSlug }),
  setHoveredSlug: (hoveredSlug) => set({ hoveredSlug }),
  setFocus: (focus) => set({ focus }),
  setFlyProgress: (flyProgress) => set({ flyProgress }),
  setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
  setPrefersReducedMotion: (prefersReducedMotion) =>
    set({ prefersReducedMotion, renderTier: computeTier(get().simpleView) }),
  setIsNarrowViewport: (isNarrowViewport) =>
    set({ isNarrowViewport, renderTier: computeTier(get().simpleView) }),
  setSimpleView: (simpleView) => {
    if (canUseDom) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(simpleView))
      } catch {
        /* storage blocked */
      }
    }
    set({ simpleView, renderTier: computeTier(simpleView) })
  },
  degradeToStatic: () => set({ renderTier: 'static' }),
}))

export function watchMediaPreferences() {
  if (!canUseDom) return () => {}

  const onMotionChange = (e) => useSceneStore.getState().setPrefersReducedMotion(e.matches)
  const onWidthChange = (e) => useSceneStore.getState().setIsNarrowViewport(e.matches)

  reducedMotionQuery.addEventListener('change', onMotionChange)
  narrowViewportQuery.addEventListener('change', onWidthChange)

  return () => {
    reducedMotionQuery.removeEventListener('change', onMotionChange)
    narrowViewportQuery.removeEventListener('change', onWidthChange)
  }
}
```

- [ ] **Step 6: Remove the ambient hum and its toggle**

Delete `src/hooks/useAmbientHum.js`.

In `src/components/HUD.jsx`: delete the line `import { useAmbientHum } from '../hooks/useAmbientHum.js'`, delete the three lines reading `muted`, `toggleMuted`, and `useAmbientHum(muted)`, and delete the whole `<button ... onClick={toggleMuted} ...>…</button>` element (the one whose text is `sound: off` / `sound: on`).

- [ ] **Step 7: Run all tests and lint**

Run: `npm test && npm run lint`
Expected: PASS. (The route tests still pass because `Layout` is mocked.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/renderTier.js src/lib/renderTier.test.js src/store/useSceneStore.js src/components/HUD.jsx
git rm -q src/hooks/useAmbientHum.js
git commit -m "Add render tier detection and rewrite scene store

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Boot sequence as loader

**Files:**
- Modify: `src/components/BootSequence.jsx` (full rewrite)
- Test: `src/components/BootSequence.test.jsx`
- Modify: `package.json` (remove `typewriter-effect`)

**Interfaces:**
- Consumes: store `sceneReady`, `setBooted`.
- Produces: `<BootSequence />` with no props; sets `booted = true` when done.

- [ ] **Step 1: Write the failing tests**

Create `src/components/BootSequence.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import BootSequence from './BootSequence.jsx'
import { useSceneStore } from '../store/useSceneStore.js'

describe('BootSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSceneStore.setState({ booted: false, sceneReady: false })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('types the two boot lines', () => {
    render(<BootSequence />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText(/> Fujita Natsuo's portfolio/)).toBeInTheDocument()
    expect(screen.getByText(/> press any key to continue/)).toBeInTheDocument()
  })

  it('does not finish on key press until the scene is ready', () => {
    render(<BootSequence />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useSceneStore.getState().booted).toBe(false)
    act(() => useSceneStore.getState().setSceneReady(true))
    expect(useSceneStore.getState().booted).toBe(true)
  })

  it('finishes on key press after the 6 s cap even if the scene never reports ready', () => {
    render(<BootSequence />)
    fireEvent.keyDown(window, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(6000))
    expect(useSceneStore.getState().booted).toBe(true)
  })

  it('labels the button as loading until ready', () => {
    render(<BootSequence />)
    expect(screen.getByRole('button')).toHaveTextContent('loading scene')
    act(() => useSceneStore.getState().setSceneReady(true))
    expect(screen.getByRole('button')).toHaveTextContent('continue')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/BootSequence.test.jsx`
Expected: FAIL (old component types different copy and finishes immediately).

- [ ] **Step 3: Rewrite BootSequence**

Replace `src/components/BootSequence.jsx` with:

```jsx
import { useEffect, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore.js'

const LINES = ["> Fujita Natsuo's portfolio", '> press any key to continue']
const CHAR_DELAY = 28
const LINE_PAUSE = 450
const SCENE_TIMEOUT = 6000

export default function BootSequence() {
  const setBooted = useSceneStore((s) => s.setBooted)
  const sceneReady = useSceneStore((s) => s.sceneReady)
  const [typed, setTyped] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [wantsContinue, setWantsContinue] = useState(false)
  const ready = sceneReady || timedOut

  useEffect(() => {
    const full = LINES.join('\n')
    let index = 0
    let timer
    const tick = () => {
      index += 1
      setTyped(full.slice(0, index))
      if (index >= full.length) return
      timer = window.setTimeout(tick, full[index - 1] === '\n' ? LINE_PAUSE : CHAR_DELAY)
    }
    timer = window.setTimeout(tick, CHAR_DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), SCENE_TIMEOUT)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const request = () => setWantsContinue(true)
    window.addEventListener('keydown', request)
    window.addEventListener('pointerdown', request)
    return () => {
      window.removeEventListener('keydown', request)
      window.removeEventListener('pointerdown', request)
    }
  }, [])

  useEffect(() => {
    if (wantsContinue && ready) setBooted(true)
  }, [wantsContinue, ready, setBooted])

  return (
    <div className="boot" role="presentation">
      <pre className="boot__body" aria-live="polite">
        {typed}
        <span className="boot__caret" aria-hidden="true" />
      </pre>
      <button
        type="button"
        className="boot__skip"
        disabled={!ready}
        onClick={() => setWantsContinue(true)}
      >
        {ready ? 'continue' : 'loading scene…'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Remove typewriter-effect**

```bash
npm uninstall typewriter-effect
```

- [ ] **Step 5: Run tests and lint**

Run: `npm test && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/BootSequence.jsx src/components/BootSequence.test.jsx
git commit -m "Make the boot screen a scene loader with simplified copy

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Lazy scene, static poster, error boundary, chunking

**Files:**
- Create: `src/components/StaticHero.jsx`
- Create: `src/components/SceneErrorBoundary.jsx`
- Test: `src/components/SceneErrorBoundary.test.jsx`
- Modify: `src/components/Layout.jsx` (full rewrite)
- Test: `src/components/Layout.test.jsx`
- Modify: `src/main.jsx`
- Modify: `vite.config.js` (manualChunks)
- Create: `scripts/check-bundle.mjs`
- Modify: `package.json` (`check:bundle` script)

**Interfaces:**
- Consumes: store from Task 2, `<BootSequence />` from Task 3, `<HUD />`, `<Scene />` at `src/components/three/Scene.jsx` (rewritten in Task 6; the old one still exists and builds until then).
- Produces: `<StaticHero />`, `<SceneErrorBoundary onError>{children}</SceneErrorBoundary>`, `<Layout />`, `npm run check:bundle`.

- [ ] **Step 1: Write the error boundary test**

Create `src/components/SceneErrorBoundary.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/SceneErrorBoundary.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the boundary and the poster**

Create `src/components/SceneErrorBoundary.jsx`:

```jsx
import { Component } from 'react'

export default class SceneErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
```

Create `src/components/StaticHero.jsx`:

```jsx
export default function StaticHero() {
  return <img className="static-hero" src="/hero-poster.jpg" alt="" />
}
```

- [ ] **Step 4: Run the boundary test**

Run: `npx vitest run src/components/SceneErrorBoundary.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing Layout tests**

Create `src/components/Layout.test.jsx`:

```jsx
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
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/components/Layout.test.jsx`
Expected: FAIL (current Layout renders the old simple-view shell / no poster).

- [ ] **Step 7: Rewrite Layout**

Replace `src/components/Layout.jsx` with:

```jsx
import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { pages, person } from '../content/site.js'
import { useSceneStore, watchMediaPreferences } from '../store/useSceneStore.js'
import HUD from './HUD.jsx'
import BootSequence from './BootSequence.jsx'
import StaticHero from './StaticHero.jsx'
import SceneErrorBoundary from './SceneErrorBoundary.jsx'

const Scene = lazy(() => import('./three/Scene.jsx'))

// Mounts once and persists across every route change, so the canvas never
// remounts on navigation -- only `activeSlug` changes.
export default function Layout() {
  const location = useLocation()
  const captureMode = new URLSearchParams(location.search).has('capture')

  const booted = useSceneStore((s) => s.booted)
  const setBooted = useSceneStore((s) => s.setBooted)
  const setActiveSlug = useSceneStore((s) => s.setActiveSlug)
  const renderTier = useSceneStore((s) => s.renderTier)
  const degradeToStatic = useSceneStore((s) => s.degradeToStatic)
  const revealed = useSceneStore((s) => s.flyProgress >= 0.6)

  const isStatic = renderTier === 'static'

  useEffect(() => watchMediaPreferences(), [])

  useEffect(() => {
    const slug = location.pathname.replace(/^\//, '') || null
    const match = pages.find((p) => p.slug === slug)
    setActiveSlug(match ? match.slug : null)
  }, [location.pathname, setActiveSlug])

  useEffect(() => {
    if ((isStatic || captureMode) && !booted) setBooted(true)
  }, [isStatic, captureMode, booted, setBooted])

  return (
    <div className="experience">
      <a className="skip-link" href="#overlay-content">
        Skip to content
      </a>

      <div className="scene-layer" aria-hidden="true">
        {isStatic ? (
          <StaticHero />
        ) : (
          <SceneErrorBoundary onError={degradeToStatic}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneErrorBoundary>
        )}
      </div>
      <div className="scanline-overlay" aria-hidden="true" />

      {!booted ? (
        <BootSequence />
      ) : captureMode ? null : (
        <>
          <HUD />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              className="overlay-pane"
              id="overlay-content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 14 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="overlay-pane__inner">
                <Outlet />
              </div>
            </motion.main>
          </AnimatePresence>

          <footer className="colophon">
            <span>{person.name}</span>
            <a href={`mailto:${person.email}`}>{person.email}</a>
            <a href={person.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </footer>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Run the Layout tests**

Run: `npx vitest run src/components/Layout.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Preload the scene chunk and split vendor code**

Replace `src/main.jsx` with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { useSceneStore } from './store/useSceneStore.js'

if (useSceneStore.getState().renderTier !== 'static') {
  import('./components/three/Scene.jsx')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/](three|@react-three|postprocessing|maath|gsap)[\\/]/.test(id)) {
            return 'vendor-three'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 10: Add the bundle check**

Create `scripts/check-bundle.mjs`:

```js
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist/assets'
const entry = readdirSync(dir).find((f) => /^index-.*\.js$/.test(f))
if (!entry) {
  console.error('check-bundle: no index-*.js chunk found in dist/assets')
  process.exit(1)
}
const source = readFileSync(join(dir, entry), 'utf8')
if (source.includes('WebGLRenderer')) {
  console.error(`check-bundle: three.js leaked into the initial chunk (${entry})`)
  process.exit(1)
}
const kb = (statSync(join(dir, entry)).size / 1024).toFixed(0)
console.log(`check-bundle: ok -- ${entry} is ${kb} kB and contains no three.js`)
```

In `package.json` `"scripts"`, add:

```json
"check:bundle": "vite build && node scripts/check-bundle.mjs"
```

- [ ] **Step 11: Verify the split, tests, and lint**

Run: `npm run check:bundle && npm test && npm run lint`
Expected: build succeeds, prints `check-bundle: ok`, `dist/assets` contains a `vendor-three-*.js` chunk, tests pass, lint passes.

- [ ] **Step 12: Commit**

```bash
git add src/components/StaticHero.jsx src/components/SceneErrorBoundary.jsx src/components/SceneErrorBoundary.test.jsx src/components/Layout.jsx src/components/Layout.test.jsx src/main.jsx vite.config.js scripts/check-bundle.mjs package.json
git commit -m "Lazy-load the 3D scene with static and error fallbacks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Orbital layout helpers

**Files:**
- Create: `src/components/three/systemLayout.js`
- Test: `src/components/three/systemLayout.test.js`

**Interfaces:**
- Produces:
  - `SUN_RADIUS = 1.1`
  - `getOrbit(index, total, { narrow }) -> Orbit` where `Orbit = { radius, inclination, startAngle, speed, size, material: 'ice'|'metal'|'molten' }`
  - `orbitPosition(orbit, angle) -> [x, y, z]`
  - `getCameraTarget(planetPosition, orbit) -> { position: [x,y,z], lookAt: [x,y,z] }`
  - `getHomeCamera({ narrow }, total) -> { position, lookAt }`

- [ ] **Step 1: Write the failing tests**

Create `src/components/three/systemLayout.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  SUN_RADIUS,
  getOrbit,
  orbitPosition,
  getCameraTarget,
  getHomeCamera,
} from './systemLayout.js'

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('getOrbit', () => {
  it('gives every page a distinct radius outside the sun', () => {
    const radii = [0, 1, 2].map((i) => getOrbit(i, 3).radius)
    expect(new Set(radii).size).toBe(3)
    radii.forEach((r) => expect(r).toBeGreaterThan(SUN_RADIUS * 2))
  })

  it('works with a single page', () => {
    const orbit = getOrbit(0, 1)
    expect(orbit.radius).toBeGreaterThan(0)
    expect(Number.isFinite(orbit.startAngle)).toBe(true)
  })

  it('cycles through the three materials', () => {
    expect([0, 1, 2, 3].map((i) => getOrbit(i, 4).material)).toEqual([
      'ice',
      'metal',
      'molten',
      'ice',
    ])
  })

  it('tightens orbits on narrow viewports', () => {
    expect(getOrbit(2, 3, { narrow: true }).radius).toBeLessThan(getOrbit(2, 3).radius)
  })
})

describe('orbitPosition', () => {
  it('stays at the orbit radius all the way round', () => {
    const orbit = getOrbit(1, 3)
    for (let k = 0; k < 8; k += 1) {
      const p = orbitPosition(orbit, (k / 8) * Math.PI * 2)
      expect(dist(p, [0, 0, 0])).toBeCloseTo(orbit.radius, 5)
    }
  })
})

describe('cameras', () => {
  it('parks the camera outside the planet, looking at it', () => {
    const orbit = getOrbit(0, 3)
    const planet = orbitPosition(orbit, 1.2)
    const cam = getCameraTarget(planet, orbit)
    expect(cam.lookAt).toEqual(planet)
    expect(dist(cam.position, planet)).toBeGreaterThan(orbit.size * 3)
  })

  it('pulls the home camera back on narrow viewports', () => {
    expect(getHomeCamera({ narrow: true }, 3).position[2]).toBeGreaterThan(
      getHomeCamera({ narrow: false }, 3).position[2],
    )
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/three/systemLayout.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement systemLayout.js**

Create `src/components/three/systemLayout.js`:

```js
export const SUN_RADIUS = 1.1

const BASE_ORBIT = 3.4
const ORBIT_GAP = 1.5
const MATERIALS = ['ice', 'metal', 'molten']

export function getOrbit(index, total, { narrow = false } = {}) {
  const scale = narrow ? 0.72 : 1
  const sign = index % 2 === 0 ? 1 : -1
  return {
    radius: (BASE_ORBIT + index * ORBIT_GAP) * scale,
    inclination: sign * (0.06 + index * 0.04),
    startAngle: (index * Math.PI * 2) / Math.max(total, 1) + Math.PI * 0.25,
    speed: 0.16 / (1 + index * 0.55),
    size: 0.32 + (index % 3) * 0.08,
    material: MATERIALS[index % MATERIALS.length],
  }
}

// Circle in the xz-plane rotated about the x-axis by the orbit's inclination.
export function orbitPosition(orbit, angle) {
  const x = Math.cos(angle) * orbit.radius
  const z = Math.sin(angle) * orbit.radius
  return [x, -z * Math.sin(orbit.inclination), z * Math.cos(orbit.inclination)]
}

export function getCameraTarget(planetPosition, orbit) {
  const [x, y, z] = planetPosition
  const outward = Math.hypot(x, z) || 1
  const ox = x / outward
  const oz = z / outward
  const back = orbit.size * 6 + 1.6
  return {
    position: [x + ox * back + oz * 0.8, y + 0.6 + orbit.size, z + oz * back - ox * 0.8],
    lookAt: [x, y, z],
  }
}

export function getHomeCamera({ narrow = false } = {}, total = 3) {
  const far = BASE_ORBIT + Math.max(total - 1, 0) * ORBIT_GAP
  return {
    position: [0, far * 0.75, far * (narrow ? 2.3 : 1.55)],
    lookAt: [0, 0, 0],
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/components/three/systemLayout.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/three/systemLayout.js src/components/three/systemLayout.test.js
git commit -m "Add orbital layout helpers for the solar system hub

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Scene rewrite — backdrop, sun, planets, camera

R3F components cannot render in jsdom, so this task is verified by `npm run check:bundle`, `npm run lint`, and a visual check in the browser.

**Files:**
- Modify: `src/components/three/Scene.jsx` (full rewrite)
- Create: `src/components/three/Starfield.jsx`
- Create: `src/components/three/GridHorizon.jsx`
- Create: `src/components/three/Nebula.jsx`
- Create: `src/components/three/Sun.jsx`
- Create: `src/components/three/Planet.jsx`
- Create: `src/components/three/OrbitSystem.jsx`
- Modify: `src/components/three/CameraRig.jsx` (full rewrite)
- Delete: `src/components/three/Hub.jsx`, `HubCore.jsx`, `TerminalPanel.jsx`, `ProjectGraph.jsx`, `CourseStack.jsx`, `GridFloor.jsx`, `ParticleField.jsx`, `hubLayout.js`

**Interfaces:**
- Consumes: store (Task 2), `systemLayout.js` (Task 5), `pages` from `site.js`.
- Produces: default export `<Scene />` (no props). Sets `sceneReady` on first frame; sets `focus` when a planet becomes active; drives `flyProgress` 0→1 during camera flights.
- CSS classes used by labels (styled in Task 8): `.planet-label`, `.planet-label--active`, `.planet-label__title`, `.planet-label__blurb`.

- [ ] **Step 1: Delete the old hub files**

```bash
git rm -q src/components/three/Hub.jsx src/components/three/HubCore.jsx src/components/three/TerminalPanel.jsx src/components/three/ProjectGraph.jsx src/components/three/CourseStack.jsx src/components/three/GridFloor.jsx src/components/three/ParticleField.jsx src/components/three/hubLayout.js
```

- [ ] **Step 2: Create the backdrop components**

Create `src/components/three/Starfield.jsx`:

```jsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random'

function Layer({ count, radius, size, opacity, spin, shell }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const buffer = new Float32Array(count * 3)
    return shell ? random.onSphere(buffer, { radius }) : random.inSphere(buffer, { radius })
  }, [count, radius, shell])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spin
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#dfe8ff"
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={opacity}
      />
    </Points>
  )
}

export default function Starfield({ full }) {
  return (
    <>
      <Layer count={full ? 2500 : 900} radius={70} size={0.14} opacity={0.75} spin={0.004} shell />
      <Layer count={full ? 600 : 200} radius={40} size={0.22} opacity={0.45} spin={0.012} />
    </>
  )
}
```

Create `src/components/three/GridHorizon.jsx`:

```jsx
import { Grid } from '@react-three/drei'

export default function GridHorizon() {
  return (
    <Grid
      position={[0, -3.2, 0]}
      args={[10, 10]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#173a4d"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#4df1ff"
      fadeDistance={55}
      fadeStrength={1.6}
      infiniteGrid
      followCamera={false}
    />
  )
}
```

Create `src/components/three/Nebula.jsx`:

```jsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from 'three'

const CLOUDS = [
  { color: 'rgba(120, 70, 220, 0.55)', position: [-14, 4, -30], scale: 42, drift: 0.02 },
  { color: 'rgba(40, 180, 230, 0.4)', position: [16, -2, -36], scale: 38, drift: -0.015 },
  { color: 'rgba(160, 60, 200, 0.35)', position: [4, 9, -44], scale: 50, drift: 0.01 },
]

function useGlowTexture(color) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [color])
}

function Cloud({ color, position, scale, drift }) {
  const texture = useGlowTexture(color)
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) ref.current.material.rotation = state.clock.elapsedTime * drift
  })

  return (
    <sprite ref={ref} position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        opacity={0.9}
      />
    </sprite>
  )
}

export default function Nebula() {
  return CLOUDS.map((cloud) => <Cloud key={cloud.position.join(',')} {...cloud} />)
}
```

- [ ] **Step 3: Create the Sun**

Create `src/components/three/Sun.jsx`:

```jsx
import { useRef, useState } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, MathUtils } from 'three'
import { SUN_RADIUS } from './systemLayout.js'

// Atmosphere glow: drawn on the back faces of a larger sphere so the core
// occludes the centre and only the halo between core edge and shell
// silhouette remains, fading outward.
const CoronaMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color('#ffb347'), uIntensity: 1 },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float facing = abs(dot(vNormal, vView));
      float flicker = 0.92 + 0.08 * sin(uTime * 1.7) * sin(uTime * 0.9 + 1.3);
      float a = pow(facing, 1.5) * flicker * uIntensity;
      gl_FragColor = vec4(uColor * a * 1.6, a);
    }
  `,
)

extend({ CoronaMaterial })

export default function Sun({ full }) {
  const coreRef = useRef()
  const coronaRef = useRef()
  const shellRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.05
      const pulse = 1 + Math.sin(t * 0.8) * 0.01
      coreRef.current.scale.setScalar(pulse)
      coreRef.current.material.emissiveIntensity = MathUtils.damp(
        coreRef.current.material.emissiveIntensity,
        hovered ? 2.6 : 2,
        4,
        delta,
      )
    }
    if (coronaRef.current) {
      coronaRef.current.uTime = t
      coronaRef.current.uIntensity = MathUtils.damp(
        coronaRef.current.uIntensity,
        hovered ? 1.3 : 1,
        4,
        delta,
      )
    }
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.08
      shellRef.current.rotation.x += delta * 0.03
    }
  })

  return (
    <group>
      <pointLight
        intensity={full ? 60 : 40}
        distance={40}
        decay={2}
        color="#ffc27a"
        castShadow={full}
        shadow-mapSize={[1024, 1024]}
      />

      <mesh
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#ff8c1a"
          emissive="#ff9a2e"
          emissiveIntensity={2}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh scale={1.6}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <coronaMaterial
          ref={coronaRef}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>

      {full && (
        <mesh ref={shellRef} scale={1.9}>
          <icosahedronGeometry args={[SUN_RADIUS, 1]} />
          <meshBasicMaterial color="#4df1ff" wireframe transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  )
}
```

- [ ] **Step 4: Create Planet and OrbitSystem**

Create `src/components/three/Planet.jsx`:

```jsx
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSceneStore } from '../../store/useSceneStore.js'
import { orbitPosition } from './systemLayout.js'

function PlanetMaterial({ kind, full }) {
  if (kind === 'ice') {
    return full ? (
      <meshPhysicalMaterial
        color="#bfe9ff"
        transmission={0.85}
        thickness={0.6}
        roughness={0.12}
        ior={1.4}
        clearcoat={1}
        envMapIntensity={1.2}
      />
    ) : (
      <meshPhysicalMaterial color="#9fd6f5" roughness={0.1} clearcoat={1} envMapIntensity={1.2} />
    )
  }
  if (kind === 'metal') {
    return <meshStandardMaterial color="#9aa4b8" metalness={1} roughness={0.35} envMapIntensity={1.4} />
  }
  return (
    <meshStandardMaterial color="#3a0f0f" emissive="#ff5a1f" emissiveIntensity={1.4} roughness={0.7} />
  )
}

export default function Planet({ page, orbit, full }) {
  const navigate = useNavigate()
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(orbit.startAngle)

  const activeSlug = useSceneStore((s) => s.activeSlug)
  const hoveredSlug = useSceneStore((s) => s.hoveredSlug)
  const setHoveredSlug = useSceneStore((s) => s.setHoveredSlug)
  const setFocus = useSceneStore((s) => s.setFocus)

  const isActive = activeSlug === page.slug
  const isHovered = hoveredSlug === page.slug
  const frozen = isActive || isHovered

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!frozen) angleRef.current += delta * orbit.speed
    const [x, y, z] = orbitPosition(orbit, angleRef.current)
    groupRef.current.position.set(x, y, z)
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4
  })

  useEffect(() => {
    if (!isActive) return
    const position = orbitPosition(orbit, angleRef.current)
    setFocus({ slug: page.slug, position, orbit })
  }, [isActive, orbit, page.slug, setFocus])

  const go = () => navigate(`/${page.slug}`)

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        castShadow={full}
        receiveShadow={full}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredSlug(page.slug)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHoveredSlug(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          go()
        }}
      >
        <sphereGeometry args={[orbit.size, 48, 48]} />
        <PlanetMaterial kind={orbit.material} full={full} />
      </mesh>

      {frozen && (
        <mesh scale={1.3}>
          <sphereGeometry args={[orbit.size, 20, 20]} />
          <meshBasicMaterial color="#4df1ff" wireframe transparent opacity={0.25} />
        </mesh>
      )}

      <Html position={[0, orbit.size + 0.35, 0]} center distanceFactor={10} occlude={false}>
        {/* Decorative: the HUD nav is the accessible route to every page. */}
        <a
          href={`/${page.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className={`planet-label${isActive ? ' planet-label--active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            go()
          }}
        >
          <span className="planet-label__title">// {page.label.toLowerCase()}</span>
          <span className="planet-label__blurb" style={{ opacity: frozen ? 1 : 0 }}>
            {page.blurb}
          </span>
        </a>
      </Html>
    </group>
  )
}
```

Create `src/components/three/OrbitSystem.jsx`:

```jsx
import { Fragment, useMemo } from 'react'
import { Line } from '@react-three/drei'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getOrbit, orbitPosition } from './systemLayout.js'
import Planet from './Planet.jsx'

function OrbitRing({ orbit }) {
  const points = useMemo(
    () => Array.from({ length: 129 }, (_, i) => orbitPosition(orbit, (i / 128) * Math.PI * 2)),
    [orbit],
  )
  return <Line points={points} color="#4df1ff" transparent opacity={0.18} lineWidth={1} />
}

export default function OrbitSystem({ full }) {
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const system = useMemo(
    () => pages.map((page, i) => ({ page, orbit: getOrbit(i, pages.length, { narrow }) })),
    [narrow],
  )

  return (
    <group>
      {system.map(({ page, orbit }) => (
        <Fragment key={page.slug}>
          <OrbitRing orbit={orbit} />
          <Planet page={page} orbit={orbit} full={full} />
        </Fragment>
      ))}
    </group>
  )
}
```

- [ ] **Step 5: Rewrite the camera rig**

Replace `src/components/three/CameraRig.jsx` with:

```jsx
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getCameraTarget, getHomeCamera } from './systemLayout.js'

const FLY_DURATION = 1.4

export default function CameraRig() {
  const { camera } = useThree()
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const focus = useSceneStore((s) => s.focus)
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const setFlyProgress = useSceneStore((s) => s.setFlyProgress)
  const lookAt = useRef({ x: 0, y: 0, z: 0 })
  const idle = useRef(0)

  useEffect(() => {
    let target
    if (!activeSlug) {
      target = getHomeCamera({ narrow }, pages.length)
    } else if (focus && focus.slug === activeSlug) {
      target = getCameraTarget(focus.position, focus.orbit)
    } else {
      return undefined // the planet has not reported its frozen position yet
    }

    setFlyProgress(0)
    const progress = { t: 0 }
    const timeline = gsap.timeline({
      defaults: { duration: FLY_DURATION, ease: 'power3.inOut' },
      onUpdate: () => camera.lookAt(lookAt.current.x, lookAt.current.y, lookAt.current.z),
    })
    timeline.to(
      camera.position,
      { x: target.position[0], y: target.position[1], z: target.position[2] },
      0,
    )
    timeline.to(
      lookAt.current,
      { x: target.lookAt[0], y: target.lookAt[1], z: target.lookAt[2] },
      0,
    )
    timeline.to(progress, { t: 1, ease: 'none', onUpdate: () => setFlyProgress(progress.t) }, 0)

    return () => timeline.kill()
  }, [activeSlug, focus, narrow, camera, setFlyProgress])

  useFrame((_, delta) => {
    if (activeSlug) return
    if (useSceneStore.getState().flyProgress < 1) return
    idle.current += delta
    const home = getHomeCamera({ narrow }, pages.length)
    camera.position.x = home.position[0] + Math.sin(idle.current * 0.12) * 0.6
    camera.position.y = home.position[1] + Math.cos(idle.current * 0.09) * 0.25
    camera.lookAt(0, 0, 0)
  })

  return null
}
```

- [ ] **Step 6: Rewrite Scene.jsx**

Replace `src/components/three/Scene.jsx` with:

```jsx
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { pages } from '../../content/site.js'
import { useSceneStore } from '../../store/useSceneStore.js'
import { getHomeCamera } from './systemLayout.js'
import Starfield from './Starfield.jsx'
import GridHorizon from './GridHorizon.jsx'
import Nebula from './Nebula.jsx'
import Sun from './Sun.jsx'
import OrbitSystem from './OrbitSystem.jsx'
import CameraRig from './CameraRig.jsx'

function ReadySignal() {
  const setSceneReady = useSceneStore((s) => s.setSceneReady)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    setSceneReady(true)
  })
  return null
}

export default function Scene() {
  const renderTier = useSceneStore((s) => s.renderTier)
  const narrow = useSceneStore((s) => s.isNarrowViewport)
  const effectsEnabled = useSceneStore((s) => s.effectsEnabled)
  const setEffectsEnabled = useSceneStore((s) => s.setEffectsEnabled)
  const full = renderTier === 'full'
  const home = getHomeCamera({ narrow }, pages.length)

  return (
    <Canvas
      dpr={full ? [1, 2] : [1, 1.25]}
      shadows={full ? 'soft' : false}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      camera={{ position: home.position, fov: 45, near: 0.1, far: 120 }}
    >
      <color attach="background" args={['#06040c']} />
      <fog attach="fog" args={['#06040c', 30, 80]} />
      <ambientLight intensity={0.12} color="#8ab4ff" />

      <Environment resolution={64} frames={1}>
        <Lightformer intensity={1.2} color="#9fd8ff" position={[0, 8, -4]} scale={[12, 4, 1]} />
        <Lightformer intensity={2} color="#ffb347" form="ring" position={[0, 0.5, 0]} scale={3} />
      </Environment>

      <Suspense fallback={null}>
        <Starfield full={full} />
        <GridHorizon />
        {full && <Nebula />}
        <Sun full={full} />
        <OrbitSystem full={full} />
      </Suspense>

      <CameraRig />
      <ReadySignal />

      {full && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setEffectsEnabled(false)}
          onFallback={() => setEffectsEnabled(false)}
        />
      )}

      {full && effectsEnabled && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
```

- [ ] **Step 7: Build, lint, and look at it**

Run: `npm run check:bundle && npm run lint && npm test`
Expected: all pass.

Run: `npm run dev` then open `http://localhost:5173/?tier=full` in a browser. Confirm: boot screen types the two lines; after a key press the sun, three orbiting planets with labels, starfield, nebula and grid are visible; clicking a planet flies the camera to it and the content pane appears; the HUD nav still works. Open `?tier=lite` and confirm the scene renders without bloom/nebula. Stop the dev server.

If the shell shows nothing or errors: open devtools console; the commonest causes are a typo in the GLSL (error names the line) or a drei prop name mismatch (check `node_modules/@react-three/drei/core/<Component>.d.ts`).

- [ ] **Step 8: Commit**

```bash
git add src/components/three
git commit -m "Replace the control-room hub with a cyber solar system scene

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Document titles and resume download

**Files:**
- Create: `src/hooks/useDocumentTitle.js`
- Test: `src/hooks/useDocumentTitle.test.jsx`
- Modify: `src/content/site.js:16-22` (add `resume`)
- Modify: `src/components/Home.jsx`
- Modify: `src/components/Page.jsx:102-119`
- Modify: `src/components/HUD.jsx` (full rewrite)
- Test: `src/components/resume.test.jsx`
- Create: `scripts/make-placeholder-resume.mjs`
- Create: `public/resume.pdf` (generated)

**Interfaces:**
- Produces: `useDocumentTitle(title: string)`; `person.resume === '/resume.pdf'`; `<HUD />` with classes `.hud, .hud__row, .hud__brand, .hud__brand-name, .hud__breadcrumb, .hud__controls, .hud__button, .hud__nav, .navlink, .navlink--active`; Home with `.home__kicker, .home__actions, .button, .button--primary`.

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useDocumentTitle.test.jsx`:

```jsx
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
```

Create `src/components/resume.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/hooks src/components/resume.test.jsx`
Expected: FAIL (hook missing; no résumé link).

- [ ] **Step 3: Implement the hook and content change**

Create `src/hooks/useDocumentTitle.js`:

```js
import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}
```

In `src/content/site.js`, change the `person` object to:

```js
export const person = {
  name: 'Natsuo Fujita',
  tagline:
    'Computer science student. I like understanding how systems work — and how they break.',
  email: 'fujita.natsuo@gmail.com',
  github: 'https://github.com/suechihuahua',
  resume: '/resume.pdf',
}
```

- [ ] **Step 4: Update Home, Page, and HUD**

Replace `src/components/Home.jsx` with:

```jsx
import { Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function Home() {
  useDocumentTitle(`${person.name} — portfolio`)

  return (
    <section className="home">
      <p className="home__kicker">// portfolio</p>
      <h1 className="home__name">{person.name}</h1>
      <p className="home__tagline">{person.tagline}</p>

      <div className="home__actions">
        <a className="button button--primary" href={person.resume} download>
          Download résumé
        </a>
        <a className="button" href={person.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>

      <nav className="contents" aria-label="Contents">
        <p className="contents__title">Sectors</p>
        <ul className="contents__list">
          {pages.map((page, i) => (
            <li className="contents__item" key={page.slug} style={{ '--i': i }}>
              <Link to={page.slug} className="contents__link">
                <span className="contents__label">{page.label}</span>
                <span className="contents__leader" aria-hidden="true" />
                <span className="contents__blurb">{page.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
```

In `src/components/Page.jsx`, add `import { useDocumentTitle } from '../hooks/useDocumentTitle.js'` at the top and `import { person } from '../content/site.js'` beneath it, then change the `Page` function to start with:

```jsx
export default function Page({ page }) {
  useDocumentTitle(`${person.name} — ${page.label}`)

  return (
```

(the rest of the function is unchanged).

Replace `src/components/HUD.jsx` with:

```jsx
import { NavLink, Link } from 'react-router-dom'
import { pages, person } from '../content/site.js'
import { useSceneStore } from '../store/useSceneStore.js'

const navClass = ({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')

// Persistent plain-HTML console. Lives beside the canvas, never inside it, so
// every control is keyboard-reachable and visible to assistive tech.
export default function HUD() {
  const activeSlug = useSceneStore((s) => s.activeSlug)
  const simpleView = useSceneStore((s) => s.simpleView)
  const setSimpleView = useSceneStore((s) => s.setSimpleView)
  const current = pages.find((p) => p.slug === activeSlug)

  return (
    <header className="hud">
      <div className="hud__row">
        <Link to="/" className="hud__brand">
          <span className="hud__brand-name">{person.name}</span>
          <span className="hud__breadcrumb">
            sector // {current ? current.label.toLowerCase() : 'home'}
          </span>
        </Link>

        <div className="hud__controls">
          <a className="hud__button" href={person.resume} download>
            résumé
          </a>
          <button
            type="button"
            className="hud__button"
            onClick={() => setSimpleView(!simpleView)}
            aria-pressed={simpleView}
          >
            {simpleView ? 'simple view: on' : 'simple view'}
          </button>
        </div>
      </div>

      <nav className="hud__nav" aria-label="Sections">
        <NavLink to="/" end className={navClass}>
          home
        </NavLink>
        {pages.map((page) => (
          <NavLink key={page.slug} to={`/${page.slug}`} className={navClass}>
            {page.label.toLowerCase()}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
```

- [ ] **Step 5: Generate the placeholder PDF**

Create `scripts/make-placeholder-resume.mjs`:

```js
// Writes a valid one-page PDF with two lines of text. Offsets are computed,
// not hand-typed, so the xref table is always correct.
import { writeFileSync } from 'node:fs'

const lines = ['Natsuo Fujita', 'Resume coming soon. This file is a placeholder.']
const content = [
  'BT',
  '/F1 24 Tf 72 720 Td',
  `(${lines[0]}) Tj`,
  '/F1 12 Tf 0 -32 Td',
  `(${lines[1]}) Tj`,
  'ET',
].join('\n')

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
]

let pdf = '%PDF-1.4\n'
const offsets = []
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
})
const xref = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
offsets.forEach((o) => {
  pdf += `${String(o).padStart(10, '0')} 00000 n \n`
})
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

writeFileSync('public/resume.pdf', pdf)
console.log('wrote public/resume.pdf')
```

Run: `node scripts/make-placeholder-resume.mjs`
Expected: `wrote public/resume.pdf`. Open `public/resume.pdf` in a browser to confirm it shows the two lines.

- [ ] **Step 6: Run tests and lint**

Run: `npm test && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useDocumentTitle.js src/hooks/useDocumentTitle.test.jsx src/content/site.js src/components/Home.jsx src/components/Page.jsx src/components/HUD.jsx src/components/resume.test.jsx scripts/make-placeholder-resume.mjs public/resume.pdf
git commit -m "Add per-route titles and a downloadable resume placeholder

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: UI restyle and responsive layout

**Files:**
- Modify: `index.html:12-17` (font link)
- Modify: `src/index.css` (full rewrite)

**Interfaces:**
- Consumes: class names from Layout (Task 4), Planet labels (Task 6), Home/HUD (Task 7).

- [ ] **Step 1: Swap the monospace font**

In `index.html`, replace the Google Fonts `<link href=...>` with:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesque:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 2: Rewrite index.css**

Replace `src/index.css` with:

```css
/* ─── Cyber solar system ──────────────────────────────────────────────────────
   Near-black space, violet haze, one cyan accent, amber for the sun / active
   state. Headings keep the display face; console chrome is monospace.
   ─────────────────────────────────────────────────────────────────────────── */

:root {
  --bg: #06040c;
  --haze: #1b1035;
  --panel: rgba(10, 8, 20, 0.72);
  --ink: #e6e9f2;
  --ink-soft: #8f93a8;
  --accent: #4df1ff;
  --sun: #ffb347;
  --line: rgba(77, 241, 255, 0.22);

  --display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --text: 'Hanken Grotesque', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  --measure: 62ch;
  --gutter: clamp(1rem, 4vw, 2rem);

  color-scheme: dark;
  font-family: var(--text);
  font-size: 112.5%;
  line-height: 1.6;
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  overflow-x: hidden;
}

#root {
  min-height: 100svh;
}

h1,
h2,
h3 {
  font-family: var(--display);
  font-optical-sizing: auto;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.01em;
}

p {
  margin: 0;
}

a {
  color: var(--accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

:focus-visible {
  outline: 2px solid var(--sun);
  outline-offset: 3px;
  border-radius: 2px;
}

.skip-link {
  position: fixed;
  top: -3rem;
  left: 1rem;
  z-index: 1000;
  background: var(--accent);
  color: #04121a;
  font-family: var(--mono);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.6rem 1rem;
  border-radius: 3px;
  transition: top 0.15s ease;
}

.skip-link:focus {
  top: 1rem;
}

/* ─── Layers ───────────────────────────────────────────────────────────────── */

.experience {
  position: relative;
  min-height: 100svh;
}

.scene-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(ellipse at 50% 40%, var(--haze) 0%, var(--bg) 70%);
}

.scene-layer canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.static-hero {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanline-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0.08) 1px,
    rgba(0, 0, 0, 0) 3px
  );
  opacity: 0.35;
}

/* ─── HUD (ship console) ───────────────────────────────────────────────────── */

.hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0.9rem var(--gutter) 0.6rem;
  background: linear-gradient(to bottom, rgba(6, 4, 12, 0.88), rgba(6, 4, 12, 0));
  font-family: var(--mono);
}

.hud__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem 1.5rem;
}

.hud__brand {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  text-decoration: none;
  color: var(--ink);
}

.hud__brand-name {
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.hud__breadcrumb {
  font-size: 0.72rem;
  color: var(--accent);
}

.hud__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hud__button {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--ink-soft);
  background: rgba(10, 8, 20, 0.6);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.38rem 0.65rem;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.hud__button:hover,
.hud__button:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.hud__button[aria-pressed='true'] {
  color: var(--sun);
  border-color: var(--sun);
}

.hud__nav {
  display: flex;
  gap: 1.25rem;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.hud__nav::-webkit-scrollbar {
  display: none;
}

.navlink {
  color: var(--ink-soft);
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.navlink:hover {
  color: var(--accent);
}

.navlink--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* ─── Overlay pane ─────────────────────────────────────────────────────────── */

.overlay-pane {
  position: relative;
  z-index: 5;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(6.5rem, 14vw, 8.5rem) var(--gutter) 5rem;
}

.overlay-pane__inner {
  width: 100%;
  max-width: 46rem;
  max-height: 74vh;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  backdrop-filter: blur(14px);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset, 0 24px 60px rgba(0, 0, 0, 0.55);
}

/* ─── Footer ───────────────────────────────────────────────────────────────── */

.colophon {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  margin: 0;
  padding: 0.6rem var(--gutter);
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.5rem;
  font-size: 0.72rem;
  color: var(--ink-soft);
  background: linear-gradient(to top, rgba(6, 4, 12, 0.9), rgba(6, 4, 12, 0));
  pointer-events: none;
}

.colophon a,
.colophon span {
  pointer-events: auto;
}

.colophon a {
  color: var(--ink-soft);
  font-family: var(--mono);
  text-decoration: none;
}

.colophon a:hover {
  color: var(--accent);
}

/* ─── Boot screen (real console, no glow) ──────────────────────────────────── */

.boot {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #000;
  color: #d8d8d8;
  font-family: var(--mono);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 clamp(1.5rem, 8vw, 6rem);
  cursor: pointer;
}

.boot__body {
  margin: 0;
  font-family: inherit;
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  line-height: 1.7;
  white-space: pre-wrap;
}

.boot__caret {
  display: inline-block;
  width: 0.6em;
  height: 1em;
  margin-left: 0.1em;
  vertical-align: -0.15em;
  background: var(--sun);
  animation: blink 1s steps(2, start) infinite;
}

.boot__skip {
  margin-top: 2rem;
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--ink-soft);
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
}

.boot__skip:disabled {
  cursor: progress;
  opacity: 0.6;
}

.boot__skip:not(:disabled):hover,
.boot__skip:not(:disabled):focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

/* ─── Home ─────────────────────────────────────────────────────────────────── */

.home__kicker {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 0.75rem;
}

.home__name {
  font-size: clamp(2.6rem, 8vw, 4.6rem);
  line-height: 1.02;
  max-width: 12ch;
}

.home__tagline {
  margin-top: 1.25rem;
  max-width: 36ch;
  font-size: clamp(1.02rem, 2.2vw, 1.25rem);
  line-height: 1.5;
  color: var(--ink-soft);
}

.home__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.button {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.85rem;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.button:hover,
.button:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.button--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #04121a;
}

.button--primary:hover,
.button--primary:focus-visible {
  background: #7ff5ff;
  color: #04121a;
}

.contents {
  margin-top: clamp(2.5rem, 7vw, 4rem);
  border-top: 1px solid var(--line);
  padding-top: 0.75rem;
}

.contents__title {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 0.25rem;
}

.contents__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.contents__item {
  border-top: 1px solid var(--line);
}

.contents__item:first-child {
  border-top: none;
}

.contents__link {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.85rem 0;
  text-decoration: none;
  color: var(--ink);
}

.contents__label {
  font-family: var(--display);
  font-size: clamp(1.25rem, 3.5vw, 1.75rem);
  transition: color 0.15s ease;
}

.contents__leader {
  flex: 1;
  align-self: center;
  border-bottom: 1px dotted var(--line);
}

.contents__blurb {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--ink-soft);
  white-space: nowrap;
}

.contents__link:hover .contents__label,
.contents__link:focus-visible .contents__label {
  color: var(--accent);
}

/* ─── Interior pages ───────────────────────────────────────────────────────── */

.entry__header {
  margin-bottom: clamp(2rem, 5vw, 3rem);
}

.entry__title {
  font-size: clamp(1.9rem, 5vw, 2.8rem);
}

.entry__blurb {
  margin-top: 0.5rem;
  color: var(--ink-soft);
  font-family: var(--mono);
  font-size: 0.9rem;
}

.entry__blurb::before {
  content: '// ';
  color: var(--accent);
}

.section {
  padding-top: clamp(1.75rem, 4vw, 2.5rem);
  margin-top: clamp(1.75rem, 4vw, 2.5rem);
  border-top: 1px solid var(--line);
}

.section:first-of-type {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

.section__heading {
  font-size: 1.35rem;
  margin-bottom: 1rem;
}

.section__prose {
  max-width: var(--measure);
}

.section__prose + .section__prose {
  margin-top: 1rem;
}

.grouplist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1.5rem 2rem;
}

.grouplist__name {
  font-family: var(--mono);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 0.6rem;
}

.grouplist__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.8rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  background: rgba(77, 241, 255, 0.05);
}

.courses {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.courses__termname {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin-bottom: 0.4rem;
}

.courses__rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.courses__row {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: 1rem;
  align-items: baseline;
  padding: 0.55rem 0;
  border-top: 1px solid var(--line);
}

.courses__row:first-child {
  border-top: none;
}

.courses__code {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--sun);
}

.projects {
  list-style: none;
  margin: 0;
  padding: 0;
}

.projects__item {
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(77, 241, 255, 0.03);
}

.projects__item + .projects__item {
  margin-top: 1rem;
}

.projects__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.projects__title {
  font-size: 1.25rem;
}

.projects__year {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--ink-soft);
}

.projects__desc {
  margin-top: 0.45rem;
  color: var(--ink-soft);
}

.projects__link {
  display: inline-block;
  margin-top: 0.7rem;
  font-family: var(--mono);
  font-size: 0.85rem;
}

.projects__link::before {
  content: '> ';
}

/* ─── In-scene planet labels (decorative, aria-hidden) ─────────────────────── */

.planet-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  font-family: var(--mono);
  text-align: center;
  text-decoration: none;
  color: var(--ink);
  white-space: nowrap;
  user-select: none;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
}

.planet-label__title {
  font-size: 0.9rem;
  letter-spacing: 0.03em;
}

.planet-label--active .planet-label__title {
  color: var(--accent);
}

.planet-label__blurb {
  font-size: 0.7rem;
  color: var(--ink-soft);
  transition: opacity 0.2s ease;
}

/* ─── ≤768px: compact console, bottom-sheet pane ───────────────────────────── */

@media (max-width: 768px) {
  .hud {
    padding-top: 0.7rem;
  }

  .hud__brand-name {
    font-size: 0.85rem;
  }

  .hud__button {
    font-size: 0.68rem;
    padding: 0.32rem 0.55rem;
  }

  .overlay-pane {
    align-items: flex-end;
    padding: 6rem 1rem 0;
  }

  .overlay-pane__inner {
    max-height: 72svh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding-bottom: 3rem;
  }

  .colophon {
    justify-content: center;
    font-size: 0.66rem;
  }

  .contents__leader {
    display: none;
  }

  .contents__link {
    flex-wrap: wrap;
    gap: 0.1rem 0.6rem;
  }

  .contents__blurb {
    white-space: normal;
    flex-basis: 100%;
  }

  .courses__row {
    grid-template-columns: 5rem 1fr;
  }
}

/* ─── Entrance animation ───────────────────────────────────────────────────── */

@media (prefers-reduced-motion: no-preference) {
  .contents__item {
    opacity: 0;
    transform: translateY(0.5rem);
    animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
    animation-delay: calc(120ms + var(--i, 0) * 80ms);
  }

  .section__prose,
  .grouplist__group {
    opacity: 0;
    animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
    animation-delay: 80ms;
  }
}

@keyframes rise {
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3: Check in the browser**

Run: `npm run dev`. Open `http://localhost:5173/?tier=full` at a desktop width, then use devtools device toolbar at 375 and 768 wide. Confirm: no horizontal scroll; HUD nav scrolls horizontally rather than wrapping; the pane sits as a bottom sheet on 375; the boot screen is white-on-black IBM Plex Mono with an amber caret. Stop the server.

- [ ] **Step 4: Tests, lint, commit**

Run: `npm test && npm run lint`
Expected: PASS.

```bash
git add index.html src/index.css
git commit -m "Restyle UI as a ship console with responsive bottom-sheet pane

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Meta tags, favicons, OG image, hero poster

**Files:**
- Modify: `index.html` (head)
- Create: `public/site.webmanifest`
- Create: `scripts/og-template.html`
- Create: `scripts/capture.mjs`
- Create (generated): `public/hero-poster.jpg`, `public/og.png`, `public/favicon-32.png`, `public/apple-touch-icon.png`
- Modify: `package.json` (`capture` script), `.gitignore`

**Interfaces:**
- Consumes: `?tier=full&capture` handling from Task 4 (hides HUD/boot).
- Produces: `npm run capture` regenerates all four images.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D playwright
npx playwright install chromium
```

- [ ] **Step 2: Write the head, manifest, and OG template**

Replace the `<head>` of `index.html` with:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Natsuo Fujita — portfolio</title>
    <meta
      name="description"
      content="Natsuo Fujita — computer science student focused on cybersecurity and systems programming. An interactive 3D portfolio."
    />
    <link rel="canonical" href="https://natsuofujita.vercel.app/" />
    <meta name="theme-color" content="#06040c" />
    <meta name="color-scheme" content="dark" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="Natsuo Fujita — portfolio" />
    <meta
      property="og:description"
      content="Computer science student focused on cybersecurity and systems programming."
    />
    <meta property="og:url" content="https://natsuofujita.vercel.app/" />
    <meta property="og:image" content="https://natsuofujita.vercel.app/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Natsuo Fujita — portfolio" />
    <meta
      name="twitter:description"
      content="Computer science student focused on cybersecurity and systems programming."
    />
    <meta name="twitter:image" content="https://natsuofujita.vercel.app/og.png" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesque:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
```

(The canonical/OG URLs use the default Vercel project URL; replace them with the custom domain once one is attached.)

Create `public/site.webmanifest`:

```json
{
  "name": "Natsuo Fujita — portfolio",
  "short_name": "Natsuo Fujita",
  "icons": [{ "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }],
  "theme_color": "#06040c",
  "background_color": "#06040c",
  "display": "standalone"
}
```

Create `scripts/og-template.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=IBM+Plex+Mono:wght@400&display=swap"
      rel="stylesheet"
    />
    <style>
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
      body {
        background: #06040c url('/hero-poster.jpg') center / cover no-repeat;
        color: #e6e9f2;
        font-family: 'Fraunces', Georgia, serif;
        position: relative;
      }
      .shade { position: absolute; inset: 0; background: linear-gradient(to right, rgba(6,4,12,0.85) 0%, rgba(6,4,12,0.2) 70%); }
      .copy { position: absolute; left: 72px; bottom: 72px; max-width: 760px; }
      .kicker { font-family: 'IBM Plex Mono', monospace; font-size: 22px; color: #4df1ff; margin-bottom: 14px; }
      h1 { font-size: 88px; line-height: 1; margin: 0 0 18px; font-weight: 500; }
      p { font-size: 28px; line-height: 1.35; margin: 0; color: #c9cdda; }
    </style>
  </head>
  <body>
    <div class="shade"></div>
    <div class="copy">
      <div class="kicker">// portfolio</div>
      <h1>Natsuo Fujita</h1>
      <p>Computer science student. I like understanding how systems work — and how they break.</p>
    </div>
  </body>
</html>
```

- [ ] **Step 3: Write the capture script**

Create `scripts/capture.mjs`:

```js
// Regenerates the static-tier poster, the OG image, and PNG favicons from the
// live scene. Run with: npm run capture
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const server = await createServer({ server: { port: 4174, strictPort: true }, logLevel: 'error' })
await server.listen()
const base = 'http://localhost:4174'

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`${base}/?tier=full&capture`)
  await page.waitForTimeout(4500)
  await page.screenshot({ path: 'public/hero-poster.jpg', type: 'jpeg', quality: 82 })
  console.log('wrote public/hero-poster.jpg')

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await og.route('**/og-template', (route) =>
    route.fulfill({ contentType: 'text/html', body: readFileSync('scripts/og-template.html', 'utf8') }),
  )
  await og.goto(`${base}/og-template`)
  await og.waitForTimeout(1500)
  await og.screenshot({ path: 'public/og.png', type: 'png' })
  console.log('wrote public/og.png')

  for (const [size, file] of [
    [32, 'public/favicon-32.png'],
    [180, 'public/apple-touch-icon.png'],
  ]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(
      `<body style="margin:0;background:#06040c"><img src="${base}/favicon.svg" style="width:${size}px;height:${size}px;display:block"></body>`,
    )
    await icon.waitForTimeout(300)
    await icon.screenshot({ path: file, type: 'png', omitBackground: false })
    console.log(`wrote ${file}`)
  }
} finally {
  await browser.close()
  await server.close()
}
```

In `package.json` `"scripts"`, add:

```json
"capture": "node scripts/capture.mjs"
```

- [ ] **Step 4: Generate the images**

Run: `npm run capture`
Expected: four `wrote …` lines. Open `public/hero-poster.jpg` and `public/og.png` and confirm the sun and planets are visible (not a black frame). If the poster is black, raise the `waitForTimeout` in the script to 8000 and rerun.

- [ ] **Step 5: Verify the static tier uses the poster**

Run: `npm run dev`, open `http://localhost:5173/?tier=static`. Confirm the poster fills the background behind the HUD and pane with no boot screen. Stop the server.

- [ ] **Step 6: Tests, lint, commit**

Run: `npm test && npm run lint`
Expected: PASS.

```bash
git add index.html public/site.webmanifest public/hero-poster.jpg public/og.png public/favicon-32.png public/apple-touch-icon.png scripts/og-template.html scripts/capture.mjs package.json package-lock.json
git commit -m "Add meta tags, OG image, favicons, and static hero poster

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Vercel deployment and analytics

**Files:**
- Create: `vercel.json`
- Modify: `src/main.jsx`
- Modify: `README.md` (full rewrite)
- Modify: `.gitignore`

- [ ] **Step 1: Install analytics**

```bash
npm install @vercel/analytics
```

- [ ] **Step 2: Add the Vercel config and analytics component**

Create `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

In `src/main.jsx`, add `import { Analytics } from '@vercel/analytics/react'` after the `BrowserRouter` import, and change the render call to:

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
```

Append to `.gitignore`:

```
.vercel
screenshots
.claude/worktrees
```

- [ ] **Step 3: Rewrite the README**

Replace `README.md` with:

````markdown
# Natsuo Fujita — portfolio

Interactive 3D portfolio: a cyber solar system where each section is a planet. Built with React 19, Vite, React Three Fiber, and react-router.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run lint
npm run check:bundle # build + assert three.js is not in the initial chunk
npm run capture      # regenerate public/hero-poster.jpg, og.png, favicons
```

Force a render tier for testing: `/?tier=full`, `/?tier=lite`, `/?tier=static`.

## Content

Everything on the site comes from `src/content/site.js`. Add an object to `pages` and it gets a nav link, a planet, and a route. Replace `public/resume.pdf` with your real résumé — nothing else needs to change.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project**, import the repo. Framework preset **Vite**; leave build (`vite build`) and output (`dist`) as detected. Deploy.
3. Analytics: in the project's **Analytics** tab click **Enable**. The `<Analytics />` component is already mounted.
4. Custom domain (optional): **Settings → Domains → Add**, enter the domain, then at your registrar add the records Vercel shows (an `A` record to `76.76.21.21` for the apex, or a `CNAME` to `cname.vercel-dns.com` for `www`). Afterwards update the `canonical` / `og:url` / `og:image` URLs in `index.html`.

Client-side routes work on refresh because `vercel.json` rewrites every path to `index.html`.
````

- [ ] **Step 4: Verify the build and commit**

Run: `npm run check:bundle && npm test && npm run lint`
Expected: PASS; `check-bundle: ok`.

```bash
git add vercel.json src/main.jsx README.md .gitignore package.json package-lock.json
git commit -m "Add Vercel config, analytics, and deploy docs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Responsive screenshot verification

**Files:**
- Create: `scripts/screenshots.mjs`
- Modify: `package.json` (`screenshots` script)

- [ ] **Step 1: Write the screenshot script**

Create `scripts/screenshots.mjs`:

```js
// Captures /, /about, /projects at 375, 768, and 1440 px wide into
// ./screenshots (gitignored). Run with: npm run screenshots
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const WIDTHS = [375, 768, 1440]
const ROUTES = ['/', '/about', '/projects']

mkdirSync('screenshots', { recursive: true })
const server = await createServer({ server: { port: 4175, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  for (const width of WIDTHS) {
    const tier = width <= 768 ? 'lite' : 'full'
    const page = await browser.newPage({ viewport: { width, height: width <= 768 ? 812 : 900 } })
    for (const route of ROUTES) {
      await page.goto(`http://localhost:4175${route}?tier=${tier}`)
      await page.waitForTimeout(3000)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2500)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      if (scrollWidth > width) {
        console.error(`horizontal overflow at ${width}px on ${route}: scrollWidth=${scrollWidth}`)
        process.exitCode = 1
      }
      const name = `${width}${route === '/' ? '-home' : route.replace('/', '-')}.png`
      await page.screenshot({ path: `screenshots/${name}` })
      console.log(`wrote screenshots/${name}`)
    }
    await page.close()
  }
} finally {
  await browser.close()
  await server.close()
}
```

In `package.json` `"scripts"`, add:

```json
"screenshots": "node scripts/screenshots.mjs"
```

- [ ] **Step 2: Run it and review**

Run: `npm run screenshots`
Expected: nine `wrote …` lines and no `horizontal overflow` errors. Open each image in `screenshots/` (use the Read tool on the PNG files) and confirm: the HUD does not overlap the pane at 375; the pane is a bottom sheet at 375 and 768; the sun and planets are visible on the home route at every width; text is legible.

If overflow is reported, find the offending element with devtools (`document.querySelectorAll('*')` filtered by `getBoundingClientRect().right > innerWidth`) and fix it in `src/index.css`.

- [ ] **Step 3: Commit**

```bash
git add scripts/screenshots.mjs package.json
git commit -m "Add responsive screenshot check script

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Final verification and merge to main

- [ ] **Step 1: Full verification on the branch**

Run: `npm run lint && npm test && npm run check:bundle && npm run screenshots`
Expected: all pass with no errors.

Then measure the static/lite path with Lighthouse (the spec's target is mobile performance ≥ 85):

```bash
npm run build
npx vite preview --port 4176 &
npx lighthouse "http://localhost:4176/?tier=static" --preset=perf --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless" --output=json --output-path=./screenshots/lighthouse-static.json --quiet
node -e "const r=require('./screenshots/lighthouse-static.json');console.log('performance', Math.round(r.categories.performance.score*100))"
```

Expected: `performance 85` or higher. If lower, open the JSON's `audits` for the top opportunities (usually font loading or an oversized `hero-poster.jpg`; re-run `npm run capture` with `quality: 70` if the poster exceeds ~250 kB). Stop the preview server afterwards.

- [ ] **Step 2: Archive main's uncommitted 2D work, then merge**

The main checkout (`C:\Projects\React-portfolio`) holds uncommitted 2D-only changes that this branch supersedes. Confirm with the user before running the following; do not proceed without a yes.

```bash
cd C:/Projects/React-portfolio
git status --short
git checkout -b archive/2d-version
git add -A -- . ':!.claude'
git commit -m "Archive uncommitted 2D layout before merging the 3D redesign

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git checkout main
git merge --no-ff feature/cyber-solar-system -m "Merge feature/cyber-solar-system

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
npm install
npm test && npm run check:bundle
```

Expected: merge completes without conflicts (main has no commits since the branch point); tests and bundle check pass on `main`.

- [ ] **Step 3: Hand off**

Tell the user: `main` now contains the redesign; push with `git push origin main` when ready, then follow the README's Deploy section. Remind them to replace `public/resume.pdf` and to update the canonical/OG URLs once they have a domain.
