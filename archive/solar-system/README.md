# Cyber solar system (archived)

The textured eight-planet hero that preceded the anime-room redesign. Everything needed to bring it back lives here; the exact working commit is tagged `solar-system-v1` (`git checkout solar-system-v1`).

## What's in this folder

- `three/` — React Three Fiber scene: `Scene.jsx` (canvas, post-processing, tiers), `Sun.jsx`, `Planet.jsx` (textures, Saturn ring, moon), `OrbitSystem.jsx`, `SkySphere.jsx`, `Starfield.jsx`, `CameraRig.jsx` (gsap flights), `systemLayout.js` (+ tests), `planets.js`.
- `useSceneStore.js` (zustand store), `renderTier.js` (full / lite / static detection), `useScrollNavigation.js` (one planet per wheel/swipe).
- `Layout.jsx`, `HUD.jsx`, `BootSequence.jsx`, `StaticHero.jsx`, `SceneErrorBoundary.jsx`, `site.js`, `index.css` — the shell that hosted it.
- `textures/` — 1k/2k planet, sun, moon, ring and Milky Way maps (Solar System Scope, CC BY 4.0); `prepare-textures.mjs` regenerates them.
- `capture.mjs`, `og-template.html`, `hero-poster.jpg` — poster / OG capture.

## To reuse

Copy `three/`, the store, tier and scroll hooks back under `src/`, put `textures/` under `public/`, mount `<Scene />` lazily inside a persistent layout (see `Layout.jsx`), and keep `manualChunks` in `vite.config.js` sending three/drei/postprocessing to a separate chunk.
