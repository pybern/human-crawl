# PLAN — Reproduce lusion.co (Next.js 16 + R3F)

## 0. Locked decisions (user-approved)
- **All recommended defaults:** all 8 sections at curated fidelity; **single global canvas +
  screen→world** rendering; **standard Next server**; fetch & use **CC0/royalty-free assets**.
- **Scaffolding:** keep the **existing `create-next-app` scaffold** (Next **16.2.6** — flagged as a
  special/breaking version by AGENTS.md). Do **not** re-run create-next-app or downgrade/replace
  Next; extend the current scaffold in place.
- **Artifacts kept in repo:** commit the reference media + docs into the repo:
  - `docs/USER_JOURNEY.md` (the written breakdown)
  - `docs/reference/` (captured frames of the real site; representative subset, optimized) and a
    reference video/montage
  - `docs/PLAN.md` and `docs/scratchpad.md` (copies of the planning artifacts)
  - `public/reference/` only if any reference media must be served by the app.

## 1. Executive summary

Goal: reproduce the **lusion.co (v3)** experience — an immersive, scroll-driven WebGL site —
inside the existing Next.js 16 / React 19 / Tailwind v4 project, working on **desktop and mobile**,
using **open-source / placeholder assets** that are easy to swap later.

Two deliverables:

- **D1 — Reference documentation.** Recorded frames + video of the *real* site and a written,
  section-by-section breakdown of the user journey, interactions, animations and timing
  (`docs/USER_JOURNEY.md` + media in `/opt/cursor/artifacts/ref/`). Partially captured already.
- **D2 — The reproduction.** A Next.js app that recreates the signature journey: preloader →
  hero "jack pit" physics → kinetic "Brought to Life" → play reel → featured work grid →
  cinematic astronaut "new world" sequence → sticker CTA → footer/about-teaser, with the
  signature **mouse-displacement post-processing**, **smooth scroll**, **custom cursor**, and
  **menu overlay** — all responsive with graceful degradation.

Faithful 1:1 is a ~1-year studio effort; this plan targets a **curated, high-impact reproduction**
of the full journey and the signature effects, structured so individual sections/assets can be
upgraded incrementally.

### Tech stack (verified available, all React-19 compatible)
| Concern | Choice | Version |
|---|---|---|
| Framework | next (App Router) | 16.2.6 (installed) |
| UI | react / react-dom | 19.2.4 (installed) |
| Styling | tailwindcss v4 | 4.x (installed) |
| 3D | three | 0.184 |
| 3D React | @react-three/fiber | 9.6 |
| 3D helpers | @react-three/drei | 10.7 |
| Physics | @react-three/rapier | 2.2 |
| Post FX | @react-three/postprocessing | 3.0 |
| Smooth scroll | lenis | 1.3 |
| Timelines | gsap (+ ScrollTrigger) | 3.15 |
| Shared state | zustand | latest |
| Reference capture (dev) | playwright | 1.x (devDep) |

### Architecture (the "Lusion approach")
- **One persistent fullscreen `<Canvas>`** fixed behind the DOM, mounted via `next/dynamic({ssr:false})`.
- **DOM/flex defines layout.** Each WebGL feature is anchored to a DOM element; we map the
  element's `getBoundingClientRect()` → world coordinates each frame (screen→world helper) so 3D
  objects line up with HTML "windows" responsively. (drei `<View>` is the fallback if a single
  global scene proves unwieldy.)
- **Lenis** drives smooth scroll; a single rAF loop updates Lenis, GSAP ScrollTrigger, and R3F.
- **Global EffectComposer**: mouse-displacement pass (signature) + subtle chromatic aberration +
  bloom; gated by device capability.
- **zustand store** shares scroll progress, pointer, loaded%, mobile flag, reduced-motion flag.

> Per AGENTS.md, before writing any feature I will re-read the relevant file in
> `node_modules/next/dist/docs/` (esp. server-vs-client, images, fonts, metadata). Already read:
> getting-started server/client, layouts, css, images.

---

## 2. Target file/folder structure

```
app/
  layout.tsx            # root: html/body, fonts, metadata, mounts providers + CanvasRoot + Preloader
  page.tsx              # home: composes all sections (server comp shell -> client sections)
  about/page.tsx        # minimal target for footer "ABOUT US" page transition
  globals.css           # Tailwind + CSS vars, theme tokens, base resets, cursor hide
  template.tsx          # route transition wrapper (GSAP/Framer)
components/
  providers/
    AppProviders.tsx    # 'use client' — Lenis + store hydration + reduced-motion + cursor
  canvas/
    CanvasRoot.tsx      # 'use client' dynamic(ssr:false) wrapper
    SceneCanvas.tsx     # <Canvas> + lights + env + scene controller + Effects
    Effects.tsx         # postprocessing (displacement/chromatic/bloom), capability-gated
    rafDriver.ts        # single rAF: lenis.raf -> ScrollTrigger.update
    screenToWorld.ts    # DOM rect -> world coords helper
  layout/
    Header.tsx          # LUSION wordmark, LET'S TALK, MENU
    MenuOverlay.tsx     # fullscreen nav (HOME/ABOUT US/PROJECTS/CONTACT/LABS + newsletter)
    Cursor.tsx          # custom cursor (desktop, pointer:fine only)
    CornerMarks.tsx     # the "+" framing marks
    Preloader.tsx       # counter 0->100 (useProgress) + animated "L" + reveal
  sections/
    Hero.tsx            # copy + window anchor; JackPit lives in canvas
    hero/JackPit.tsx    # Rapier physics pile + stencil rounded window + pointer force
    hero/Jack.tsx       # procedural glossy jack/cross mesh
    BroughtToLife.tsx   # kinetic heading + ribbon anchor + preview window + OUR APPROACH
    visuals/Ribbon.tsx  # TubeGeometry flowing curve
    PlayReel.tsx        # red showreel, kinetic PLAY REEL text, play button, video
    FeaturedWork.tsx    # grid + heading
    work/ProjectCard.tsx# media + tags + title + hover video
    NewWorld.tsx        # pinned cinematic; astronaut anchor + text overlays
    world/AstronautJourney.tsx # GLTF astronaut + 3 world environments + camera dolly
    LetsWork.tsx        # dark CTA + sticker anchor + kinetic text
    work/StickerField.tsx # Rapier floating sticker billboards
    Footer.tsx          # contact/newsletter/socials/credits + ABOUT US teaser
lib/
  store.ts              # zustand
  data/projects.ts      # project list (title, tags, media)
  three/materials.ts    # shared glossy material factory
  three/env.ts          # environment config
hooks/
  useIsMobile.ts  useMousePosition.ts  useReducedMotion.ts  useSectionRect.ts
scripts/
  capture-reference.mjs # Playwright: record real lusion.co frames + video
  capture-self.mjs      # Playwright: record OUR site for side-by-side
docs/
  USER_JOURNEY.md       # the written breakdown (D1)
public/
  models/ astronaut.glb (+draco)   videos/*.mp4   textures/ hdri, stickers, env
```

---

## 3. Phased tasks (each with acceptance criteria)

### Phase 0 — Reference capture & journey doc (D1)
- **0.1** Add `scripts/capture-reference.mjs` (Playwright, google-chrome, swiftshader; wheel-driven
  scrolling; `animations:'disabled'`). Capture desktop (1440×900) + mobile (390×844) frames AND a
  webm/mp4 video (Playwright `recordVideo`), output to `public/reference/` and/or artifacts.
  Assemble a frame montage with `ffmpeg`.
- **0.2** Write `docs/USER_JOURNEY.md`: for each of the 8 sections — visual description, layout,
  copy, interactions, animation/timing, mobile differences, and which effect/tech reproduces it.
  Embed the captured frames.
- **AC:** `docs/USER_JOURNEY.md` exists with all 8 sections + embedded reference frames; capture
  script runs and produces frames + at least one video file. (Frames already captured in
  `/opt/cursor/artifacts/ref/` and will be reused/committed.)

### Phase 1 — Foundation & global chrome
- **1.1** Add deps: `pnpm add three @react-three/fiber @react-three/drei @react-three/rapier
  @react-three/postprocessing lenis gsap zustand` and `pnpm add -D @types/three playwright`.
  If three/drei break the build, add `transpilePackages: ['three']` to `next.config.ts`.
- **1.2** `app/globals.css`: replace boilerplate with design tokens — colors (lavender `#e9e7ff`-ish
  bg, cobalt `#1a25ff`, near-black, off-white), font vars, base resets, hide native cursor on
  `pointer:fine`, `html{scroll-behavior:auto}` (Lenis controls), reduced-motion media query.
- **1.3** `app/layout.tsx`: keep server component; set real `metadata` (title "LUSION — clone",
  description, OG); load fonts via `next/font/google` (headings: **Space Grotesk**; body: **Inter
  Tight**; mono for tags). Render `<AppProviders>`, `<CanvasRoot/>`, `<Preloader/>`, `<Header/>`,
  `<Cursor/>`, `<CornerMarks/>`, `{children}`.
- **1.4** `components/providers/AppProviders.tsx` ('use client'): init Lenis, single rAF driver
  (`lenis.raf` + `ScrollTrigger.update`), hydrate zustand (mobile/reduced-motion), pointer tracking.
- **1.5** `components/canvas/CanvasRoot.tsx`: `dynamic(() => import('./SceneCanvas'), {ssr:false})`,
  fixed full-viewport, `pointer-events-none` except interactive sections, capability detection
  (WebGL present? DPR cap? mobile?). Fallback: render nothing / static gradient if no WebGL.
- **1.6** `Header.tsx` + `MenuOverlay.tsx` + `Cursor.tsx` + `CornerMarks.tsx`.
- **AC:** `pnpm build` passes; site renders header + custom cursor + smooth scroll; empty fixed
  canvas mounts client-only (no SSR window errors); mobile shows hamburger; no WebGL → graceful.

### Phase 2 — Preloader + Hero "jack pit" + signature displacement
- **2.1** `hero/Jack.tsx`: procedural jack/cross mesh (3 orthogonal rounded cylinders/capsules)
  with glossy `MeshStandardMaterial` (metalness/roughness) + `<Environment>` reflections
  (drei preset first; optionally a small CC0 HDRI later). Color variants: cobalt/white/black/grey.
- **2.2** `hero/JackPit.tsx`: Rapier `<Physics>` with ~20–40 jack rigid bodies falling/settling in
  an invisible rounded box; pointer-following repulsion collider (impulse amplification like the
  ref). Rounded-rect **stencil mask** so the pit appears inside the hero window only. Reduce body
  count + simplify on mobile.
- **2.3** Anchor JackPit to the Hero window via `screenToWorld` so it tracks the DOM rect.
- **2.4** `Hero.tsx`: header copy, window container, SCROLL TO EXPLORE, corner marks.
- **2.5** `Effects.tsx`: mouse-displacement fullscreen pass (custom shader: radial displacement of
  the rendered frame around pointer, eased) + light chromatic aberration + subtle bloom. Gate off
  on mobile/low-power/reduced-motion.
- **2.6** `Preloader.tsx`: black overlay, numeric counter via drei `useProgress`, animated glossy
  "L" mark; GSAP reveal (wipe up) into hero once loaded.
- **AC:** Hero shows interactive glossy jack pile reacting to pointer/touch inside a rounded window;
  displacement effect visibly distorts WebGL around the cursor on desktop; preloader counts to 100
  then reveals; mobile shows simplified pit + no heavy post.

### Phase 3 — "Brought to Life" + Ribbon + Play Reel
- **3.1** `BroughtToLife.tsx`: large kinetic heading animated on scroll (GSAP SplitText-like via
  manual char spans + ScrollTrigger), copy block, `OUR APPROACH` pill.
- **3.2** `visuals/Ribbon.tsx`: flowing cobalt `TubeGeometry` along a CatmullRom curve, slow
  rotation / scroll-linked progress; anchored near the section.
- **3.3** `PlayReel.tsx`: full-bleed cobalt/red block, looping CC0 video, big kinetic "PLAY REEL"
  type, central play button (opens a modal/inline play), corner marks. Pause when offscreen.
- **AC:** heading animates in on scroll; ribbon renders & moves; reel video plays/pauses on
  view/click; responsive stacking on mobile.

### Phase 4 — Featured Work grid
- **4.1** `lib/data/projects.ts`: 6–8 projects (title, tags, poster image, hover video) using CC0
  placeholders.
- **4.2** `work/ProjectCard.tsx`: poster (next/image), tags row, title; on hover (desktop) crossfade
  to muted looping video; on mobile show poster + arrow, tap → detail (or no-op link).
- **4.3** `FeaturedWork.tsx`: heading + subtitle + 2-col grid (1-col mobile) + SEE ALL PROJECTS pill.
- **AC:** grid matches reference layout desktop/mobile; hover video works desktop; images optimized;
  Lighthouse-friendly lazy loading.

### Phase 5 — Cinematic "Step into a new world"
- **5.1** Fetch a **CC0/royalty-free astronaut GLTF** (Khronos sample / Poly Haven / CC0 source);
  Draco-compress into `public/models/astronaut.glb`. Fallback: a stylized capsule "figure" if no
  suitable model. Document source + license.
- **5.2** `world/AstronautJourney.tsx`: load model (drei `useGLTF`+Draco), 3 procedural "worlds":
  (a) dark space + particles, (b) wireframe grid/data tunnel (instanced lines/boxes), (c)
  crystalline structure (instanced shards w/ emissive). Camera dolly + astronaut float linked to
  scroll progress.
- **5.3** `NewWorld.tsx`: GSAP ScrollTrigger **pinned** section; text overlays
  ("STEP INTO A NEW WORLD…") fade grey→white at the right scroll offsets; strong chromatic/lens
  ring vignette while active.
- **AC:** scrolling through the pinned section dollies the astronaut through 3 distinct worlds with
  text transitions; runs at acceptable FPS; mobile uses shortened/simplified sequence.

### Phase 6 — CTA "Let's work together" + Footer + About teaser
- **6.1** `work/StickerField.tsx`: floating sticker billboards (Rapier, gentle gravity/float; CC0 or
  simple generated sticker PNGs: skeleton, banana, diamond, smiley, lightning, heart…). Astronaut
  (reuse model) with emissive "smiley" helmet plane.
- **6.2** `LetsWork.tsx`: dark section, eyebrow + big "Let's work together!", CONTINUE TO SCROLL.
- **6.3** `Footer.tsx`: address, socials, newsletter input (client-only, fake submit), credits,
  scroll-to-top; dark **ABOUT US** next-page teaser linking `/about` with `template.tsx` transition.
- **6.4** `app/about/page.tsx`: minimal about page (transition target).
- **AC:** CTA shows floating stickers + astronaut + kinetic text; footer matches reference; ABOUT US
  click runs a page transition to /about.

### Phase 7 — Responsive, performance, accessibility, fallbacks
- **7.1** Mobile: cap DPR (≤1.5), reduce Rapier bodies/particles, disable displacement/bloom,
  shorten cinematic, touch handlers for hero/CTA. `useIsMobile`.
- **7.2** Perf: only render/update visible WebGL (IntersectionObserver gating + frameloop "demand"
  where possible); pause videos offscreen; lazy-load model; Draco; KTX2 optional.
- **7.3** A11y: `prefers-reduced-motion` disables Lenis smoothing + non-essential motion; keyboard
  focus for menu/links; alt text; WebGL is decorative (DOM text remains real for SEO).
- **7.4** No-WebGL fallback: static gradient/poster versions of hero & cinematic.
- **AC:** usable on a 390px viewport and desktop; no console errors; reduced-motion respected;
  no-WebGL path renders content.

### Phase 8 — Self-capture, QA, build, ship
- **8.1** `scripts/capture-self.mjs`: run `next dev`/`next start`, Playwright-capture our site
  desktop+mobile; build a side-by-side comparison sheet vs reference (ffmpeg/montage) into artifacts.
- **8.2** `pnpm lint` + `pnpm build` clean. Manual pass of every interaction.
- **8.3** Update `README.md` (run instructions, asset sources/licenses, scope notes).
- **8.4** Commit in logical chunks; open a draft PR with walkthrough + embedded comparison media.
- **AC:** build+lint green; comparison artifact produced; PR opened.

---

## 4. Assets (open-source / placeholder, replaceable)
- **Jacks / ribbon / worlds:** procedural (no external asset).
- **Environment reflections:** drei `<Environment preset=...>` (built-in) → optional small CC0 HDRI
  (Poly Haven) later.
- **Astronaut:** CC0/royalty-free GLTF (documented source + license), Draco-compressed.
- **Videos (reel + project hovers):** small CC0/royalty-free clips (Pexels/Coverr/Mixkit) in
  `public/videos/` (or remote via `next.config` `images.remotePatterns` for posters).
- **Project posters:** CC0 images or generated gradients.
- **Stickers:** CC0 sticker pack or simple generated PNGs.
- **Fonts:** `next/font/google` — Space Grotesk (display), Inter Tight (body), a mono for tags
  (near-match to Lusion's neue-grotesk; swap for licensed font later).
- All third-party assets get an entry in `README.md` with source + license; kept small for easy swap.

## 5. Testing strategy
- **Build/lint:** `pnpm build` (Next 16 prod build is the real gate) + `pnpm lint` after each phase.
- **Automated visual:** Playwright (`capture-self.mjs`) screenshots each section desktop+mobile;
  compare to reference frames; commit comparison montage to artifacts.
- **Manual interaction checklist:** preloader→reveal; hero pointer/touch physics; displacement
  follows cursor; scroll smoothness; kinetic headings; reel play/pause; project hover video; pinned
  cinematic through 3 worlds; sticker CTA; newsletter input; menu overlay open/close; ABOUT US
  transition; scroll-to-top.
- **Responsive:** verify at 390/768/1024/1440 widths.
- **Perf sanity:** watch FPS in the cinematic + hero on desktop and a throttled/mobile viewport;
  confirm offscreen pausing.
- **Degradation:** test reduced-motion and a no-WebGL stub path.

## 6. Risks & mitigations
- **Scope (huge).** → Curated fidelity; each section independent & upgradable; ship iteratively.
- **three/Next 16 build issues.** → `transpilePackages:['three']`; client-only canvas via
  dynamic ssr:false; re-read Next 16 docs before each feature.
- **Global displacement post + multi-scene.** → Start single global scene (screen→world); if it
  fights with React/state, fall back to drei `<View>` and scope displacement to hero.
- **Mobile perf.** → DPR cap, fewer bodies, disabled post, demand frameloop, offscreen gating.
- **Asset licensing.** → CC0/royalty-free only, documented; placeholders trivially swappable.
- **Headless capture flakiness.** → wheel-driven scroll + `animations:'disabled'` + load+wait
  (already validated).

## 7. Out of scope (v1)
- Pixel-perfect 1:1 match, full project sub-pages, CMS, audio, the exact proprietary GLTF/Redshift
  baked scenes, multilanguage, analytics. (Structured so these can be added later.)

---

## Open questions (please confirm before execution)
1. **Scope:** all 8 sections at curated fidelity (recommended) vs fewer sections at higher fidelity?
2. **Assets:** OK to fetch CC0 assets (astronaut GLTF, sample videos, HDRI) and commit small ones to
   `public/`? Remote posters via `images.remotePatterns` acceptable?
3. **Rendering approach:** single global canvas + screen→world (more faithful, recommended) vs drei
   `<View>` per section (simpler)?
4. **Deploy target:** standard Next server (enables next/image optimization + remote assets) vs
   static export?
