import { chromium, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = "http://127.0.0.1:3000";
const ROUTES = [
  "/",
  "/login",
  "/browse",
  "/concepts/transformers",
  "/quiz",
  "/calendar",
  "/home",
  "/dashboard",
  "/admin",
  "/homework",
  "/assessments",
];

async function checkRoute(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const axe = new AxeBuilder({ page });
  const results = await axe.analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    count: v.nodes.length,
    help: v.help,
  }));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    // @ts-ignore
    if (typeof (globalThis as any).__name === "undefined") {
      // @ts-ignore
      (globalThis as any).__name = (fn: any) => fn;
    }
  });
  await context.route("**/*.css*", async (route) => {
    const resp = await route.fetch({
      headers: {
        ...route.request().headers(),
        "cache-control": "no-cache, no-store, must-revalidate",
        pragma: "no-cache",
      },
    });
    route.fulfill({ response: resp, headers: { ...resp.headers(), "cache-control": "no-cache" } });
  });
  const page = await context.newPage();

  let total = 0;
  for (const route of ROUTES) {
    try {
      const v = await checkRoute(page, route);
      total += v.reduce((s, x) => s + x.count, 0);
      const summary = v.map((x) => `${x.id}(${x.count})`).join(",") || "clean";
      console.log(`[${route}] ${summary}`);
    } catch (e: any) {
      console.log(`[${route}] ERROR: ${e.message}`);
    }
  }
  console.log(`\nTOTAL violations: ${total}`);
  await browser.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
