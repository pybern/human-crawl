# Project Notes — Overnight Success (onstud.io)

Concise-but-detailed notes for the whole build. For the deep, file-level
reference see [`IMPLEMENTATION.md`](./IMPLEMENTATION.md); this doc is the
high-level **map + decisions + improvement backlog**.

> Origin: started as a faithful reproduction of lusion.co, then rebranded to the
> **Overnight Success** studio (AI · web · cutting-edge research) and extended
> with a dedicated cinematic landing and experiments.

---

## 1. What it is

A Next.js marketing/portfolio site with a heavy WebGL/animation layer:

- **`/`** — standalone **cinematic landing** (astronaut flies through space →
  data-grid tunnel → crystal cave → CTA), auto-scrolling, with a founders letter.
- **`/demo`** — the full multi-section **marketing site** (hero physics pit,
  kinetic type + ribbon, play reel, featured work, inline cinematic, footer).
- **`/founders`** — two side-by-side founder **letters** (Bernard Lee, Ludovic
  Grandclement).
- **`/about`** — studio about page.
- **`/new-world`** — `redirect("/")` (kept for old links).
- **`/fast`** — experimental high-intensity **wormhole** fly-through (unlinked).

**Stack:** Next.js 16 (App Router) · React 19 · TS · Tailwind v4 · three.js ·
@react-three/fiber v9 · drei v10 · @react-three/postprocessing · GSAP +
ScrollTrigger · Lenis · Zustand.

---

## 2. Architecture (the load-bearing decisions)

- **Two canvas models:**
  - *Shared canvas* (`canvas/SceneCanvas` + drei `<View>` via `LazyView`) — one
    transparent fixed canvas behind the DOM; sections map 3D to HTML rects.
    Used by `/demo` sections.
  - *Dedicated canvases* — the **hero** (`hero/HeroCanvas`) and the **cinematic**
    (`world/CinematicCanvas`) each own a `<Canvas>` so they can run an
    `EffectComposer` (post-processing doesn't compose inside a drei `<View>`).
- **Scroll pipeline:** Lenis smooth-scroll on a single rAF in `AppProviders`,
  which also drives `ScrollTrigger.update()`. Scroll-driven 3D reads a
  module-level `lib/cinema.ts` (`cinema.progress`, set by a ScrollTrigger
  `onUpdate`, read in `useFrame`) — no React re-render per frame.
- **State:** Zustand `lib/store.ts` — `ready`, `sceneReady`, `isMobile`,
  `reducedMotion`, `webglOk`, pointer, menu.
- **Loader gating:** preloader reveals only when min-time **+** assets (drei
  `useProgress`) **+** fonts **+** first painted WebGL frame (`sceneReady` via
  `canvas/FirstFrameSignal`) are ready; grace fallback for canvas-less routes;
  hard cap so it never hangs.
- **Scroll-lock + no layout shift:** `AppProviders` stops Lenis + `overflow:hidden`
  until ready (and the founders letter does the same while open); the native
  scrollbar is **hidden** in `globals.css` so toggling overflow never shifts layout.
- **Capability/accessibility:** WebGL/mobile/reduced-motion detection; DPR caps;
  mobile count reductions; static fallbacks when no WebGL.
- **No global header/cursor:** both removed from `layout.tsx` (files kept). The
  `MenuOverlay` is still mounted but currently **unreachable** (no trigger).

---

## 3. Key systems

### Cinematic landing (`/`, also `/fast`) — `world/NewWorldExperience` + `CinematicCanvas` + `CinematicJourney`
- Tall `620vh` scroll spacer drives `cinema.progress`; canvas + overlays are fixed.
- **Camera/astronaut:** GLTF astronaut (`world/AstronautModel`, Poly CC-BY); depth
  recedes then **pops forward** for the CTA.
- **Progressive engagement:** stars → grid → crystal cave fade in/out via
  smoothstep envelopes on progress; worlds clear before the CTA.
- **Auto-scroll** with **direction memory**: starts downward; the next user input
  (Lenis `virtual-scroll`, wheel+touch) sets the direction; debounced resume.
  Paused for loader/letter/reduced-motion; `/fast` runs quicker.
- **Progress rail** (right): short track + moving thumb, dark/subtle.
- **Chromatic halo:** CSS `mix-blend-screen` spectral ring; fades in with the zoom,
  persists. Zero WebGL cost.
- **Post stack:** Bloom · DOF (desktop) · ChromaticAberration · Vignette.

### Grid tunnel (shared by all cinematics) — `CinematicJourney/GridTunnel`
- Merged `lineSegments` (cheap) with **per-vertex depth gradient** (cyan→indigo
  outer, mint→violet inner) + **additive glow** (bloom-lit).
- Layers for dimensionality: outer square + mid square + inner diamond rings +
  longitudinal wall lines + **diagonal lattice truss** + drifting round particles.

### Particles
- Grid "data bits", starfield, sparkles are single-draw-call `THREE.Points` with a
  soft round sprite (`makeDot`) — round, plentiful, performant.

### CTA + founders letter
- LED-grid visor face, **emoji sticker ring**, and **reflective glass diamond gems**
  (switched off `transmission` which refracted to black shards).
- **"Letter from the founders"** modal (Bernard & Ludo) → "Learn more about us →"
  to `/founders`; back returns to `/#letter` (open letter at the bottom).
- Perf while open: canvas paused (`frameloop="never"`) + solid backdrop (no
  `backdrop-filter`); card scrolls on small viewports (`data-lenis-prevent`, `dvh`).

### `/fast` wormhole (behind a `wormhole` flag; `/` unaffected)
- Warp streaks (instanced Z-stretched bars), swirling **wormhole ring vortex**,
  camera **FOV warp-punch** + roll, **RadialBlurEffect** (custom zoom-blur post),
  boosted CA/bloom.

### Hero "jack pit" (`/demo`) — `hero/*` + `lib/three/jack.ts`
- Hollow open-tube "jacks" (LatheGeometry), custom instanced physics (center
  attraction + repulsion + pointer shove), env-reflective material, signature
  **mouse-displacement** post pass, balanced color bag.

### Brand & copy
- **Overnight Success** / **onstud.io** everywhere user-facing.
- Voice: AI · web · cutting-edge research, "built to solve real problems".
  Cinematic = "Pushing frontiers / responsibly" · "Practical, governed and
  secured AI journeys" · "From wild idea to working product" · "Let's build
  what's next."

---

## 4. Tooling, testing & gotchas

- **Capture scripts** in `/scripts` (Playwright + ffmpeg): `capture-reference`,
  `capture-self`, `capture-section`, `capture-hero`, `capture-route-cinematic`,
  `capture-swap-check`, `validate-cinematic`.
- **Headless WebGL (swiftshader) gotchas** (important for testing):
  - Launch Chrome with `--use-gl=angle --use-angle=swiftshader`.
  - Screenshots hang on animating canvases → record video + extract frames.
  - Shader compile **blocks the main thread**, so wall-clock timing is unreliable;
    don't gate test "ready" on a timer.
  - Detect ready by polling `window.lenis` (not `overflow`, which is `visible`
    pre-hydration).
  - Drive scroll with `window.lenis.scrollTo(..., {immediate, force})`.
- **Lint:** R3F mutates THREE objects per frame → `react-hooks/immutability` &
  `purity` disabled for `components/canvas/**`, `components/sections/**`,
  `lib/three/**` in `eslint.config.mjs`.
- **CSS over WebGL** where possible (halo) keeps GPU cost down.

---

## 5. File map (where to look)

```
app/                 page (/), demo, founders, about, new-world(redirect), fast, layout, globals.css
components/
  providers/AppProviders.tsx     Lenis + rAF + scroll-lock + capability/pointer
  canvas/                        SceneCanvas, LazyView, CanvasRoot, StudioEnv, FirstFrameSignal
  layout/                        Preloader, MenuOverlay, CornerMarks (Header/Cursor kept but unmounted)
  sections/                      Hero, BroughtToLife, PlayReel, FeaturedWork, NewWorld, Footer
  sections/hero/                 HeroCanvas, JackPit, HeroEnv
  sections/world/                NewWorldExperience, CinematicCanvas, CinematicJourney, AstronautModel,
                                 AstronautJourney (inline /demo), Astronaut
lib/   store, cinema, capabilities, data/projects, three/{jack, MouseDisplacementEffect, RadialBlurEffect}
```

---

## 6. Improvement notes / backlog

**Navigation & IA**
- `MenuOverlay` is mounted but unreachable (header removed). Either add a minimal
  nav affordance (e.g., a corner menu button) or remove the overlay.
- Decide the canonical home: `/` (cinematic) vs `/demo` (marketing) — currently
  "Home" links point at `/`; consider a clearer path between them.

**Performance**
- On `/` (and `/fast`) the **shared `CanvasRoot` canvas is an idle 2nd WebGL
  context**. Consider suppressing it on dedicated-canvas routes to save a context
  (esp. mobile/low-end).
- Grid is now dense (lattice + nested rings). Add a **distance/LOD fade** or reduce
  lattice node count on mobile if frame budget is tight.
- Validate real-device perf for the cinematic + `/fast` (post stack + bloom are
  the heavy bits; DOF already desktop-only).

**Code health**
- Two cinematic implementations exist: inline `/demo` (`AstronautJourney`) and
  standalone (`CinematicJourney`). They share concepts but diverge — consider
  unifying or extracting shared pieces (grid, particles, fades).
- `/fast` lives behind a `wormhole` flag in shared components — productionize
  (promote effects to `/`) or remove the sandbox before launch.

**Accessibility**
- Add a **focus trap** + return-focus to the founders letter modal (Esc already
  closes); add `aria` to the progress rail; confirm auto-scroll/wormhole respect
  reduced-motion (auto-scroll does).

**Content / launch readiness**
- Replace placeholder **project entries** + videos with real work; set a real
  footer **address** and social links (consider adding GitHub).
- Add **OG images**, `sitemap.xml`, `robots.txt`, and real metadata per route.
- Add a studio **tagline** and thread it through hero/metadata if desired.

**Testing**
- Formalize the capture scripts into a small **visual-regression** check (golden
  frames per route/progress) so animation regressions are caught automatically.
- `validate-cinematic.mjs` asserts the depth shape; extend to assert
  fades/CTA/letter states.

**Nice-to-haves explored but not shipped**
- `/fast`: energy-tunnel **shader wall**, astronaut **afterimage/motion-blur**
  trail, a **punch-through flash** at the wormhole center before the CTA.
- Animated grid gradient (hues flowing down the tunnel), speed-reactive glow,
  far-end depth fog.
