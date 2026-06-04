# Scratchpad — Reproduce lusion.co

## Environment / repo facts
- Fresh Next.js **16.2.6** + React **19.2.4** + TS, Tailwind **v4** (`@import "tailwindcss"` in app/globals.css, `@tailwindcss/postcss`).
- App Router. Existing files: app/layout.tsx (root, has html/body, uses next/font Geist), app/page.tsx (boilerplate), app/globals.css.
- pnpm 10.33, node 22. `node_modules` was NOT installed initially — ran `pnpm install` to read bundled docs.
- AGENTS.md: "This is NOT the Next.js you know" → docs live at `node_modules/next/dist/docs/`. Read getting-started: server/client components, layouts, css, images. Key gotchas: params/searchParams are Promises; `'use client'` boundary; Tailwind v4 already wired; React 19 `<link rel=stylesheet>` allowed; AI hint about `unstable_instant` for instant nav (not needed here).
- Tooling available: `/usr/local/bin/google-chrome`, Playwright 1.60 (via npx cache at `/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`), `ffmpeg`. **WebGL renders headless** via `--use-gl=angle --use-angle=swiftshader`.

## Library versions (latest, all React19/three-compatible)
- three 0.184.0
- @react-three/fiber 9.6.1 (R3F v9 supports React 19)
- @react-three/drei 10.7.7
- @react-three/rapier 2.2.0 (physics)
- @react-three/postprocessing 3.0.4
- lenis 1.3.23 (smooth scroll)
- gsap 3.15.0 (ScrollTrigger)

## Reference captures (artifacts)
- /opt/cursor/artifacts/ref_lusion_hero.png — hero
- /opt/cursor/artifacts/ref/d_00..13.png — desktop scroll journey (1440x900)
- /opt/cursor/artifacts/ref/m_0..4.png — mobile journey (390x844)
- IMPORTANT: lusion.co is **scroll-jacked** (Lenis virtual scroll). `window.scrollTo` doesn't work; must drive with `page.mouse.wheel`. `networkidle` never settles (rAF keeps connections) → use `waitUntil:'load'` + fixed wait. Screenshots need `animations:'disabled'` + larger timeout or they hang on continuous rAF.

## REAL SITE — user journey (observed, desktop)
0. **Preloader** (d_00): black screen, glossy white "L" wordmark assembling from rounded glossy panels (the jack motif), numeric counter `…100` bottom-left. Then reveal into hero.
1. **Hero** (ref_lusion_hero): light lavender bg. Header = `LUSION` wordmark (left), `—` (mute), `LET'S TALK •` pill, `MENU ••` pill (right). Big hero heading: "We create 3D visual storytelling and interactive web experiences that help brands stand out". A large **rounded-rect dark window** containing a **physics pile of glossy "jack/cross" shapes** (cobalt blue / white / black / grey, reflective). `SCROLL TO EXPLORE`. Corner `+` frame marks around window. Mouse interacts with the pile.
2. **Bold Ideas, Brought to Life** (d_01): huge kinetic heading slides across; a flowing **blue 3D ribbon/tube** curve; a rounded **WebGL preview window** (data-viz-ish scene); copy "We combine design, motion, 3D, and development…"; `OUR APPROACH` pill. Big kinetic "PLAY REEL" text rising.
3. **Play Reel** (d_02): full-bleed **red** showreel block, phone mockups, central **play button**, kinetic "PLAY / REEL" text, corner `+` marks.
4. **Featured Work** (d_03,d_04): heading + subtitle "A SELECTION OF IMMERSIVE DIGITAL EXPERIENCES…". 2-col **project grid** w/ hover video: Devin AI, Porsche: Dream Machine, Synthetic Human, Meta: Spatial Fusion, Choo Choo World, Soda Experience, Spaace NFT. Tags like `WEB • DESIGN • DEVELOPMENT • 3D`. `SEE ALL PROJECTS` pill.
5. **Step into a new world** (d_05–d_09): scroll-driven cinematic. **Astronaut** GLTF floats; camera dollies through worlds: dark space → glitchy **wireframe grid/data tunnel** (d_07) → green **crystalline cave** (d_09). Strong **chromatic-aberration / lens-flare ring** vignette. Overlaid text "STEP INTO A NEW WORLD AND LET YOUR IMAGINATION RUN WILD" fades grey→white. Section is pinned.
6. **Let's work together** (d_11): dark section. Astronaut w/ **LED smiley helmet**; cloud of floating **physics sticker** assets (skeleton, banana, lollipop, diamonds, smiley, lightning, ice-cream, hearts). Eyebrow "IS YOUR BIG IDEA READY TO GO WILD?", big "Let's work together!", `CONTINUE TO SCROLL`. Corner `+` marks.
7. **Footer** (d_13): light. `LUSION`; address (Suite 2, 9 Marsh Street, Bristol BS1 4AA, UK); socials (Twitter/X, Instagram, Linkedin); General enquiries hello@lusion.co; New business business@lusion.co; **Subscribe to our newsletter** + email input; ©2026 LUSION Creative Studio; R&D: labs.lusion.co; "Built by Lusion with ❤"; scroll-to-top btn. Then dark **"ABOUT US" next-page teaser** ("KEEP SCROLLING TO LEARN MORE", "NEXT PAGE" progress) → route transition.

## REAL SITE — mobile (m_0,m_2)
- Header collapses to `LUSION` + circular `•••` menu button.
- Hero = portrait full-width rounded window with the jack pile (taller).
- Projects become **single column**, each: media + tags + title + `→` arrow.
- Everything stacks vertically; heavy effects reduced.

## Global mechanics
- **Single fullscreen WebGL canvas** behind DOM; 3D mapped to DOM element rects (screen→world) — Lusion's documented approach (their WebGL-Scroll-Sync repo). DOM/flex defines layout.
- **Smooth scroll** (Lenis) synced to rAF.
- **Mouse displacement post-processing** over the WebGL (2D displacement map following cursor) — signature effect (WebGL text is DOM/SEO, not affected).
- Custom **cursor**, **menu overlay**, page transitions.
- Physics via Rapier (hero pit, CTA stickers). Hero pit uses a rounded **stencil mask** window.

## Scope decision
Full faithful clone ≈ 1yr studio effort. Plan = curated reproduction of the **signature journey + effects**, responsive (desktop+mobile), with open-source/placeholder assets (replaceable). Prioritize: preloader, hero jack-pit physics + mouse displacement, kinetic type/scroll, project grid, cinematic astronaut sequence, sticker CTA, footer.

## Open questions for user
1. Scope/fidelity vs. time: build ALL sections at medium fidelity, or fewer sections at high fidelity? (Plan assumes all sections, curated fidelity.)
2. OK to fetch external CC0 assets (astronaut GLTF, sample videos, HDRI) at build/dev time and commit small ones to `public/`? Remote video via next/image remotePatterns OK?
3. Single global canvas + screen→world (more faithful) vs drei `<View>` per-section (simpler). Plan recommends global canvas; fallback to View.
4. Deploy as static export or standard Next server? (affects next/image + remote assets)
