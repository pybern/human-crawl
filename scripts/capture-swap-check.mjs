/**
 * One-off: verify the route swap. Record short clips of `/` (cinematic landing)
 * and `/demo` (marketing site) so we can extract a settled frame each.
 *   node scripts/capture-swap-check.mjs --base=http://localhost:3200
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
const BASE = args.base ?? "http://localhost:3200";
const OUT = path.resolve(args.out ?? "/tmp/swap");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

const b = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--ignore-gpu-blocklist"],
});
mkdirSync(OUT, { recursive: true });

async function clip(route, name) {
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(OUT, name), size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(Number(args.wait) || 24000); // preloader + canvas + post compile
  const finalUrl = page.url();
  await page.close();
  await ctx.close();
  console.log(`${name}: requested ${route} -> ${finalUrl}`);
}

await clip("/", "root");
await clip("/demo", "demo");
await b.close();
console.log("swap check videos ->", OUT);
