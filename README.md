# Natsuo Fujita — portfolio

An illustrated, interactive room. A door opens on black; inside, each section of the portfolio is a spot in the room and a pose of the avatar — click him and he changes into a suit and introduces himself; the bookshelf, desk, poster wall and bed hold education, work, projects, skills and hobbies. Built with React 19, Vite, react-router, framer-motion and zustand — no WebGL.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run lint
npm run check:bundle # build + keep the initial JS under budget
npm run art          # slice art/sheet.png into public/room (room + six poses)
npm run capture      # regenerate public/room-poster.jpg, og.png, favicons
npm run screenshots  # 375/768/1440 screenshots + overflow check
```

Add `?capture` to the URL to render the room alone (no door, menu or cards).

## Content

Everything comes from `src/content/site.js`. Each entry in `sections` is one spot: `spot` (where the camera looks, in % of the room image, plus zoom), `avatar` (where the pose stands), `pose`, `lines` (the dialogue) and `blocks` (the card: prose, list, timeline, projects). `public/resume.pdf` is the downloadable résumé — replace the file and nothing else needs to change.

## Art

`art/sheet.png` is the generated sheet: the room on top and six poses on painted checkerboards. For crisp output, first upscale it 4× with [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN/releases) (the `realesrgan-ncnn-vulkan` Windows build):

```bash
realesrgan-ncnn-vulkan.exe -i art/sheet.png -o art/sheet-4x.png -n realesrgan-x4plus-anime -s 4
```

`npm run art` then uses `art/sheet-4x.png` when present (falling back to the original), crops the panels, keys out the checkerboards (edge flood-fill, enclosed-pocket detection, defringe — see `scripts/keying.mjs`) and writes `public/room/`: the room at 4096 px wide and each pose at 3× its panel size. Adjust the panel rectangles at the top of `scripts/slice-art.mjs` if the sheet layout changes.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project**, import the repo. Framework preset **Vite**; leave build (`vite build`) and output (`dist`) as detected. Deploy.
3. Analytics: in the project's **Analytics** tab click **Enable**. The `<Analytics />` component is already mounted.
4. Custom domain (optional): **Settings → Domains → Add**, enter the domain, then at your registrar add the records Vercel shows (an `A` record to `76.76.21.21` for the apex, or a `CNAME` to `cname.vercel-dns.com` for `www`). Afterwards update the `canonical` / `og:url` / `og:image` URLs in `index.html`.

Client-side routes work on refresh because `vercel.json` rewrites every path to `index.html`.

The previous version of this site — a textured 3D solar system — is kept under `archive/solar-system/` and at the git tag `solar-system-v1`.
