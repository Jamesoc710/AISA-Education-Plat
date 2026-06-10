import type { ProjectStage } from "../../lib/project-stages";

/**
 * Build Board project seeds.
 *
 * la-fires-assistant is REAL content (provided by James, 2026-06-09).
 * The qa-sample-* entries exist to verify the showcase layout end to end and
 * must NEVER be approved. Once the remaining real projects land, remove them:
 * `npx tsx --env-file=.env scripts/seed-projects.ts --delete qa-sample-rag-helper,qa-sample-cap-table-lab,qa-sample-club-site`.
 *
 * Authoring rules:
 *  - slugs: kebab-case, unique, stable (they are the public URL)
 *  - team[].email must match an existing users.email exactly; contributors
 *    without an app account go in extraContributors as { name, role? }
 *  - stage: idea | building | polishing | completed | paused
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

const QA_ADMIN_EMAIL = "etownjames7+atlasqa@gmail.com";

export const PROJECT_SEEDS: ProjectSeed[] = [
  // ── Real projects ──────────────────────────────────────────────────────────
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
    stage: "polishing",
    lookingFor: ["front-end dev"],
    repoUrl: "https://github.com/Jamesoc710/LA-Fires-V2",
    demoUrl: "https://rebuildlaagent.com/landing",
    walkthroughUrl: "https://www.loom.com/share/4c79c07250cf41a78ab4d3e68a3b3651",
    team: [],
    extraContributors: [{ name: "James OConnor", role: "Lead" }],
  },

  // ── QA samples (layout verification only, never approve) ──────────────────
  {
    slug: "qa-sample-rag-helper",
    title: "Course Catalog RAG Helper",
    blurb:
      "A chat assistant that answers questions about club workshops and the concept catalog, built on retrieval over our own content.",
    description: [
      "**What it is.** A small retrieval-augmented chat tool: ask it anything about the club's workshops or the concept catalog and it answers with citations back to the source page.",
      "",
      "**Where it stands.**",
      "",
      "- Embeddings + retrieval working over the 57 AI concepts",
      "- Basic chat UI prototyped",
      "- Needs evaluation, prompt polish, and a real frontend",
      "",
      "Stack: Next.js, Supabase, the Anthropic API. Good first project if you want hands-on RAG experience, see [the repo](https://example.com/qa-sample) for the setup guide.",
    ].join("\n"),
    trackSlug: "ai",
    stage: "building",
    lookingFor: ["frontend dev", "prompt engineer"],
    repoUrl: "https://github.com/example/qa-sample-rag-helper",
    demoUrl: "https://example.com/qa-sample-demo",
    team: [{ email: QA_ADMIN_EMAIL, role: "Lead" }],
    extraContributors: [{ name: "Jordan Sample" }, { name: "Priya Placeholder" }],
  },
  {
    slug: "qa-sample-cap-table-lab",
    title: "Cap Table Lab",
    blurb:
      "An interactive cap table you can break: model a SAFE converting into a priced round and watch dilution land on every shareholder.",
    description: [
      "**What it is.** A spreadsheet-style playground for the Capital Markets track: start from a clean cap table, add a post-money SAFE, run a Series A, and see exactly who gets diluted and by how much.",
      "",
      "**Where it stands.** Formula engine sketched in a notebook; needs someone who enjoys finance modeling to pressure-test the math against the cm- vocabulary before any UI work starts.",
    ].join("\n"),
    trackSlug: "capital-markets",
    stage: "idea",
    lookingFor: ["finance modeler"],
    repoUrl: "https://github.com/example/qa-sample-cap-table-lab",
    team: [],
    extraContributors: [{ name: "Casey Example" }],
  },
  {
    slug: "qa-sample-club-site",
    title: "Club Site Refresh",
    blurb:
      "Rebuilding the public club site: new landing page, event highlights, and a join form that actually works on phones.",
    trackSlug: null,
    stage: "completed",
    lookingFor: ["designer", "writer"],
    team: [],
    extraContributors: [
      { name: "Sam Placeholder" },
      { name: "Riley Test" },
      { name: "Alex Demo" },
    ],
  },
];
