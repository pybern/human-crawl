/**
 * validate-cinematic.mjs
 * ---------------------------------------------------------------------------
 * Validation loop for the "Step into a new world" astronaut cinematic.
 *
 * It mounts the cinematic, then loops through scroll progress 0 -> 1, driving
 * `window.cinema.progress` directly and reading `window.__astroDepth.sizePx`
 * (the astronaut's apparent on-screen height in px). It asserts the astronaut
 * actually changes depth as you scroll (it should dolly toward/away from the
 * lens), i.e. the on-screen size sweeps by a meaningful ratio.
 *
 *   1) pnpm dev
 *   2) node scripts/validate-cinematic.mjs
 *
 * Exit code 0 = PASS, 1 = FAIL. Also writes frames + a montage to
 * docs/self/cinematic/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const URL = process.env.URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
const OUT = path.resolve("docs/self/cinematic");
const SAMPLES = 13;
const MIN_RATIO = 1.8; // required max/min apparent-size ratio (proves depth)

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

async function run() {
  mkdirSync(OUT, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ executablePath: CHROME, ...launchOpts });
  } catch {
    browser = await chromium.launch(launchOpts);
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);

  // Scroll into the cinematic so LazyView mounts it, then we drive progress
  // directly (no further scrolling, so ScrollTrigger won't override it).
  const cineTop = await page.evaluate(() => {
    const cine = [...document.querySelectorAll("section")].find(
      (s) => s.offsetHeight > window.innerHeight * 3
    );
    if (cine && window.lenis)
      window.lenis.scrollTo(cine.offsetTop + window.innerHeight, {
        immediate: true,
      });
    return cine ? cine.offsetTop : -1;
  });
  await page.waitForTimeout(2500); // let the scene mount + warm up

  const samples = [];
  for (let i = 0; i < SAMPLES; i++) {
    const p = i / (SAMPLES - 1);
    await page.evaluate((pp) => {
      const w = window;
      if (w.cinema) w.cinema.progress = pp;
    }, p);
    await page.waitForTimeout(450);
    const depth = await page.evaluate(() => window.__astroDepth || null);
    if (depth) samples.push(depth);
    await page.screenshot({
      path: `${OUT}/p_${String(i).padStart(2, "0")}.png`,
    });
  }

  await browser.close();

  if (samples.length < SAMPLES) {
    console.error(
      `FAIL: only ${samples.length}/${SAMPLES} depth readings (cinematic mounted? cineTop=${cineTop})`
    );
    process.exit(1);
  }

  const sizes = samples.map((s) => s.sizePx);
  const dists = samples.map((s) => s.dist);
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  const ratio = max / Math.max(min, 0.0001);
  // also require the distance to actually vary (depth, not just FOV jitter)
  const distSpread = Math.max(...dists) - Math.min(...dists);

  // Shape checks for the requested behaviour:
  //   recede (get smaller) through the scroll, then POP forward at the end.
  const startSize = sizes[0];
  const lastSize = sizes[sizes.length - 1];
  const minIdx = sizes.indexOf(min);
  const minP = samples[minIdx].p;
  const recedes = min < startSize * 0.7; // it shrinks well below the start size
  const deepLate = minP >= 0.5; // deepest point is in the latter half
  const popsForward = lastSize > min * 1.8 && lastSize >= 0.7 * max; // big at end

  console.log("progress -> apparent size(px) / distance(world)");
  samples.forEach((s) =>
    console.log(
      `  p=${s.p.toFixed(2)}  size=${s.sizePx.toFixed(1)}px  dist=${s.dist.toFixed(1)}`
    )
  );
  console.log(
    `\nsize ratio max/min = ${ratio.toFixed(2)} (need >= ${MIN_RATIO}); distance spread = ${distSpread.toFixed(1)}`
  );
  console.log(
    `recede(min<0.7*start)=${recedes}  deepest@p=${minP.toFixed(2)}(>=0.5? ${deepLate})  popForward(end big)=${popsForward}`
  );

  const pass =
    ratio >= MIN_RATIO && distSpread > 6 && recedes && deepLate && popsForward;
  console.log(
    pass
      ? "\nPASS ✅ astronaut recedes into depth then pops forward at the end"
      : "\nFAIL ❌ depth shape not as expected (recede -> pop)"
  );
  process.exit(pass ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
