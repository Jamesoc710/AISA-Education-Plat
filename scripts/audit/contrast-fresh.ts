import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    bypassCSP: true,
  });
  await context.addInitScript(() => {
    // @ts-ignore
    if (typeof (globalThis as any).__name === "undefined") {
      // @ts-ignore
      (globalThis as any).__name = (fn: any) => fn;
    }
  });
  await context.route("**/*.css*", async (route) => {
    const resp = await route.fetch({ headers: { ...route.request().headers(), "cache-control": "no-cache, no-store, must-revalidate", pragma: "no-cache" } });
    route.fulfill({ response: resp, headers: { ...resp.headers(), "cache-control": "no-cache" } });
  });
  const page = await context.newPage();
  const resp = await page.goto("http://127.0.0.1:3000/calendar?_t=" + Date.now(), { waitUntil: "networkidle", timeout: 30000 });
  const bgColor = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>("[data-theme='light']");
    if (!el) return "no light theme root";
    return getComputedStyle(el).getPropertyValue("--color-blue").trim();
  });
  console.log("status", resp?.status(), "computed --color-blue =", bgColor);
  const axe = new AxeBuilder({ page }).withTags(["wcag2aa"]);
  const results = await axe.analyze();
  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  console.log("contrast violations:", contrast.flatMap((v) => v.nodes).length);
  for (const v of contrast) {
    for (const n of v.nodes) {
      console.log(" -", n.target.join(" "));
      console.log("    ", (n.any?.[0]?.message ?? "").slice(0, 160));
    }
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
