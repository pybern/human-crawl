/**
 * perf.mjs — measure render frame times of the root-page cinematic at fixed
 * scroll positions (intro / grid / cave / cta). SwiftShader renders on the
 * CPU, so GPU-side fragment/bandwidth cost shows up directly in frame time —
 * a rough but comparable A/B proxy.
 */
import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:3000/";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";
const FRAMES = 70;

const b = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--ignore-gpu-blocklist"],
});
const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(24000); // preloader + GLTF + shader compile

// stop auto-scroll so each sample holds a fixed progress
await page.evaluate(() => window.lenis && window.lenis.stop());

const spots = [0.12, 0.55, 0.95];
const out = [];
for (const p of spots) {
  await page.evaluate((pp) => {
    const maxY = document.body.scrollHeight - window.innerHeight;
    window.scrollTo(0, pp * maxY);
  }, p);
  await page.waitForTimeout(1500); // settle + fade-ins
  const stats = await page.evaluate(
    (N) =>
      new Promise((res) => {
        const deltas = [];
        let last = performance.now();
        let n = 0;
        const tick = (t) => {
          deltas.push(t - last);
          last = t;
          if (++n < N) requestAnimationFrame(tick);
          else {
            deltas.splice(0, 10); // warmup
            const avg = deltas.reduce((a, c) => a + c, 0) / deltas.length;
            const sorted = [...deltas].sort((a, c) => a - c);
            res({ avg, p95: sorted[Math.floor(sorted.length * 0.95)] });
          }
        };
        requestAnimationFrame(tick);
      }),
    FRAMES
  );
  const prog = await page.evaluate(() => window.cinema?.progress ?? -1);
  out.push({ p: prog, ...stats });
  console.log(`progress=${prog.toFixed(2)}  avg=${stats.avg.toFixed(1)}ms  p95=${stats.p95.toFixed(1)}ms`);
}
const total = out.reduce((a, s) => a + s.avg, 0) / out.length;
console.log(`MEAN_AVG_MS=${total.toFixed(1)}`);
await b.close();
