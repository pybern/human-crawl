# LUSION — reproduction

A faithful, responsive reproduction of the award-winning [lusion.co](https://lusion.co)
immersive WebGL experience ([Awwwards reference](https://www.awwwards.com/sites/lusion-v3)),
built with **Next.js 16 (App Router)**, **React 19**, **React Three Fiber**, **GSAP** and
**Lenis**. Works on desktop and mobile.

> This is a study/reproduction of the signature journey and effects using open-source /
> placeholder assets. It is not affiliated with Lusion.

## The journey

| Section | What it does |
|---|---|
| **Preloader** | Glossy "L" mark + 0→100 counter, then a clip-wipe reveal |
| **Hero — jack pit** | Interactive pile of glossy "jack" shapes with centre-attraction physics; the cursor/touch smashes through it |
| **Bold Ideas, Brought to Life** | Kinetic heading + a glossy flowing 3D ribbon + copy |
| **Play Reel** | Full-bleed showreel with kinetic "Play Reel" type + play/mute |
| **Featured Work** | Responsive project grid with hover-to-play video cards |
| **Step into a new world** | Pinned, scroll-driven cinematic: an astronaut flies through space → a wireframe grid tunnel → a glowing crystal cave, with a lens/chromatic vignette and fading text |
| **Let's work together** | Smiley-helmet astronaut in a floating emoji-sticker cloud with cursor parallax |
| **Footer + About teaser** | Contact / newsletter / socials + a dark "About Us" next-page teaser with a route transition |

See [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) for the comprehensive engineering
reference (architecture, per-section design/animation/physics, gotchas, lessons learned),
[`docs/USER_JOURNEY.md`](docs/USER_JOURNEY.md) for a section-by-section breakdown of the
real site (with captured reference frames), and [`docs/comparison/`](docs/comparison) for
reference-vs-reproduction screenshots.

## Architecture

- **One persistent, transparent `<Canvas>`** is layered above the DOM. Each section anchors its
  3D to an HTML element via a drei `<View>` (wrapped in `LazyView`), i.e. *"3D mapped to the
  position of HTML elements"* — the approach Lusion documents in their
  [WebGL-Scroll-Sync](https://github.com/lusionltd/WebGL-Scroll-Sync) write-up.
- **Lenis** smooth scrolling on a single rAF loop that also drives **GSAP ScrollTrigger**.
- **`LazyView`** mounts each section's 3D only when it scrolls near the viewport (drei skips
  rendering off-screen Views), avoiding a first-load shader-compile stall.
- The hero pit and the CTA sticker cloud use **lightweight custom simulations rendered through a
  single `InstancedMesh`** (reliable inside `<View>`, one draw call).
- Capability detection caps DPR, reduces body/particle counts on mobile, honours
  `prefers-reduced-motion`, and shows static gradient fallbacks when WebGL is unavailable.

```
app/            layout, page (section composition), about, template (route transition), globals.css
components/
  providers/    Lenis + rAF + capability/pointer detection
  canvas/       CanvasRoot (ssr:false), SceneCanvas (<View.Port>), LazyView, StudioEnv
  layout/       Header, MenuOverlay, Cursor, CornerMarks, Preloader
  sections/     Hero, BroughtToLife, PlayReel, FeaturedWork, NewWorld, LetsWork, Footer (+ 3D)
  ui/           Reveal, KineticHeading
lib/            store (zustand), capabilities, cinema, data/projects, three/jack
scripts/        capture-reference.mjs, capture-self.mjs
docs/           USER_JOURNEY.md, reference/, self/, comparison/, PLAN.md
```

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Production:

```bash
pnpm build && pnpm start
```

## Capturing screenshots (optional)

Both scripts use a system Chrome via `CHROME_PATH` (defaults to `/usr/local/bin/google-chrome`)
with SwiftShader, so WebGL works headless.

```bash
node scripts/capture-reference.mjs              # records the real lusion.co -> docs/reference/
node scripts/capture-self.mjs                   # records this app (dev server running) -> docs/self/
```

## Assets & licensing

All visuals are **procedural or open-source placeholders, designed to be swapped**:

- **Jacks, ribbon, worlds, astronaut, crystals** — procedurally generated from three.js
  primitives (no external files, CC0-by-construction).
- **Environment reflections** — built at runtime from drei `<Lightformer>`s (no HDR download).
- **Videos** (`public/videos/*.mp4`) — generated with `ffmpeg` gradient sources as CC0-style
  placeholders for the showreel and project hovers; replace with real footage.
- **Stickers** — system emoji rasterised to canvas textures.
- **Fonts** — [Space Grotesk] (display) + [Inter Tight] (body) via `next/font/google`, as free
  near-matches for Lusion's grotesk; swap for the licensed face later.

## Notes / scope

A 1:1 clone is a ~year-long studio effort; this targets the full journey and the signature
effects at curated fidelity. Deferred refinements: a true cursor-displacement post-process and a
stencil-rounded hero window. See [`docs/PLAN.md`](docs/PLAN.md).
