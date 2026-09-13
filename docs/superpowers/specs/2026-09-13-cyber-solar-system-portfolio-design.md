# Cyber Solar System Portfolio — Design

Date: 2026-09-13
Branch: `feature/cyber-solar-system` (worktree at `.claude/worktrees/agent-af640168a247859cb`)
Baseline: the committed "control-room" React Three Fiber hub (boot sequence, HUD, hub scene, overlay pane).

## 1. Goal

Turn the existing control-room hub into a polished, physically shaded "cyber solar system" hero while meeting the production checklist:

- Responsive at 375 / 768 / 1440 px.
- Graceful fallback for the 3D hero on low-end and mobile devices.
- Fast initial load: the page is usable before the 3D bundle arrives.
- Favicon, meta tags, Open Graph image.
- Downloadable resume PDF.
- Deployed to Vercel with Vercel Web Analytics; custom domain documented.

### Non-goals

- No downloaded 3D models, HDR files, or textures. Everything is procedural so there is nothing to compress or wait for.
- No CMS, blog, or contact form.
- No changes to the content model in `src/content/site.js` beyond adding `person.resume`. Pages, sections, and renderers keep working as-is.
- `main`'s uncommitted 2D-only work is superseded by this branch; it is dropped at merge time (confirm with the user first).

## 2. Architecture

React 19 + Vite + react-router. The layout is a single persistent `<Layout>` route element; the 3D canvas lives inside it and never remounts on navigation. The URL drives `activeSlug` in the zustand store; the camera rig and the scene react to it.

```
src/
  main.jsx                     BrowserRouter + <Analytics /> ; kicks off the scene chunk preload
  App.jsx                      routes generated from site.js (unchanged)
  content/site.js              + person.resume
  store/useSceneStore.js       + renderTier, sceneReady, hoveredSlug (unchanged), simpleView
  lib/renderTier.js            pure detectRenderTier(env) -> 'full' | 'lite' | 'static'
  hooks/useDocumentTitle.js    per-route <title>
  components/
    Layout.jsx                 tier switch: Static poster vs lazy <Scene>; boot/HUD/pane wiring
    BootSequence.jsx           doubles as loader; resolves on sceneReady || timeout
    HUD.jsx                    ship-console styling, resume button, compact mobile row
    Home.jsx                   hero copy + resume button
    Page.jsx                   unchanged renderers
    StaticHero.jsx             poster <img> backdrop used by the static tier
    SceneErrorBoundary.jsx     WebGL crash -> static tier
    three/
      Scene.jsx                Canvas, renderer config, tier-aware effects, PerformanceMonitor
      Sun.jsx                  hero centerpiece
      OrbitSystem.jsx          one Planet per page on its own orbit ring
      Planet.jsx               planet mesh + label + hover/click
      Starfield.jsx            two-layer instanced points
      Nebula.jsx               additive haze sprites (full tier only)
      GridHorizon.jsx          neon grid fading into distance
      CameraRig.jsx            gsap fly-to; idle drift at hub
      systemLayout.js          orbit radii / angles / camera targets (pure)
public/
  favicon.svg, favicon-32.png, apple-touch-icon.png, site.webmanifest
  og.png (1200x630), hero-poster.jpg (static tier backdrop)
  resume.pdf (placeholder)
vercel.json
```

Removed from the baseline: `HubCore`, `TerminalPanel`, `ProjectGraph`, `CourseStack`, `GridFloor`, `ParticleField`, `hubLayout.js`, the ambient hum hook and its HUD toggle, `leva`, `r3f-perf`, `lenis`, `typewriter-effect` (boot text is typed with a small CSS/JS effect instead).

## 3. Scene composition

### 3.1 Sun (hero centerpiece)

- Core: sphere, `MeshStandardMaterial` with a warm amber emissive and a slow noise-driven surface pulse (vertex-displaced via `maath` easing on a uniform, no custom fragment shader).
- Corona: a second, larger sphere with a fresnel-style additive `shaderMaterial` (drei) that fades from amber at the limb to transparent, animated slowly. This gives the glow even when bloom is off (lite tier).
- Scan shell: thin icosahedron wireframe slightly larger than the corona, rotating opposite to the core, low opacity cyan. Full tier only.
- Idle: slow rotation; on pointer hover the emissive intensity and corona brightness ease up ~30%.
- Light: a `pointLight` at the sun position is the scene's key light so planets are lit from the sun. Casts a soft shadow only in the full tier.

### 3.2 Orbit system

- One `Planet` per entry in `pages`, on a circular orbit around the sun. `systemLayout.js` derives radius, inclination, and starting angle from the page index and total count, so adding a page in `site.js` adds an orbit.
- Each orbit draws a faint ring (`drei <Line>` circle, low opacity cyan).
- Planet appearance cycles through three procedural materials by index: glassy ice (`MeshPhysicalMaterial`, transmission), brushed metal (`metalness 1, roughness 0.35`), molten (`emissive`, slow pulse). Sizes vary slightly by index.
- Motion: each planet advances along its orbit each frame using delta time. The planet whose slug equals `activeSlug` freezes in place; the rest keep orbiting. Hover also freezes the hovered planet.
- Label: `drei <Html>` beside each planet, styled as a console readout (`// about me`), aria-hidden and out of the tab order because the HUD nav is the accessible route. Hover shows the blurb.
- Click navigates to `/<slug>`.

### 3.3 Backdrop

- `Starfield`: two `Points` layers (far: small, static; near: slightly larger, very slow parallax rotation). Counts: full 2500/600, lite 900/200.
- `Nebula`: three large additive sprite planes (violet/cyan) with low opacity, slow drift. Full tier only.
- `GridHorizon`: drei `<Grid>` below the system plane, cyan sections, fading with distance. Both 3D tiers.
- Fog and background color are near-black with a violet cast.

### 3.4 Renderer and post-processing

- `Canvas` props: `dpr` capped `[1, 2]` full / `[1, 1.25]` lite; `gl={{ antialias: false, powerPreference: 'high-performance' }}`; `toneMapping: ACESFilmicToneMapping`; output color space sRGB; `shadows="soft"` only in the full tier.
- Lighting: `drei <Environment>` built from `<Lightformer>`s (no file): a cool overhead fill and a warm fill on the sun side, so glass and metal planets get believable reflections.
- Full tier post: `EffectComposer multisampling={0}` with `Bloom` (luminance threshold ~0.6, so only the sun core and molten planet bloom), `Vignette`, `SMAA`.
- `drei <PerformanceMonitor>` wraps the effects: on sustained decline it lowers dpr, then disables post-processing (`effectsEnabled` in store).

### 3.5 Camera

- Hub: parked above and in front of the system, slow idle drift (existing gsap/delta approach).
- Page: `systemLayout.getCameraTarget(slug)` returns a position offset from the planet's frozen location; gsap flies position and look-at over 1.4 s `power3.inOut`. Reduced motion → duration 0.
- The overlay pane starts its fade-in at 60% of the fly duration (`onUpdate` progress from the gsap tween sets `flyProgress` in the store; pane animates when `flyProgress >= 0.6`).

### 3.6 UI restyle

- Palette: `--bg #06040c`, `--haze #1b1035`, `--ink #e6e9f2`, `--ink-soft #8f93a8`, `--accent #4df1ff` (cyan), `--sun #ffb347` (amber, used for focus rings and the active state).
- HUD: thin one-pixel console lines, monospace readouts, breadcrumb format `sector // about me`. Buttons: `resume`, `simple view`. Sound toggle removed.
- Overlay pane: dark glass (`backdrop-filter`), one-pixel cyan border, no green glow.
- Boot screen: two typed lines only — `> Fujita Natsuo's portfolio` then `> press any key to continue_` — no tagline or "user:" readout. Typed in a real terminal typeface: IBM Plex Mono (Google Fonts, replaces JetBrains Mono site-wide as `--mono`) over a native stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`), plain phosphor-white text with a faint amber caret and no glow, so it reads as an actual console rather than a neon effect. Shows a subtle `loading scene…` hint on the skip button while the scene chunk loads.

## 4. Render tiers

`detectRenderTier(env)` is a pure function over an injected environment object (so it is unit-testable):

```
static  if  !env.webgl2 || env.reducedMotion || env.simpleView
lite    if  env.viewportWidth <= 768 || env.cores <= 4 || env.deviceMemory <= 4 || env.saveData
full    otherwise
```

- Evaluated once at store creation; `simpleView` toggle re-evaluates. Media queries (`prefers-reduced-motion`, viewport) are still watched live.
- `static`: `Layout` renders `<StaticHero>` (a `public/hero-poster.jpg` backdrop with `object-fit: cover`) instead of the canvas. HUD and pane are identical. Boot sequence is skipped.
- `lite`: canvas without post-processing, shadows, nebula, scan shell; reduced counts and dpr.
- `SceneErrorBoundary` catches a render/WebGL error and sets the tier to `static` for the session.
- The poster is captured once from the full-tier scene via a dev-only `?capture` query that hides the HUD and calls `canvas.toDataURL()`; the resulting file is committed. It is regenerated manually if the scene changes materially.

## 5. Loading strategy

- `Scene.jsx` and everything under `three/` are behind `React.lazy(() => import('./three/Scene.jsx'))`. Vite's `manualChunks` places `three`, `@react-three/*`, `postprocessing`, `maath`, `gsap` in a `vendor-three` chunk.
- `main.jsx` starts `import('./components/three/Scene.jsx')` immediately when the tier is not static, so the chunk downloads during the boot sequence.
- `BootSequence` finishes when the visitor presses a key/clicks **and** `sceneReady` is true (set by `Scene` on its first `useFrame`), or after a 6 s cap so a slow network never traps the visitor. Until then the skip button reads `loading scene…`.
- The initial chunk must not contain `three`; a build check greps `dist/assets/index-*.js` for `THREE.WebGLRenderer` and fails if found.
- Fonts keep `display=swap` and `preconnect`.

## 6. Responsive

- Verified at 375, 768, 1440 with headless Chromium screenshots of `/`, `/about`, `/projects`.
- ≤768: HUD collapses to one row (brand + horizontal scrollable nav; buttons shrink to icon+text). Overlay pane becomes a bottom sheet (`max-height 72svh`, internal scroll, full width, 16 px side gutters). Floating footer folds into the pane bottom.
- Orbits use a tighter radius set on narrow viewports so all planets are in frame in portrait; camera hub position pulls back on ≤768.
- No horizontal page scroll at any width; only tables/code scroll inside their own container.

## 7. Meta, favicon, OG

- `index.html`: `<title>`, description, canonical, `theme-color`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`), Twitter `summary_large_image`.
- `useDocumentTitle` sets `Natsuo Fujita — About me` style titles per route.
- `public/og.png` 1200×630 rendered once from an HTML template (hero poster + name + tagline) via headless Chromium and committed.
- Favicons: existing `favicon.svg` plus `favicon-32.png`, `apple-touch-icon.png` (180), `site.webmanifest`.

## 8. Resume

- `person.resume = '/resume.pdf'` in `site.js`.
- "Download résumé" button in the Home hero and in the HUD (`<a href download>`).
- `public/resume.pdf` ships as a one-page placeholder ("Natsuo Fujita — résumé coming soon") so the link is never broken. The user replaces the file; nothing else changes.

## 9. Deployment and analytics

- `vercel.json`: SPA rewrite of all paths to `/index.html`; long-cache headers for `/assets/*`.
- `@vercel/analytics/react` `<Analytics />` mounted in `main.jsx`.
- README gains a "Deploy" section: connect repo on Vercel, framework preset Vite, add custom domain (Vercel domain settings → registrar CNAME/A records).

## 10. Testing

Vitest + Testing Library (jsdom):

- `detectRenderTier` matrix (webgl2/reduced-motion/simpleView/width/cores/memory).
- `systemLayout`: N pages → N distinct orbits; camera target sits outside the planet radius; works for N = 1.
- Routes: every `pages[].slug` renders a `Page` with its label as `<h1>`; unknown path redirects to `/`.
- `Home` and `HUD` render a resume link pointing at `person.resume` with `download`.
- `useDocumentTitle` updates `document.title` per route.
- `BootSequence` completes on key press only once `sceneReady` or after the cap.

Build/visual:

- `npm run build` + initial-chunk check (no `three` in `index-*.js`).
- Headless Chromium screenshots at the three widths, reviewed before completion.
- Lighthouse on the preview build: mobile performance ≥ 85 is the target for the static/lite paths.

## 11. Acceptance checklist

| Checklist item | Covered by |
| --- | --- |
| Responsive 375/768/1440 | §6, screenshots in §10 |
| 3D fallback on low-end/mobile | §4 tiers, error boundary |
| Fast initial load | §5 lazy chunk, boot-as-loader, no assets |
| Favicon + meta + OG | §7 |
| Resume PDF | §8 |
| Deployment target | §9 Vercel |
| Custom domain | §9 README steps (user action) |
| Analytics | §9 Vercel Analytics |
