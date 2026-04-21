import { chromium, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = "http://127.0.0.1:3000";
const OUT_DIR = "docs/audit-screenshots";

const ROUTES = [
  { name: "root", path: "/" },
  { name: "login", path: "/login" },
  { name: "browse", path: "/browse" },
  { name: "concept-detail", path: "/concepts/transformers" },
  { name: "quiz", path: "/quiz" },
  { name: "calendar", path: "/calendar" },
  { name: "home", path: "/home" },
  { name: "dashboard", path: "/dashboard" },
  { name: "admin", path: "/admin" },
  { name: "homework", path: "/homework" },
  { name: "assessments", path: "/assessments" },
];

const BREAKPOINTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

type Findings = {
  route: string;
  path: string;
  finalUrl: string;
  status: number | null;
  breakpoint: string;
  screenshot: string;
  uniqueRadii: Array<{ value: string; count: number }>;
  uniqueFonts: string[];
  uniqueFontSizes: Array<{ value: string; count: number }>;
  uniqueFontWeights: Array<{ value: string; count: number }>;
  uniqueShadows: Array<{ value: string; count: number }>;
  gradients: Array<{ value: string; count: number }>;
  roundedFullCount: number;
  cardPatternCount: number;
  cardNestingCount: number;
  axeViolations: Array<{
    id: string;
    impact: string;
    help: string;
    nodes: number;
    selectors: string[];
  }>;
  focusStates: Array<{
    tag: string;
    text: string;
    hasVisibleRing: boolean;
    outlineColor: string;
    outlineWidth: string;
    outlineStyle: string;
    boxShadow: string;
  }>;
  hoverDifferentiation: {
    totalInteractive: number;
    sampledHovers: Array<{
      tag: string;
      text: string;
      transform: string;
      shadow: string;
      background: string;
    }>;
    uniqueHoverSignatures: number;
  };
  contrastIssues: Array<{
    text: string;
    fg: string;
    bg: string;
    fontSize: string;
    ratio: number;
  }>;
};

async function extractComputed(page: Page) {
  return await page.evaluate(() => {
    const radii: Record<string, number> = {};
    const fonts: Record<string, number> = {};
    const fontSizes: Record<string, number> = {};
    const fontWeights: Record<string, number> = {};
    const shadows: Record<string, number> = {};
    const gradients: Record<string, number> = {};
    let roundedFullCount = 0;
    let cardPatternCount = 0;
    let cardNestingCount = 0;

    const all = document.querySelectorAll("*");
    const cardEls = new Set<Element>();

    all.forEach((el) => {
      const s = window.getComputedStyle(el);
      const brRaw = s.borderTopLeftRadius;
      if (brRaw && brRaw !== "0px") {
        radii[brRaw] = (radii[brRaw] || 0) + 1;
      }
      if (s.fontFamily) fonts[s.fontFamily] = (fonts[s.fontFamily] || 0) + 1;
      if (s.fontSize) fontSizes[s.fontSize] = (fontSizes[s.fontSize] || 0) + 1;
      if (s.fontWeight) fontWeights[s.fontWeight] = (fontWeights[s.fontWeight] || 0) + 1;
      if (s.boxShadow && s.boxShadow !== "none") {
        shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
      }
      if (s.backgroundImage && s.backgroundImage.includes("gradient")) {
        gradients[s.backgroundImage] = (gradients[s.backgroundImage] || 0) + 1;
      }

      const brNum = parseFloat(brRaw);
      if (brRaw === "50%" || brNum >= 9999) roundedFullCount++;

      const borderPx = parseFloat(s.borderTopWidth);
      const padTop = parseFloat(s.paddingTop);
      if (borderPx > 0 && brNum >= 6 && padTop >= 12) {
        cardPatternCount++;
        cardEls.add(el);
      }
    });

    cardEls.forEach((el) => {
      let p: Element | null = el.parentElement;
      while (p) {
        if (cardEls.has(p)) {
          cardNestingCount++;
          break;
        }
        p = p.parentElement;
      }
    });

    const toArr = (r: Record<string, number>) =>
      Object.entries(r)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    return {
      uniqueRadii: toArr(radii),
      uniqueFonts: Object.keys(fonts).sort(),
      uniqueFontSizes: toArr(fontSizes),
      uniqueFontWeights: toArr(fontWeights),
      uniqueShadows: toArr(shadows),
      gradients: toArr(gradients),
      roundedFullCount,
      cardPatternCount,
      cardNestingCount,
    };
  });
}

async function captureFocusStates(page: Page) {
  const focusStates: Findings["focusStates"] = [];
  await page.evaluate(() => document.body.focus());

  let lastSig = "";
  let repeats = 0;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) return null;
      const s = window.getComputedStyle(active);
      const tag = active.tagName.toLowerCase();
      const text = (active.textContent || "").trim().slice(0, 50);
      const outlineWidth = s.outlineWidth;
      const outlineColor = s.outlineColor;
      const outlineStyle = s.outlineStyle;
      const boxShadow = s.boxShadow;
      const hasVisibleRing =
        (outlineStyle !== "none" && parseFloat(outlineWidth) >= 1) ||
        (boxShadow !== "none" && /\d+px/.test(boxShadow));
      return {
        tag,
        text,
        hasVisibleRing,
        outlineColor,
        outlineWidth,
        outlineStyle,
        boxShadow,
      };
    });
    if (!info) continue;
    const sig = info.tag + info.text;
    if (sig === lastSig) {
      repeats++;
      if (repeats > 2) break;
    } else {
      repeats = 0;
    }
    lastSig = sig;
    focusStates.push(info);
  }
  return focusStates;
}

async function hoverSample(page: Page) {
  const handles = await page.$$('button, a[href], [role="button"]');
  const totalInteractive = handles.length;
  const sampled: Findings["hoverDifferentiation"]["sampledHovers"] = [];
  const pickN = Math.min(totalInteractive, 12);
  for (let i = 0; i < pickN; i++) {
    const h = handles[i];
    try {
      const visible = await h.isVisible();
      if (!visible) continue;
      await h.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
      await h.hover({ timeout: 1500, force: true });
      await page.waitForTimeout(180);
      const after = await h.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().slice(0, 30);
        return {
          tag,
          text,
          transform: s.transform,
          shadow: s.boxShadow,
          background: s.backgroundColor,
        };
      });
      sampled.push(after);
    } catch {
      // ignore this one
    }
  }
  const sigs = new Set(sampled.map((s) => `${s.transform}|${s.shadow}|${s.background}`));
  return { totalInteractive, sampledHovers: sampled, uniqueHoverSignatures: sigs.size };
}

async function checkContrast(page: Page): Promise<Findings["contrastIssues"]> {
  return await page.evaluate(() => {
    function parseColor(c: string): [number, number, number, number] | null {
      const m = c.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s]+([\d.]+))?\)/);
      if (!m) return null;
      return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] ? parseFloat(m[4]) : 1];
    }
    function srgbToLin(c: number) {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }
    function luminance([r, g, b]: [number, number, number, number]) {
      return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
    }
    function ratio(fg: [number, number, number, number], bg: [number, number, number, number]) {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (lighter + 0.05) / (darker + 0.05);
    }
    function effectiveBg(el: HTMLElement): [number, number, number, number] {
      let cur: HTMLElement | null = el;
      while (cur) {
        const s = window.getComputedStyle(cur);
        const c = parseColor(s.backgroundColor);
        if (c && c[3] > 0) return c;
        cur = cur.parentElement;
      }
      return [255, 255, 255, 1];
    }

    const issues: Array<{ text: string; fg: string; bg: string; fontSize: string; ratio: number }> = [];
    const textEls = document.querySelectorAll(
      "p, span, h1, h2, h3, h4, h5, h6, li, a, button, label, small, div",
    ) as NodeListOf<HTMLElement>;

    const seenSig = new Set<string>();
    textEls.forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!text || text.length < 2) return;
      // only check if this el has direct text
      const hasDirectText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0,
      );
      if (!hasDirectText) return;

      const s = window.getComputedStyle(el);
      const fg = parseColor(s.color);
      if (!fg) return;
      const bg = effectiveBg(el);
      const r = ratio(fg, bg);
      const fontSizePx = parseFloat(s.fontSize);
      const fontWeight = parseInt(s.fontWeight) || 400;
      const isLarge = fontSizePx >= 18.66 || (fontSizePx >= 14 && fontWeight >= 700);
      const threshold = isLarge ? 3 : 4.5;
      if (r < threshold) {
        const sig = `${s.color}|${fontSizePx}|${text.slice(0, 20)}`;
        if (seenSig.has(sig)) return;
        seenSig.add(sig);
        issues.push({
          text: text.slice(0, 60),
          fg: s.color,
          bg: `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
          fontSize: s.fontSize,
          ratio: Math.round(r * 100) / 100,
        });
      }
    });
    return issues.slice(0, 20);
  });
}

async function runRoute(
  page: Page,
  route: { name: string; path: string },
  bp: { name: string; width: number; height: number },
): Promise<Findings> {
  await page.setViewportSize({ width: bp.width, height: bp.height });

  let finalUrl = "";
  let status: number | null = null;
  try {
    const resp = await page.goto(`${BASE}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    status = resp?.status() ?? null;
    // Give it a moment to paint / render client components
    await page.waitForTimeout(1200);
    finalUrl = page.url();
  } catch (e: any) {
    finalUrl = `NAVIGATION_FAILED: ${e.message}`;
  }

  const screenshotName = `${route.name}-${bp.name}.png`;
  try {
    await page.screenshot({
      path: join(OUT_DIR, screenshotName),
      fullPage: true,
      timeout: 15000,
    });
  } catch (e: any) {
    process.stderr.write(`\n  screenshot failed: ${e.message}\n`);
  }

  const computed = await extractComputed(page).catch(() => ({
    uniqueRadii: [],
    uniqueFonts: [],
    uniqueFontSizes: [],
    uniqueFontWeights: [],
    uniqueShadows: [],
    gradients: [],
    roundedFullCount: 0,
    cardPatternCount: 0,
    cardNestingCount: 0,
  }));

  const focusStates = await captureFocusStates(page).catch(() => []);
  const hoverDifferentiation = await hoverSample(page).catch(() => ({
    totalInteractive: 0,
    sampledHovers: [],
    uniqueHoverSignatures: 0,
  }));
  const contrastIssues = await checkContrast(page).catch(() => []);

  let axeViolations: Findings["axeViolations"] = [];
  try {
    const axe = new AxeBuilder({ page });
    const results = await axe.analyze();
    axeViolations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact || "",
      help: v.help,
      nodes: v.nodes.length,
      selectors: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    }));
  } catch (e: any) {
    process.stderr.write(`\n  axe failed: ${e.message}\n`);
  }

  return {
    route: route.name,
    path: route.path,
    finalUrl,
    status,
    breakpoint: bp.name,
    screenshot: screenshotName,
    ...computed,
    axeViolations,
    focusStates,
    hoverDifferentiation,
    contrastIssues,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  // esbuild/tsx injects __name() helper calls into compiled functions that get
  // shipped to the browser via page.evaluate. Polyfill it so those calls don't
  // ReferenceError in the page context.
  await context.addInitScript(() => {
    // @ts-ignore
    if (typeof (globalThis as any).__name === "undefined") {
      // @ts-ignore
      (globalThis as any).__name = (fn: any) => fn;
    }
  });
  const page = await context.newPage();

  const findings: Findings[] = [];
  for (const route of ROUTES) {
    for (const bp of BREAKPOINTS) {
      process.stderr.write(`[${route.name} @ ${bp.name}] `);
      const t0 = Date.now();
      const f = await runRoute(page, route, bp);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      process.stderr.write(
        `status=${f.status} final=${f.finalUrl.replace(BASE, "")} radii=${f.uniqueRadii.length} cards=${f.cardPatternCount}(nested=${f.cardNestingCount}) roundedFull=${f.roundedFullCount} axe=${f.axeViolations.length} contrast=${f.contrastIssues.length} ${dt}s\n`,
      );
      findings.push(f);
      // Persist incrementally in case later route hangs
      writeFileSync(
        "docs/audit-screenshots/findings.json",
        JSON.stringify(findings, null, 2),
      );
    }
  }

  process.stderr.write("\nDone. Wrote docs/audit-screenshots/findings.json\n");
  await browser.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
