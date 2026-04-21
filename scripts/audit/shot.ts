import { chromium } from "@playwright/test";

async function main() {
  const url = process.argv[2] || "http://127.0.0.1:3000/concepts/transformers";
  const out = process.argv[3] || "docs/audit-screenshots/flatten-after.png";
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  await page.screenshot({ path: out, fullPage: process.argv.includes("--full") });
  await browser.close();
  console.log(`wrote ${out}`);
}
main();
