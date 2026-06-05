/**
 * capture-section.mjs — record a short video at a given section of OUR site and
 * leave the webm in the out dir (extract frames with ffmpeg). Screenshotting a
 * live animating section hangs swiftshader, so we record instead.
 *   node scripts/capture-section.mjs --sel=#work --out=/tmp/sec [--frac=1.05] [--wait=14000]
 * --sel: element id selector to scroll to (optional); --frac: scroll = frac*vh.
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
const URL = args.url ?? "http://localhost:3000";
const OUT = path.resolve(args.out ?? "/tmp/sec");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

const b = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox"],
});
mkdirSync(OUT, { recursive: true });
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(5000); // brief: scroll works early (like capture-self)

const y = await page.evaluate(
  ({ sel, frac }) => {
    const vh = window.innerHeight;
    let target = vh * (Number(frac) || 1.05);
    if (sel) {
      const el = document.querySelector(sel);
      if (el) target = el.getBoundingClientRect().top + window.scrollY - 80;
    }
    if (window.lenis) window.lenis.scrollTo(target, { immediate: true });
    window.scrollTo(0, target);
    return target;
  },
  { sel: args.sel, frac: args.frac }
);
console.log("scrolled to", y);
// keep nudging the scroll while everything loads (lenis can reset it on ready)
const settle = Number(args.wait) || 26000;
const step = 1500;
for (let t = 0; t < settle; t += step) {
  await page.waitForTimeout(step);
  await page
    .evaluate((yy) => {
      if (window.lenis) window.lenis.scrollTo(yy, { immediate: true });
      window.scrollTo(0, yy);
    }, y)
    .catch(() => {});
}
await page.close();
await ctx.close();
await b.close();
console.log("section video ->", OUT);
