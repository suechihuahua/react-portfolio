# Natsuo Fujita — portfolio

A console. Near-black, with a slowly drifting grid and three soft colour fields
behind everything, monospace chrome, and a command palette on `⌘K` that
fuzzy-searches every section, link and action. A five-second welcome runs once
per session — click anywhere or press any key to skip it. Built with React 19,
Vite, react-router, framer-motion and zustand.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run lint
npm run check:bundle # build + keep the initial JS under budget
npm run capture      # regenerate public/og.png and the favicons
npm run screenshots  # 375/768/1440 screenshots + overflow check
```

Add `?capture` to any URL to render the content alone, without the sidebar,
status bar or welcome.

## The welcome

`src/lib/welcomeTimeline.js` holds the five seconds as pure maths: beats in
milliseconds, and `welcomeState(elapsed)` returning every number the DOM needs.
`Welcome.jsx` drives it from one `requestAnimationFrame` loop that writes CSS
variables and the decrypting characters straight to the DOM, so React never
re-renders during playback. Under `prefers-reduced-motion` it shows the settled
card and moves on.

The background (`Ambient.jsx`) animates `transform` only, so it composites on
the GPU and never repaints over the content.

## How it moves

- `⌘K` / `Ctrl-K` opens the command palette anywhere; `↑` `↓` move, `↵` runs,
  `esc` closes. It covers every section plus the résumé, a copy-email action
  and the external links.
- `↑` `↓` (outside the palette) step through sections in order; so does a
  scroll or a swipe.
- Click anywhere, or press any key, to skip the welcome.
- Deep links and `?capture` never show the welcome, not even for a frame.

## Content

Everything comes from `src/content/site.js`. Each entry in `sections` is one
route and one screen: `slug`, `label`, `summary` (shown under the heading and
in palette results) and `blocks` — the body, in kinds `prose`, `list`,
`timeline` and `projects` (see `src/components/SectionView.jsx`). Adding a
section gives it a route, a numbered sidebar entry, a palette command and a
place in the keyboard order, with no other edits.

`public/resume.pdf` is the downloadable résumé — replace the file and nothing
else needs to change.

## Where the logic lives

`src/lib/commands.js` is the only non-trivial piece and it is pure: it builds
the command list from `sections` + `person`, and `filterCommands` ranks them
with a subsequence match that scores earlier, tighter hits higher and weights
label matches above keyword ones. It has no React or DOM in it, so it is
unit-tested directly.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project**, import the repo. Framework preset
   **Vite**; leave build (`vite build`) and output (`dist`) as detected. Deploy.
3. Analytics: in the project's **Analytics** tab click **Enable**. The
   `<Analytics />` component is already mounted.
4. Custom domain (optional): **Settings → Domains → Add**, then add the records
   Vercel shows at your registrar (an `A` record to `76.76.21.21` for the apex,
   or a `CNAME` to `cname.vercel-dns.com` for `www`). Afterwards update the
   `canonical` / `og:url` / `og:image` URLs in `index.html`.

Client-side routes survive a refresh because `vercel.json` rewrites every path
to `index.html`.

## Earlier versions

Both are kept in full, with a README each on how to restore them:

- `archive/anime-room/` — an illustrated bedroom you moved a camera around,
  opening on a five-second title sequence. Tag `anime-room-v1`.
- `archive/solar-system/` — a textured 3D solar system where each section was a
  planet. Tag `solar-system-v1`.
