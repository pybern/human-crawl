# Implementation Guide

A comprehensive engineering reference for this lusion.co reproduction: the
architecture, every section's **design / animation / physics**, the **gotchas**
we hit, and the **lessons learned**. For the reference-site breakdown see
[`USER_JOURNEY.md`](./USER_JOURNEY.md); for the original plan see
[`PLAN.md`](./PLAN.md).

- Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
  three.js · @react-three/fiber v9 · @react-three/drei v10 · GSAP + ScrollTrigger ·
  Lenis · Zustand**.
- Validate visuals headlessly with the scripts in [`/scripts`](../scripts).

---

## 1. Architecture overview

```
app/
  layout.tsx        Root: fonts + metadata; mounts providers, canvas, chrome, page
  page.tsx          Section composition (Hero → BroughtToLife → PlayReel →
                    FeaturedWork → NewWorld(+CTA) → Footer)
  template.tsx      Per-route transition (clip wipe)
  about/page.tsx    Route-transition target
  globals.css       Design tokens, Lenis + cursor wiring, .pill (components layer)
components/
  providers/AppProviders.tsx   Lenis smooth-scroll + single rAF + capability/pointer detection
  canvas/
    CanvasRoot.tsx   dynamic(ssr:false) gate; renders nothing if no WebGL
    SceneCanvas.tsx  the one shared <Canvas> + <View.Port/> (transparent, z-5, pointer-events none)
    LazyView.tsx     IntersectionObserver-gated <View> mount + static fallback
    StudioEnv.tsx    Lightformer-based environment (no HDR download)
  layout/   Header, MenuOverlay, Cursor (fluid), CornerMarks, Preloader
  sections/ Hero, BroughtToLife, PlayReel, FeaturedWork, NewWorld, Footer (+ 3D under hero/, visuals/, work/, world/)
  ui/       Reveal, KineticHeading
lib/    store (zustand), capabilities, cinema (scroll-progress holder), data/projects, three/jack
hooks/  useTilt
scripts/ capture-reference.mjs, capture-self.mjs, validate-cinematic.mjs
```

### The "single shared canvas" model (the Lusion approach)
- One persistent, **transparent** `<Canvas>` (`SceneCanvas.tsx`) is layered **above**
  the DOM (`position:fixed; z-index:5; pointer-events:none`).
- Each section anchors its 3D to an HTML element with a drei **`<View>`** (wrapped
  in **`LazyView`**). drei scissors each View's render to its tracked element's
  rect → "3D mapped to the position of HTML elements".
- The 3D draws over the section's dark "window" div; transparent areas of the
  scene let the DOM show through. DOM text overlays that must sit *in front* of
  the 3D raise their own stacking context above `z-5` (see the cinematic/CTA).

### Scroll + animation pipeline
- **Lenis** smooth scroll runs on a single `requestAnimationFrame` loop in
  `AppProviders`, which also calls `ScrollTrigger.update()`.
- Scroll-driven 3D reads progress without re-rendering React: the cinematic uses
  a module-level holder `lib/cinema.ts` (`cinema.progress`) set by a ScrollTrigger
  `onUpdate` and read inside `useFrame`.
- DOM reveals use GSAP ScrollTrigger (`Reveal`, `KineticHeading`, per-card timelines).

### Capability + accessibility
- `lib/capabilities.ts` detects WebGL, mobile (coarse pointer / <768px), and
  `prefers-reduced-motion`; stored in Zustand (`lib/store.ts`).
- DPR is capped (`[1,1.5]` mobile / `[1,2]` desktop); body/particle counts drop
  on mobile; reduced-motion disables Lenis smoothing + non-essential motion;
  no-WebGL renders static gradient fallbacks (`LazyView` + `CanvasRoot`).

---

## 2. Section-by-section

### 2.0 Preloader — `components/layout/Preloader.tsx`
- **Design:** black screen, glossy "L" mark (two gradient panels), `0→100`
  counter, "Loading experience".
- **Animation:** counter eases via `useProgress` (drei) with a **min time
  (1400ms)** and a **hard cap (3600ms)** so it always reveals; clip-path wipe-up
  reveal, then `store.ready`.
- **Gotcha:** one-shot — once revealed it never returns even as later sections
  stream in (see §3).

### 2.1 Hero — "jack pit" — `Hero.tsx` + `hero/JackPit.tsx` + `lib/three/jack.ts`
- **Design:** rounded dark window holding a dense pile of glossy "jack" shapes
  (cobalt/white/black/grey), env-reflective `MeshPhysicalMaterial` with clearcoat.
  Geometry = 3 perpendicular capped cylinders + centre sphere + 6 torus rim tips,
  merged (`createJackGeometry`).
- **Physics (custom, not a library):** a lightweight sim in `Pile`:
  - **Centre attraction** (not gravity) so the pile always fills the window and
    refills after the cursor carves through (`attract = 4`).
  - **Sphere-approx pairwise repulsion** (O(n²), n≈52 desktop / 30 mobile).
  - **Amplified pointer shove** with a velocity cap (`MAX_V`).
  - **Calm rotation:** initial angular vel 0.7, damping 0.82/substep, hard cap
    `MAX_A = 2.2 rad/s`, gentle collision/cursor tumble.
  - Rendered through **one `InstancedMesh`** (per-instance colour), 1 draw call.
- **Why custom:** `@react-three/rapier` does not render inside a drei `<View>`
  portal (see §3) — so we wrote our own sim.
- **Reference baseline (recorded from the live site):**
  `docs/reference/desktop/hero_interact_00..05.jpg` + `docs/reference/hero_interaction.mp4`
  (capture with `node scripts/capture-reference.mjs --mode=hero-interaction`). Confirms the real
  build: three.js + **Rapier**, a **mouse-tracked collider**, a **centre-attraction** force, and a
  **custom impulse** that amplifies small cursor moves ("ball smasher"); the pit is masked by a
  rounded **stencil** window and a **2D mouse-displacement** post pass ripples the canvas around the
  cursor. Geometry read from the frames: each jack is **three perpendicular thick hollow open tubes**
  (visible bores, short chunky arms ≈ tip-to-tip 2× the outer diameter), very glossy clearcoat, deep
  cobalt/white/black/grey, with depth-of-field softening the far pieces.

### 2.2 Bold Ideas, Brought to Life — `BroughtToLife.tsx` + `visuals/Ribbon.tsx`
- **Design:** kinetic word-rise heading (`KineticHeading`), a glossy cobalt
  `TubeGeometry` ribbon along a `CatmullRomCurve3`, body copy + "Our approach".
- **Animation:** ribbon slow auto-rotate; heading words rise from a clipped mask
  on scroll; copy reveals with `Reveal` (stagger).

### 2.3 Play Reel — `PlayReel.tsx`
- **Design:** full-bleed reel block, kinetic "Play / Reel" type, circular play
  button, corner marks.
- **Animation/behaviour:** looping placeholder video (`public/videos/reel.mp4`),
  `IntersectionObserver` plays/pauses on view, button toggles mute. Text uses
  `mix-blend-difference`.

### 2.4 Featured Work — `FeaturedWork.tsx` + `work/ProjectCard.tsx` + `hooks/useTilt.ts`
- **Design:** 2-col grid (1-col mobile); media + tag row + title + `→` chip.
- **Animation/interaction:**
  - **Entrance:** media **clip-path wipe-up** + **text rise**, staggered per
    column (GSAP ScrollTrigger).
  - **Tilt:** `useTilt` eases a subtle 3D `rotateX/rotateY` (max 6°) toward the
    cursor (rAF spring; off for touch / reduced-motion).
  - **Depth:** a "View project →" chip on `translateZ(40px)` over a darken
    gradient, fading in on hover.
  - **Hover:** video plays, brightness `0.92→1`, scale `1.02→1.07`, arrow inverts.
- **Reference note:** the real site renders thumbnails in WebGL; the slight tilt
  is reproduced here in CSS for reliability.

### 2.5 Step into a new world + CTA (shared scene) — `NewWorld.tsx` + `world/AstronautJourney.tsx` + `world/Astronaut.tsx` + `lib/cinema.ts`
- **Design:** one pinned (CSS-sticky) scene for the whole back half. A **single
  astronaut instance** (procedural primitives) flies down `-Z` through three
  worlds: starfield → wireframe **grid tunnel** (lineLoops) → emissive **crystal
  cave** (instanced octahedra), with a lens/chromatic vignette and fog that
  shifts per zone.
- **Scroll-driven depth (validated):** `astronautDepth(p)` starts close-ish
  (`START=7`), **recedes** to `FAR=18` (smaller, sinks downward) over ~78% of the
  scroll, then **pops forward** to `NEAR=6.5` for the CTA. The pop is framed so
  the whole figure + face stay in view.
- **Cinematic → CTA continuity (the "same instance"):** as `cta = smoother((p-0.8)/0.2)`
  ramps: worlds fade out, the visor's **LED smiley** fades in (drawn in front of
  the visor, `depthWrite:false`), and a **ring of sticker billboards** (emoji
  canvas textures, parented to the astronaut) fades/scales in. The astronaut
  settles facing the camera. DOM copy ("Step into a new world" → "Let's work
  together!") cross-fades via a scrubbed GSAP timeline.
- **Layering:** the sticky overlay uses **`z-20`** so the CTA copy reads clearly
  **in front** of the WebGL astronaut; the heading has a text-shadow for contrast
  over the white figure; stickers sit in a wide ring clear of the heading band.
- **Validation:** `scripts/validate-cinematic.mjs` drives `window.cinema.progress`
  0→1 and asserts the depth shape (recede → deepest in latter half → pop forward).

### 2.6 Footer + About teaser — `Footer.tsx` + `app/about/page.tsx` + `app/template.tsx`
- **Design:** light contact block (address, socials, enquiries, newsletter,
  credits, scroll-to-top) + a dark "About Us" next-page teaser.
- **Behaviour:** newsletter is a client-only fake submit; scroll-to-top uses
  Lenis; the teaser links `/about` with a clip-wipe route transition (`template.tsx`).

### Global chrome
- **Header** (`Header.tsx`): wordmark + Let's talk + Menu; flips colour over
  `[data-theme='dark']` sections; collapses on mobile.
- **Menu overlay** (`MenuOverlay.tsx`): full-screen clip-path nav.
- **Cursor** (`Cursor.tsx`): **fluid dye trail** — a canvas paints a soft white
  blob easing toward the pointer with a `destination-out` fade and velocity-
  reactive radius, blended `mix-blend-mode: difference` so it inverts whatever's
  beneath; crisp dot marks the exact pointer. Desktop / fine-pointer only.
- **Corner marks** (`CornerMarks.tsx`): the "+" registration marks.

---

## 3. Gotchas (and how we handled them)

| Gotcha | Symptom | Fix |
|---|---|---|
| **Next.js 16 strict React-hooks rules** | Build/lint fails: `react-hooks/immutability`, `purity`, `refs` | Per-frame three.js mutation + generative randomness are correct here → disabled `immutability` & `purity` for the WebGL layer in `eslint.config.mjs`; for `refs`, never write/read `ref.current` during render (do it in effects) and use JSX `ref=` not `createElement`. |
| **drei `<View>` API** | Nothing rendered | `<View className/style>` renders its *own* tracked element and tunnels children; `track` is ignored in the HTML path. Canvas must be layered **above** the DOM (transparent, `z-5`). |
| **`Environment preset` suspends** | Blank scene in sandbox/CI | It fetches an HDR from a CDN → use self-contained `StudioEnv` (Lightformers, `resolution 256`, `frames 1`). |
| **@react-three/rapier inside `<View>`** | Bodies simulate but **meshes never render**; WASM suspend caused `WebGLRenderer: Context Lost` | Abandoned rapier; wrote a custom instanced sim for the hero pit and the CTA stickers. |
| **Physics box mis-placed** | Pile settled out of frame | Floor/walls must match the *visible* viewport (`viewport.width/height`), not arbitrary units. |
| **`three-stdlib` not resolvable** | Module-not-found at build | Import merge util from `three/examples/jsm/utils/BufferGeometryUtils.js`. |
| **`<Preload all/>`** | Preloader hung ~5s; re-appeared mid-scroll | Removed it (it eagerly loaded every section); hardened Preloader (one-shot + MIN/MAX cap, progress via refs). |
| **Tailwind `.pill` overrode `hidden`** | Mobile header didn't collapse | Move custom component classes into `@layer components` so utilities win. |
| **Sticky stacking context** | CTA copy hidden behind the canvas | The sticky layer creates a stacking context below the canvas (`z-5`); raise it (`z-20`) so DOM overlays paint in front. |
| **Sticker double-transform** | Stickers flew off-screen | They were parented to the astronaut *and* had its world position copied in — remove the copy; let them inherit. |
| **White text over white astronaut** | CTA heading hard to read | Strong `text-shadow` + ring-placed stickers clear of the heading band. |
| **Headless WebGL capture** | `networkidle` never settles; screenshots hang on rAF | Launch Chrome with `--use-gl=angle --use-angle=swiftshader`; `waitUntil:'load'` + fixed waits + `animations:'disabled'`; lusion.co is scroll-jacked so drive with `mouse.wheel`, and use `window.lenis.scrollTo` for our own site. |

---

## 4. Lessons learned

1. **Treat the framework version as unknown.** Next.js 16 shipped breaking
   conventions and aggressive new lint rules; reading the bundled docs and
   adapting the lint config early saved repeated build failures.
2. **Prefer self-contained, deterministic visuals.** Lightformer environments,
   procedural geometry, ffmpeg-generated placeholder videos and emoji-canvas
   textures all render reliably offline/in CI and are trivially swappable.
3. **A small custom sim can beat a physics library** when the library fights the
   render architecture (rapier vs. `<View>`). `InstancedMesh` + a few hundred
   lines gave full control and one draw call.
4. **Continuity needs one scene, not two.** A single shared astronaut across the
   cinematic and CTA (one pinned scene, one scroll) reads far better than two
   separate scenes — visual engagement carries through.
5. **Author motion against an explicit progress value.** Driving depth/fog/face/
   stickers from one `0..1` makes the sequence tunable and **testable**.
6. **Make effects automatically verifiable.** `validate-cinematic.mjs` asserts
   the depth shape (recede → pop) so regressions are caught, not eyeballed.
7. **Mind stacking contexts.** Sticky/fixed layers + a global canvas require
   deliberate `z-index` planning so text stays legible in front of WebGL.
8. **Performance via laziness.** `LazyView` (IntersectionObserver-gated mounts)
   avoids compiling every section's shaders on first load.
9. **Respect the cheap wins for UX:** reduced-motion, DPR caps, mobile counts,
   offscreen video pausing, and graceful no-WebGL fallbacks.

---

## 5. Tuning quick-reference

| Want to change | Where |
|---|---|
| Jack count / size / spin | `hero/JackPit.tsx` (`count`, `scale`, `attract`, `MAX_A`, damping) |
| Astronaut depth / pop | `world/AstronautJourney.tsx` (`START`, `FAR`, `NEAR`, `POP_AT`) |
| CTA take-over timing | `AstronautJourney.tsx` (`cta = smoother((p-0.8)/0.2)`) + `NewWorld.tsx` timeline |
| Card tilt strength | `hooks/useTilt.ts` (`max`, `perspective`) |
| Cursor trail length / size | `layout/Cursor.tsx` (blob alpha `0.2`, fade `0.12`, `baseR`) |
| Palette / fonts | `app/globals.css` tokens; `app/layout.tsx` fonts |
| Projects | `lib/data/projects.ts` + `public/videos/*` |
```
