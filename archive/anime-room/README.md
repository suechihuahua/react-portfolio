# Illustrated anime room (archived)

The version of this site that opened on a five-second title sequence and let you
walk a camera around an illustrated bedroom, where each portfolio section was a
spot in the room and a pose of the avatar. Replaced by the terminal console.
The last working commit is tagged `anime-room-v1` (`git checkout anime-room-v1`).

## What's here

- `TitleSequence.jsx` + `introTimeline.js` — the 5s title card. The timeline is
  pure maths (beats in ms, `introState(elapsed)` returning every number the DOM
  needs); the component drove it from one rAF loop writing CSS variables, so
  React never re-rendered during playback.
- `DoorIntro.jsx` — the SVG door gate that stood between the intro and the room.
- `RoomStage.jsx` + `camera.js` — the pan/zoom stage. `camera.js` is the useful
  part: `getCameraTransform(spot, room, viewport)` frames a point of a
  cover-sized image into the half of the screen the UI leaves free.
- `Avatar.jsx` — the cross-fading pose sprite.
- `Dialogue.jsx` + `useSpeech.js` — the visual-novel dialogue box and its
  optional browser text-to-speech.
- `ChapterRail.jsx` — the numbered section rail.
- `Layout.jsx`, `index.css` — the shell and stylesheet that hosted it all.
- `room/` — the sliced artwork: the 4096px room plate and six pose cut-outs.

## To bring it back

Copy the components back under `src/`, move `room/` to `public/room/`, restore
`sections` in `src/content/site.js` with their `spot` / `avatar` / `marker` /
`pose` / `lines` fields, and mount `RoomStage` inside a persistent layout.

`art/sheet.png` (still at the repo root) is the source sheet; `npm run art` and
`scripts/keying.mjs` slice and key it.
