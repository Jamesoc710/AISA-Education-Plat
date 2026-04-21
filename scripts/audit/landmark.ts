import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/concepts/transformers", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(800);
  const axe = new AxeBuilder({ page });
  const results = await axe.analyze();
  const landmarks = results.violations.filter((v) => v.id.startsWith("landmark"));
  for (const v of landmarks) {
    console.log("RULE:", v.id, "-", v.help);
    for (const n of v.nodes) {
      console.log("  selector:", n.target.join(" "));
      console.log("  html:    ", n.html.slice(0, 200));
      console.log("  summary: ", (n.failureSummary ?? "").slice(0, 300));
      console.log();
    }
  }
  await browser.close();
}
main();
