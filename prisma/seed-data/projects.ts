import type { ProjectStage } from "../../lib/project-stages";

/**
 * Build Board project seeds (real member projects, provided by James 2026-06-09).
 *
 * Seeding is idempotent by slug (`npx tsx --env-file=.env scripts/seed-projects.ts`):
 * new entries land as drafts, re-runs never touch approval status. Approve each
 * project from its /build/[slug] page as ADMIN or PROJECT_LEAD.
 *
 * Authoring rules:
 *  - slugs: kebab-case, unique, stable (they are the public URL)
 *  - team[].email must match an existing users.email exactly; contributors
 *    without an app account go in extraContributors as { name, role? }
 *  - stage: idea | building | shipped | paused
 *  - no em or en dashes in any member-facing text
 */

export type ProjectSeed = {
  slug: string;
  title: string;
  blurb: string;
  /** Markdown body for the detail page */
  description?: string;
  trackSlug: "ai" | "capital-markets" | "field-guides" | null;
  stage: ProjectStage;
  lookingFor: string[];
  repoUrl?: string;
  demoUrl?: string;
  walkthroughUrl?: string;
  team: { email: string; role: string }[];
  extraContributors: { name: string; role?: string }[];
};

export const PROJECT_SEEDS: ProjectSeed[] = [
  {
    slug: "la-fires-assistant",
    title: "LA Fires Assistant",
    blurb:
      "An AI-powered tool that helps Los Angeles County wildfire victims understand what they can legally rebuild on their properties, consolidating fragmented government GIS data from multiple jurisdictions into a single conversational interface.",
    description: [
      "**The problem.** After the LA County wildfires, homeowners trying to rebuild face a maze of fragmented government data. Figuring out what you can legally rebuild means manually cross-referencing parcel records, zoning codes, overlay districts, and hazard layers across multiple disconnected government systems (Z-NET, GIS-NET, the County Assessor portal, ZIMAS, and city-specific viewers), each with its own interface and quirks.",
      "",
      "**What it does.** This tool collapses that hours-long research process into a single conversational interface. A homeowner or architect enters an address or parcel number, and the assistant routes the query to the correct jurisdiction, pulls the relevant zoning, overlay, and hazard data, and returns it in a structured, human-readable format.",
      "",
      "**Key capabilities:**",
      "",
      "- Jurisdiction-aware routing across three jurisdictions (Unincorporated LA County, City of Los Angeles, City of Pasadena) covering 1M+ parcels",
      "- Integration of 15+ government ArcGIS/GIS APIs into one pipeline",
      "- Sub-7-second response times, with caching bringing repeat queries to about 1.5 seconds",
      "- Grouped overlay categorization (Hazards, Historic Preservation, Land Use & Planning, Development Regulations, Community Standards, Environmental Protection)",
      "- Address-to-APN lookup in addition to direct APN/AIN input",
      "- Universal hazard layers (fault zones, liquefaction, landslide, tsunami, coastal) applied across all jurisdictions regardless of local boundaries",
      "",
      "**Stack:** Next.js, TypeScript, OpenRouter (LLM orchestration with primary/fallback redundancy), ArcGIS REST services, deployed on Vercel.",
    ].join("\n"),
    trackSlug: "ai",
    stage: "building",
    lookingFor: ["front-end dev"],
    repoUrl: "https://github.com/Jamesoc710/LA-Fires-V2",
    demoUrl: "https://rebuildlaagent.com/landing",
    walkthroughUrl: "https://www.loom.com/share/4c79c07250cf41a78ab4d3e68a3b3651",
    team: [{ email: "jsoc@uoregon.edu", role: "Lead" }],
    extraContributors: [],
  },
  {
    slug: "agentrank",
    title: "AgentRank",
    blurb:
      "AgentRank measures whether websites actually work for AI browser agents. A fixed agent attempts the same task on dozens of real sites, we rank the sites by measured success rate, and we test whether Google's new static \"agent-readiness\" audit predicts those real outcomes.",
    description: [
      "**Why it exists.** AI agents are becoming real users of the web. They compare prices, look up policies, and pull facts off pages, and they fail in ways human visitors never would. Google recently shipped an \"Agentic Browsing\" category in Lighthouse 13.3, a static audit that scores how agent-ready a website is from signals like llms.txt, accessibility-tree quality, and layout stability. Site owners will inevitably optimize for that score. What nobody has established is whether a static audit like that reflects what happens when a real agent actually tries to use the site.",
      "",
      "**What it does.** AgentRank answers that with behavioral ground truth: we rank real websites by how often an AI browser agent completes the same fixed task on them, then compare those measured rankings against the static audit scores.",
      "",
      "**How it works:**",
      "",
      "- A Gemini-powered browser agent attempts the same task on every site: start at the homepage, navigate to the primary product or service page, and extract one specific factual claim. The model, prompt, step budget, and timeout are all frozen, so the websites are the only variable.",
      "- The cohort spans payment platforms, developer tools, government portals, big-box retail, and single-location small businesses, with multiple trials per site.",
      "- Scoring is pre-registered. Success means the agent's answer contains an expected substring, with the answer keys frozen and committed before any runs happen. The expected answer never appears in the agent's prompt, so the only way to score is to actually browse.",
      "- Two conditions are measured per site: full autonomous navigation from the homepage, and a deep-link extraction control that separates \"can the agent read the page\" from \"can the agent find the page.\"",
      "- Every trial stores a full step-by-step transcript, so any number on the leaderboard can be inspected down to the individual agent actions.",
      "- The leaderboard reports Wilson 95% confidence intervals with tie-aware ranking, so sites that are statistically indistinguishable share a rank instead of implying false precision.",
      "",
      "We are currently expanding the site cohort and running additional test waves before publishing the full analysis.",
      "",
      "**Stack:** Python, Playwright, and Gemini 2.0 Flash for the agent harness; Lighthouse 13.3 for static scoring; Firebase Firestore for run storage; Next.js, TypeScript, Tailwind, and Recharts for the leaderboard and charts; Firebase Hosting for deploy.",
    ].join("\n"),
    trackSlug: "ai",
    stage: "building",
    lookingFor: ["data analysis/collection", "front-end dev"],
    repoUrl: "https://github.com/HilyardHacks/QH3project",
    team: [{ email: "jsoc@uoregon.edu", role: "Lead" }],
    extraContributors: [],
  },

  {
    slug: "ai-acceleration-viz",
    title: "AI Acceleration Visualization",
    blurb:
      "A data-driven site showing that AI capabilities and infrastructure are going exponential while adoption lags: three domains plotted in parallel so the gap is self-evident, traced from GPT-2 (Feb 2019) onward.",
    description: [
      "*Working title.* An interactive visualization built around a single thesis: AI capabilities are accelerating faster than adoption can keep up, and infrastructure buildout is outpacing both. Rather than asserting the gap, the site plots real data across three domains in parallel and lets viewers see it for themselves.",
      "",
      "**The story** splits into a supply side (what is being built and spent) and an actualization side (whether any of it is landing):",
      "",
      "- **Capabilities:** frontier model releases, benchmark saturation curves (MMLU, GPQA, SWE-bench, HumanEval, Arena ELO), compute scaling (~6-month doubling), inference cost decay, context window growth",
      "- **Hardware & investment:** data center buildout, Nvidia data center revenue, hyperscaler capex, private AI funding and valuations, research velocity (arXiv, OpenAlex)",
      "- **Adoption, the lag story:** consumer awareness spiked (fastest-adopted consumer product in history) but enterprise deployment is stuck near 6-7% of US businesses, with productivity gains trailing. Surfaces depth-vs-breadth and underused sources like the US Census BTOS.",
      "",
      "**Methodology choices:** timeline starts at GPT-2 (Feb 2019) to capture the pre-ChatGPT scaling era; Epoch AI canonical for compute, Stanford AI Index for macro stats; conflicts documented rather than silently resolved; raw values stored, normalized at plot time.",
      "",
      "**The build runs in two phases.** Phase One collects seven high-signal datasets (Epoch model/compute, key benchmarks, hyperscaler capex, Nvidia revenue, Census BTOS, arXiv submissions, ChatGPT WAU milestones). Phase Two adds ~20-25 messier datasets, automated via Claude Code with parallel source-type subagents (api-fetcher, sec-fetcher, web-scraper, pdf-extractor, csv-normalizer, data-validator) driven by a datasets.yaml manifest, plus the visualization and site build itself.",
      "",
      "**Stack:** Claude Code multi-agent pipeline for collection; data sources include Epoch AI, SEC EDGAR, US Census BTOS, arXiv, OpenAlex, and Nvidia investor filings.",
    ].join("\n"),
    trackSlug: "ai",
    stage: "idea",
    lookingFor: ["front-end dev", "data visualization", "designer"],
    team: [{ email: "jsoc@uoregon.edu", role: "Lead" }],
    extraContributors: [],
  },
];
