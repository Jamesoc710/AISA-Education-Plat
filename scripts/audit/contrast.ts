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
  const resp = await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(800);
  const status = resp?.status() ?? null;
  const finalUrl = page.url().replace(BASE, "");

  const axe = new AxeBuilder({ page }).withTags(["wcag2aa"]);
  const results = await axe.analyze();

  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  const landmark = results.violations.filter((v) => v.id.startsWith("landmark"));

  const contrastNodes = contrast.flatMap((v) =>
    v.nodes.map((n) => ({
      selector: n.target.join(" "),
      summary: n.any?.[0]?.message ?? n.failureSummary ?? "",
      html: n.html.slice(0, 120),
    })),
  );
  const landmarkNodes = landmark.flatMap((v) =>
    v.nodes.map((n) => ({
      id: v.id,
      selector: n.target.join(" "),
      html: n.html.slice(0, 120),
    })),
  );

  return {
    path,
    status,
    finalUrl,
    contrastCount: contrastNodes.length,
    landmarkCount: landmarkNodes.length,
    contrastNodes,
    landmarkNodes,
  };
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

  let totalContrast = 0;
  let totalLandmark = 0;
  for (const route of ROUTES) {
    try {
      const r = await checkRoute(page, route);
      totalContrast += r.contrastCount;
      totalLandmark += r.landmarkCount;
      console.log(
        `[${route}] status=${r.status} final=${r.finalUrl} contrast=${r.contrastCount} landmark=${r.landmarkCount}`,
      );
      for (const n of r.contrastNodes) {
        console.log(`  contrast: ${n.selector}`);
        console.log(`    html: ${n.html}`);
        console.log(`    ${n.summary.slice(0, 200)}`);
      }
      for (const n of r.landmarkNodes) {
        console.log(`  ${n.id}: ${n.selector}`);
      }
    } catch (e: any) {
      console.log(`[${route}] ERROR: ${e.message}`);
    }
  }
  console.log(`\nTOTAL: contrast=${totalContrast} landmark=${totalLandmark}`);
  await browser.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
