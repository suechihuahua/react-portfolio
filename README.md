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
