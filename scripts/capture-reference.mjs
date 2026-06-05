/**
 * capture-reference.mjs
 * ---------------------------------------------------------------------------
 * Records the REAL lusion.co experience (frames + video) so we can document
 * the user journey and compare against our reproduction.
 *
 * lusion.co is scroll-jacked (Lenis virtual scroll): window.scrollTo() does
 * NOT advance the page, so we drive the experience with mouse-wheel events.
 * Continuous requestAnimationFrame means `networkidle` never settles and
 * screenshots can hang on animation — so we use waitUntil:'load' + fixed
 * waits and `animations:'disabled'` while capturing.
 *
 * Usage:
 *   node scripts/capture-reference.mjs [--url=https://lusion.co/] [--out=docs/reference]
 *
 * Requirements: a Chromium/Chrome binary + Playwright. In CI/headless we use
 * SwiftShader so WebGL works without a GPU.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const URL = args.url ?? "https://lusion.co/";
const OUT = path.resolve(args.out ?? "docs/reference");
const CHROME =
  process.env.CHROME_PATH ||
  "/usr/local/bin/google-chrome"; // falls back to Playwright's bundled chromium if missing

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];

const launchOpts = {
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
  ],
};

/**
 * Hero-interaction baseline: load the site, leave the pointer in the hero
 * "jack pit" window and sweep it around (figure-8) to scatter the pieces while
 * recording a video + a handful of frames. This documents the *interaction*
 * (cursor smash + self-refill) the journey stills can't show.
 */
async function captureHeroInteraction(browser) {
  const vp = { name: "desktop", width: 1440, height: 900 };
  const dir = path.join(OUT, vp.name);
  mkdirSync(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    recordVideo: { dir, size: { width: vp.width, height: vp.height } },
  });
  const page = await context.newPage();

  console.log(`[hero-interaction] loading ${URL}`);
  await page
    .goto(URL, { waitUntil: "load", timeout: 60000 })
    .catch((e) => console.log("goto:", e.message));
  await page.waitForTimeout(9000); // WebGL warm-up

  // The hero window sits roughly centred under the heading. Sweep a figure-8
  // through the middle band of the viewport to carve + scatter the pile.
  const cx = vp.width / 2;
  const cy = vp.height * 0.55;
  const ax = vp.width * 0.32; // horizontal amplitude
  const ay = vp.height * 0.22; // vertical amplitude

  await page.mouse.move(cx, cy);
  await page.waitForTimeout(400);

  const STEPS = 220;
  let shot = 0;
  for (let i = 0; i <= STEPS; i++) {
    const t = (i / STEPS) * Math.PI * 2 * 2; // two full figure-8 loops
    const x = cx + Math.sin(t) * ax;
    const y = cy + Math.sin(t * 2) * ay; // lemniscate-ish
    await page.mouse.move(x, y, { steps: 2 });
    await page.waitForTimeout(28);
    // grab ~6 frames spread across the sweep (live, animations NOT disabled so
    // the scatter is visible)
    if (i % Math.floor(STEPS / 6) === 0 && shot < 6) {
      const file = path.join(
        dir,
        `hero_interact_${String(shot).padStart(2, "0")}.png`
      );
      await page
        .screenshot({ path: file, timeout: 30000 })
        .then(() => console.log(`  [hero ${shot}] ${file}`))
        .catch((e) => console.log(`  [hero ${shot}] failed: ${e.message}`));
      shot++;
    }
  }
  // let the pile refill, then a final settled frame
  await page.mouse.move(cx - ax, cy, { steps: 1 });
  await page.waitForTimeout(1500);
  await page
    .screenshot({ path: path.join(dir, `hero_interact_06.png`) })
    .catch(() => {});

  await page.close();
  await context.close(); // flush video
  console.log(`[hero-interaction] done -> ${dir}`);
}

async function run() {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: CHROME, ...launchOpts });
  } catch {
    console.warn("google-chrome not found, using bundled chromium");
    browser = await chromium.launch(launchOpts);
  }

  if (args.mode === "hero-interaction") {
    await captureHeroInteraction(browser);
    await browser.close();
    console.log("Hero interaction capture complete.");
    return;
  }

  for (const vp of VIEWPORTS) {
    const dir = path.join(OUT, vp.name);
    mkdirSync(dir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      recordVideo: { dir, size: { width: vp.width, height: vp.height } },
    });
    const page = await context.newPage();

    console.log(`[${vp.name}] loading ${URL}`);
    await page
      .goto(URL, { waitUntil: "load", timeout: 60000 })
      .catch((e) => console.log("goto:", e.message));
    await page.waitForTimeout(9000); // let WebGL warm up

    const steps = vp.isMobile ? 8 : 14;
    for (let i = 0; i < steps; i++) {
      const txt = await page.evaluate(() =>
        document.body.innerText.replace(/\s+/g, " ").slice(0, 200)
      );
      const file = path.join(dir, `frame_${String(i).padStart(2, "0")}.png`);
      try {
        await page.screenshot({ path: file, animations: "disabled", timeout: 60000 });
        console.log(`  [${vp.name} ${i}] ${txt}`);
      } catch (e) {
        console.log(`  [${vp.name} ${i}] screenshot failed: ${e.message}`);
      }
      // advance the scroll-jacked experience with wheel events
      await page.mouse.move(vp.width / 2, vp.height / 2);
      const ticks = vp.isMobile ? 10 : 8;
      for (let k = 0; k < ticks; k++) {
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(2200);
    }

    await page.close();
    await context.close(); // flushes the recorded video
    console.log(`[${vp.name}] done -> ${dir}`);
  }

  await browser.close();
  console.log("Reference capture complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
