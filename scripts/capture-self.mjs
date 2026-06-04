/**
 * capture-self.mjs
 * ---------------------------------------------------------------------------
 * Captures OUR reproduction (running locally) at each key section, desktop and
 * mobile, into docs/self/. Use alongside docs/reference/ to compare against the
 * real site.
 *
 *   1) pnpm dev   (or pnpm build && pnpm start)
 *   2) node scripts/capture-self.mjs [--url=http://localhost:3000]
 *
 * Uses a system Chrome (CHROME_PATH) with SwiftShader so WebGL works headless.
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
const OUT = path.resolve("docs/self");
const CHROME = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";

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

async function scrollTo(page, y) {
  await page.evaluate((yy) => {
    const w = window;
    if (w.lenis) w.lenis.scrollTo(yy, { immediate: true });
    else window.scrollTo(0, yy);
  }, y);
}

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
    await page.waitForTimeout(6000); // preloader + first scene

    const off = await page.evaluate(() => {
      const id = (s) => document.getElementById(s);
      const sections = [...document.querySelectorAll("section")];
      const cine = sections.find((s) => s.offsetHeight > window.innerHeight * 3);
      return {
        vh: window.innerHeight,
        work: id("work")?.offsetTop ?? 0,
        contact: id("contact")?.offsetTop ?? 0,
        footer: id("footer")?.offsetTop ?? 0,
        cineTop: cine?.offsetTop ?? 0,
        cineH: cine?.offsetHeight ?? 0,
      };
    });

    await page.screenshot({ path: `${OUT}/desktop_00_hero.png` });
    await scrollTo(page, off.vh * 1.1);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/desktop_01_brought-to-life.png` });
    await scrollTo(page, off.work - 80);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/desktop_02_featured-work.png` });
    await scrollTo(page, off.cineTop + off.cineH * 0.5);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/desktop_03_new-world.png` });
    await scrollTo(page, off.contact + 200);
    await page.waitForTimeout(1600);
    await page.mouse.move(500, 400);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/desktop_04_lets-work.png` });
    await scrollTo(page, off.footer + 9999);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/desktop_05_footer.png` });
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
    await page.waitForTimeout(6000);
    await page.screenshot({ path: `${OUT}/mobile_00_hero.png` });
    const workTop = await page.evaluate(
      () => document.getElementById("work")?.offsetTop ?? 0
    );
    await scrollTo(page, workTop + 80);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/mobile_01_featured-work.png` });
    await page.close();
  }

  await browser.close();
  console.log(`Self capture complete -> ${OUT}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
