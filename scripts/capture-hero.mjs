/**
 * capture-hero.mjs — quick hero-only capture of OUR site for iteration.
 * Captures a settled frame, then sweeps the pointer across the window to show
 * the physics smash, then a refilled frame. Desktop + mobile.
 *   node scripts/capture-hero.mjs [--url=http://localhost:3000] [--out=docs/self]
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
const OUT = path.resolve(args.out ?? "docs/self");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";
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

  // ---- Desktop ----
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(12000); // preloader reveal + shader compile + settle
    const shot = (name) =>
      page
        .screenshot({ path: `${OUT}/${name}.png`, timeout: 15000 })
        .then(() => console.log(`  ${name} ok`))
        .catch((e) => console.log(`  ${name} FAILED: ${e.message}`));

    await shot("hero_settled");

    // The smash/refill shots stress swiftshader (screenshotting during heavy
    // animation is slow), so they're opt-in via --full.
    if (args.full) {
      const cx = 720,
        cy = 560,
        ax = 430,
        ay = 230;
      for (let i = 0; i <= 80; i++) {
        const t = (i / 80) * Math.PI * 2 * 2;
        await page.mouse.move(cx + Math.sin(t) * ax, cy + Math.sin(t * 2) * ay, {
          steps: 1,
        });
        await page.waitForTimeout(14);
      }
      await page.mouse.move(cx + 380, cy - 120);
      await page.waitForTimeout(150);
      await shot("hero_smash");
      await page.mouse.move(60, 60);
      await page.waitForTimeout(1800);
      await shot("hero_refill");
    }
    await page.close();
  }

  // ---- Mobile ----
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(7000);
    await page
      .screenshot({ path: `${OUT}/hero_mobile.png`, timeout: 15000 })
      .catch((e) => console.log(`  mobile FAILED: ${e.message}`));
    await page.close();
  }

  await browser.close();
  console.log(`hero capture -> ${OUT}`);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
