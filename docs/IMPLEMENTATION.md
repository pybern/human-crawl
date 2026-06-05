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
  layout.tsx        Root: fonts + metadata; mounts providers, canvas, preloader, menu, page
  page.tsx          "/" → the standalone cinematic landing (NewWorldExperience) — §2.7
  demo/page.tsx     "/demo" → the full marketing site (Hero → BroughtToLife → PlayReel →
                    FeaturedWork → NewWorld(+CTA) → Footer)
  founders/page.tsx "/founders" → two side-by-side founder letters — §2.8
  new-world/page.tsx "/new-world" → redirect("/") (kept so old links work)
  template.tsx      Per-route transition (clip wipe)
  about/page.tsx    Route-transition target
  globals.css       Design tokens, Lenis wiring, hidden native scrollbar, .pill (components layer)
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
- **Scroll-lock** while overlays are up: `AppProviders` stops Lenis + sets
  `html { overflow:hidden }` until `store.ready` (loader) and the founders letter
  does the same while open. The native scrollbar is hidden in `globals.css` so
  these toggles never shift layout.
- **First-frame gating:** `components/canvas/FirstFrameSignal` (a one-shot
  `useFrame`) flips `store.sceneReady` the first time a heavy canvas paints, so
  the preloader can wait for the scene to be on screen (see §2.0).

### Capability + accessibility
- `lib/capabilities.ts` detects WebGL, mobile (coarse pointer / <768px), and
  `prefers-reduced-motion`; stored in Zustand (`lib/store.ts`).
- DPR is capped (`[1,1.5]` mobile / `[1,2]` desktop); body/particle counts drop
  on mobile; reduced-motion disables Lenis smoothing + non-essential motion;
  no-WebGL renders static gradient fallbacks (`LazyView` + `CanvasRoot`).

---

## 2. Section-by-section

### 2.0 Preloader — `components/layout/Preloader.tsx`
- **Design:** black screen with a **modern circular loader** centred — a faint
  track, a **determinate progress ring** (white, `stroke-dashoffset` driven by the
  real load %), a **spinning cobalt accent arc** (`animate-spin`), and the live
  `0→100` counter + "Loading" label in the middle. (Replaced the old glossy "L".)
- **Animation:** the counter eases toward `min(realProgress, timeProgress)` via
  drei `useProgress`; clip-path wipe-up reveal, then `store.ready` (700ms later).
- **Reveal only when actually rendered:** it lifts when `elapsed > MIN_MS (1200)`
  **and** assets are loaded (`!active`) **and** web fonts are ready
  (`document.fonts.ready`) **and** the main WebGL scene has painted its first
  frame (`store.sceneReady`, set by `FirstFrameSignal` in `CinematicCanvas` /
  `HeroCanvas`). Canvas-less routes (`/about`, `/founders`) fall back to a
  `SCENE_GRACE (2600ms)` window; a hard `MAX_MS (14000)` cap guarantees it never
  hangs. One extra rAF before `setDone` so the ready page paints first.
- **Gotcha:** one-shot — once revealed it never returns even as later content
  streams in (see §3).

### 2.1 Hero — "jack pit" — `Hero.tsx` + `hero/HeroCanvas.tsx` + `hero/JackPit.tsx` + `hero/HeroEnv.tsx` + `lib/three/jack.ts` + `lib/three/MouseDisplacementEffect.ts`
- **Design:** rounded dark window holding a dense pile of big, glossy "jack" shapes
  (deep-cobalt/white/black/grey). **Geometry = three perpendicular thick *hollow
  open tubes*** (revolved wall cross-section via `LatheGeometry`, beveled rims) +
  a centre plug sphere, merged (`createJackGeometry(arm, outerR, innerR)`) — you
  see straight down each bore, exactly like the reference. Material is an
  env-reflective `MeshPhysicalMaterial` (clearcoat, `roughness 0.16`,
  `envMapIntensity 1.15`, `side: DoubleSide` so the thin shells read solid).
- **Dedicated canvas (not the shared `<View>` port):** the hero has its **own**
  transparent `<Canvas>` (`HeroCanvas`) so it can run an **`EffectComposer`** —
  postprocessing doesn't compose inside a drei `<View>` (see §3). Lighting comes
  from a hero-local `HeroEnv` (neutral white Lightformers, no HDR) kept separate
  from the shared `StudioEnv` so the cobalt stays true. The loop is **paused via
  `frameloop="never"` when the window scrolls out of view** (IntersectionObserver
  in `Hero`) so it isn't burning frames page-deep.
- **Signature mouse-displacement** (`MouseDisplacementEffect`): a `mainUv` post
  pass that **drags** the rendered pixels along the eased cursor velocity (the
  fluid smear) plus a small radial **lens**, gaussian falloff, aspect-corrected.
  Desktop-only, disabled for reduced-motion. (Verified by forcing a fixed strong
  lens during dev.)
- **Depth-of-field:** the same hero composer adds a subtle `DepthOfField` so the
  front pile stays crisp and far pieces soften (matches the reference bokeh).
- **Balanced palette:** colours are dealt from a weighted, shuffled bag
  (`colorBag`) so every load shows a good cobalt/white/black/grey mix instead of
  an occasional white-heavy random draw.
- **Physics (custom, not a library):** a lightweight sim in `Pile`:
  - **Centre attraction** (not gravity) so the pile always fills the window and
    refills after the cursor carves through (`attract = 4`).
  - **Sphere-approx pairwise repulsion** (O(n²), n≈24 desktop / 14 mobile — fewer,
    bigger pieces than before to match the reference).
  - **Amplified pointer shove** (radius ≈ 2.3) with a velocity cap (`MAX_V`).
  - **Calm rotation:** initial angular vel 0.6, damping 0.82/substep, hard cap
    `MAX_A = 2.2 rad/s`, gentle collision/cursor tumble.
  - Rendered through **one `InstancedMesh`** (per-instance random colour), 1 draw call.
- **Why custom physics:** `@react-three/rapier` does not render inside a drei
  `<View>` portal (see §3) — so we wrote our own sim.
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

### 2.5 Step into a new world + CTA (inline `/demo` scene) — `NewWorld.tsx` + `world/AstronautJourney.tsx` + `world/Astronaut.tsx` + `lib/cinema.ts`
> This is the **inline** version that lives in the `/demo` marketing page. The
> standalone, higher-detail **`/` landing** cinematic is documented in **§2.7**.
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

### 2.7 Standalone cinematic landing (`/`) — `world/NewWorldExperience.tsx` + `world/CinematicCanvas.tsx` + `world/CinematicJourney.tsx` + `world/AstronautModel.tsx`
The home route is a full-screen, higher-fidelity cinematic: a GLTF astronaut
flies down `-Z` through **starfield → data-grid tunnel → crystal cave →
"Let's work together" CTA**, on a tall (`620vh`) scroll spacer that drives
`cinema.progress`. A **dedicated `<Canvas>`** (`CinematicCanvas`) runs the full
post stack (Bloom · DepthOfField · ChromaticAberration · Vignette).

- **Scroll-driven camera + astronaut:** the camera dollies `12 → CRYSTAL_END+8`
  with a gentle sinusoidal drift; `astronautDepth(p)` recedes (`START 7 → FAR 18`)
  then **pops forward** to `NEAR 6.5` at `POP_AT 0.78` for the CTA. Astronaut
  spin/sway scale by `(1 - cta)` so it settles facing camera at the end.
- **Progressive engagement (per-zone fades):** everything is hidden at frame 0
  and engages with scroll via smoothstep envelopes on `cinema.progress` —
  `gridFade` in ~0.08 / out ~0.6, `crystalFade` in ~0.36, `starFade` always-on
  base; each is multiplied so worlds **clear before the CTA**. `applyFade()`
  scales every material's stored `baseOpacity`, and groups go `visible=false`
  under threshold.
- **Auto-scroll with direction memory** (`NewWorldExperience`): the journey
  **auto-plays downward** by default (`lenis.scrollTo(limit, linear, ~36s)`); the
  next user input sets the direction (read from Lenis `virtual-scroll` deltaY —
  covers wheel + touch) with a debounce that resumes auto-scroll after the user
  settles. Paused while the loader/letter are up and disabled for reduced-motion.
- **Progress rail (right):** a short (`12vh`) lusion-style track + a muted thumb
  that travels `top = progress*76%`, updated in the ScrollTrigger `onUpdate`.
  Dark translucent track + soft thumb so it's visible-but-subtle.
- **Chromatic halo:** a large soft **spectral lens ring** (CSS
  `mix-blend-screen` radial-gradient, `92vmin`) centred on the viewport — it
  **fades in with the zoom** (`opacity = smoothstep(progress/0.5)`) and **persists**
  through the CTA. Pure CSS → no WebGL cost. (Ref: `docs/reference/desktop/d_08.png`.)
- **Particles = round `Points`:** the grid "data bits", the starfield and the
  crystal sparkles are single-draw-call `THREE.Points` clouds using a soft round
  sprite (`makeDot()` radial-gradient texture) — small spheres, lots of them,
  cheap. The grid bits drift `+Z` toward the camera each frame and wrap.
- **CTA hand-off** (`cta = smoother((p-0.82)/0.18)`): the visor's **LED-grid face**
  fades in (billboarded), a **ring of emoji sticker billboards** scales/fades in,
  and **reflective glass diamond gems** fade in and tumble. (Gems use a reflective
  `MeshPhysicalMaterial` that catches the env + bloom — **not** transmission,
  which refracted the dark background into near-black faceted shards over the
  icons; crystals also clear by ~`p0.86` so nothing dark drifts past — see §3.)
- **Founders letter** (`NewWorldExperience`): the CTA pill **"Letter from the
  founders"** opens a modal (paper card on a solid dark backdrop, ✉ pill, ×/Esc
  /backdrop close) with a **"Learn more about us →"** link to `/founders`. While
  open, page scroll + the cinematic scrub are **locked** and the cinematic
  **canvas is paused** (`frameloop="never"` via a `paused` prop) — a perf fix,
  since a `backdrop-filter:blur` over a live animating scene was the original
  jank. Arriving back via `/#letter` jumps to the end and re-opens the letter.
- **Perf:** dedicated canvas DPR-capped, post intensity scales down on mobile,
  DOF is desktop+full-motion only, particles are `Points`, halo is CSS, and the
  canvas pauses behind the letter.

### 2.8 Founders / About-us page (`/founders`) — `app/founders/page.tsx`
- **Design:** dark page, "Letters from the founders / About us", **two
  side-by-side light "paper" letter cards** (`md:grid-cols-2`) — **Bernard Lee**
  (left) and **Ludovic Grandclement** (right) — with corner marks and a top
  **"← Back"** that returns to **`/#letter`** (lands on the open letter at the
  bottom of the journey, see §2.7).

### Global chrome
- **Header / Cursor — removed.** The top header (`Header.tsx`) and the custom
  fluid cursor (`Cursor.tsx`) are **no longer mounted** in `layout.tsx` (the
  component files are kept for easy restore). With the cursor gone, the native
  pointer returns automatically — the `cursor:none` rule in `globals.css` only
  applied under the `html.has-custom-cursor` class that the cursor used to add.
- **Hidden native scrollbar** (`globals.css`): `scrollbar-width:none` +
  `::-webkit-scrollbar{display:none}` so the `overflow:hidden` scroll-locks
  (loader, letter, menu) never add/remove a gutter and shift layout.
- **Menu overlay** (`MenuOverlay.tsx`): full-screen clip-path nav — still mounted
  but currently unreachable without the header trigger.
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
| **`transmission` gems read black** | CTA diamond octahedra showed near-black faceted "shards" drifting over the icons | `MeshPhysicalMaterial` `transmission` refracts the *background* — over the dark scene that's black. Switched to a **reflective** glass material (env + bloom) and animate its opacity in; also clear the crystal cave before the icons ramp. |
| **`backdrop-filter:blur` over a live canvas** | Founders letter felt janky | Blurring a full-screen, continuously-animating WebGL scene re-blurs every frame. Use a **solid** dark backdrop and **pause the canvas** (`frameloop="never"`) while the overlay is open. |
| **`Points` look like squares** | "Particles are cubes" | Default GL points are square. Give `PointsMaterial` a soft round sprite (`makeDot` radial-gradient canvas texture) → little spheres; `Points` stays one draw call so counts can go up. |
| **Preloader revealed before WebGL painted** | Flash of unrendered/black scene | Gate the reveal on `store.sceneReady` (first `useFrame` via `FirstFrameSignal`) + fonts + assets, not just a timer; grace fallback for canvas-less routes (see §2.0). |
| **Headless WebGL capture** | `networkidle` never settles; screenshots hang on rAF | Launch Chrome with `--use-gl=angle --use-angle=swiftshader`; `waitUntil:'load'` + fixed waits + `animations:'disabled'`; lusion.co is scroll-jacked so drive with `mouse.wheel`, and use `window.lenis.scrollTo` for our own site. Don't detect "ready" via `overflow` (pre-hydration default is `visible`) — poll for `window.lenis`. |

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
10. **Pause what you can't see.** Pausing the cinematic canvas (`frameloop="never"`)
    behind the founders letter — and preferring a solid backdrop over
    `backdrop-filter` — removed real jank. Don't animate hidden scenes.
11. **Lean on `Points` for "more particles".** Round-sprite `Points` give many
    soft particles in one draw call; instanced meshes are heavier per-particle.
12. **Layer effects in CSS when you can.** The chromatic halo is a
    `mix-blend-screen` radial-gradient overlay — full lusion look, zero GPU scene
    cost, and trivially driven by `progress`.
13. **Gate the reveal on real readiness.** Waiting for the first painted frame
    (`sceneReady`) + fonts + assets (not a timer) stops the page showing
    half-rendered.

---

## 5. Tuning quick-reference

| Want to change | Where |
|---|---|
| Jack count / size / spin | `hero/JackPit.tsx` (`count`, `scale`, `attract`, `MAX_A`, damping) |
| Jack shape (tube wall / bore / bevel) | `lib/three/jack.ts` (`arm`, `outerR`, `innerR`, `c`) + palette `JACK_COLORS` |
| Hero gloss / camera / depth | `hero/JackPit.tsx` (material `roughness`/`envMapIntensity`, camera `fov`/`z`, `halfD`) + `hero/HeroEnv.tsx` |
| Mouse-displacement feel | `hero/HeroCanvas.tsx` (vel gain/`max`, `strength` cap) + `lib/three/MouseDisplacementEffect.ts` (`uRadius`) |
| Hero bokeh / colour mix | `hero/HeroCanvas.tsx` `<DepthOfField>` (`focusDistance`/`focalLength`/`bokehScale`) · `hero/JackPit.tsx` `colorBag` weights |
| Astronaut depth / pop (inline `/demo`) | `world/AstronautJourney.tsx` (`START`, `FAR`, `NEAR`, `POP_AT`) |
| CTA take-over timing (inline `/demo`) | `AstronautJourney.tsx` (`cta = smoother((p-0.8)/0.2)`) + `NewWorld.tsx` timeline |
| Landing cinematic depth / pop / fades | `world/CinematicJourney.tsx` (`START/FAR/NEAR/POP_AT`, `gridFade`/`crystalFade`/`starFade`, `cta`) |
| Auto-scroll speed / resume | `world/NewWorldExperience.tsx` (`AUTO_FULL_SEC`, `IDLE_MS`) |
| Progress rail length / look | `NewWorldExperience.tsx` rail div (`12vh`, track/thumb colors) + `onUpdate` (`*76`) |
| Chromatic halo size / ramp / colors | `NewWorldExperience.tsx` halo div (`92vmin`, gradient stops) + `onUpdate` (`progress/0.5`) |
| Cinematic particles (bits/stars/sparkles) | `CinematicJourney.tsx` (`makeDot`, `size`, counts in `GridTunnel`/`Starfield`/`SparkleField`) |
| CTA gems / stickers / LED visor | `CinematicJourney.tsx` (`DiamondCloud`, `StickerCloud`, `makeLEDFace`) |
| Founders letter copy / link | `NewWorldExperience.tsx` modal · page at `app/founders/page.tsx` |
| Preloader timing / ring | `layout/Preloader.tsx` (`MIN_MS`/`SCENE_GRACE_MS`/`MAX_MS`, `PROG_R`/`SPIN_R`) |
| Card tilt strength | `hooks/useTilt.ts` (`max`, `perspective`) |
| Cursor trail length / size | `layout/Cursor.tsx` (blob alpha `0.2`, fade `0.12`, `baseR`) |
| Palette / fonts | `app/globals.css` tokens; `app/layout.tsx` fonts |
| Projects | `lib/data/projects.ts` + `public/videos/*` |
```
