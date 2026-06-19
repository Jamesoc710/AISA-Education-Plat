import { TREND_PERSPECTIVES } from "../../prisma/seed-data/trend-perspectives";
import { TREND_SEEDS } from "../../prisma/seed-data/trends";

const slugs = new Set(TREND_SEEDS.map((t) => t.slug));
let bad = 0;
let badUrl = 0;
let stances = 0;
let withSrc = 0;
for (const [slug, p] of Object.entries(TREND_PERSPECTIVES)) {
  if (!slugs.has(slug)) {
    console.log("UNKNOWN SLUG", slug);
    bad++;
  }
  if (p === null) continue;
  if (!p.shape || !("intro" in p) || !Array.isArray(p.stances) || !("leans" in p)) {
    console.log("SHAPE BAD", slug);
    bad++;
  }
  for (const s of p.stances) {
    stances++;
    if (!s.label || !s.who || !s.summary || !s.body || !Array.isArray(s.sources)) {
      console.log("STANCE BAD", slug);
      bad++;
    }
    if (s.sources.length) withSrc++;
    for (const src of s.sources)
      if (!/^https?:\/\//.test(src.url || "")) {
        console.log("BAD URL", slug, src.url);
        badUrl++;
      }
  }
}
console.log("keys:", Object.keys(TREND_PERSPECTIVES).length, "| coverage vs seeds:", slugs.size);
console.log("total stances:", stances, "| stances w/ >=1 source:", withSrc);
console.log("structural errors:", bad, "| bad urls:", badUrl);
console.log(bad === 0 && badUrl === 0 ? "STRUCT OK" : "STRUCT FAIL");
