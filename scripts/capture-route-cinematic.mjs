/**
 * capture-route-cinematic.mjs — record the /new-world route while sweeping
 * window.cinema.progress 0→1, then extract frames with ffmpeg. Screenshots hang
 * on the live post-processed canvas under swiftshader, so we record instead.
 *   node scripts/capture-route-cinematic.mjs [--url=http://localhost:3000/new-world] [--wait=28000]
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
const URL = args.url ?? "http://localhost:3000/new-world";
const OUT = path.resolve(args.out ?? "/tmp/route");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

const b = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--ignore-gpu-blocklist"],
});
mkdirSync(OUT, { recursive: true });
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(Number(args.wait) || 28000); // preloader + canvas + GLTF + post compile

// Scroll the page top→bottom so ScrollTrigger drives BOTH the 3D progress and
// the DOM text timeline (setting cinema.progress directly fights ScrollTrigger).
const maxY = await page.evaluate(
  () => document.body.scrollHeight - window.innerHeight
);
const N = 60;
for (let i = 0; i <= N; i++) {
  const y = (i / N) * maxY;
  await page
    .evaluate((yy) => {
      if (window.lenis) window.lenis.scrollTo(yy, { immediate: true });
      window.scrollTo(0, yy);
    }, y)
    .catch(() => {});
  await page.waitForTimeout(170);
}
// hold at the very bottom so the CTA fully settles + gets several frames
for (let k = 0; k < 8; k++) {
  await page
    .evaluate((yy) => {
      if (window.lenis) window.lenis.scrollTo(yy, { immediate: true });
      window.scrollTo(0, yy);
    }, maxY)
    .catch(() => {});
  await page.waitForTimeout(450);
}
const dbg = await page.evaluate(() => window.__astroDepth || null).catch(() => null);
console.log("end __astroDepth:", JSON.stringify(dbg));
await page.close();
await ctx.close();
await b.close();
console.log("route cinematic video ->", OUT);
