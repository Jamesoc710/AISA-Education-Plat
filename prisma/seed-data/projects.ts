/**
 * Build Board project seeds.
 *
 * CURRENT CONTENT = QA SAMPLES ONLY (qa-sample-* slugs). They exist to verify
 * the showcase layout end to end and must NEVER be approved. Replace them with
 * the real member projects before launch, then remove them with
 * `npx tsx --env-file=.env scripts/seed-projects.ts --delete qa-sample-rag-helper,qa-sample-cap-table-lab,qa-sample-club-site`.
 *
 * Authoring rules:
 *  - slugs: kebab-case, unique, stable (they are the public URL)
 *  - team[].email must match an existing users.email exactly; contributors
 *    without an app account go in extraContributors by display name
 *  - no em or en dashes in any member-facing text
 */

export type ProjectSeed = {
  slug: string;
  title: string;
  blurb: string;
  /** Markdown body for the detail page */
  description?: string;
  trackSlug: "ai" | "capital-markets" | "field-guides" | null;
  lookingFor: string[];
  repoUrl?: string;
  demoUrl?: string;
  team: { email: string; role: string }[];
  extraContributors: string[];
};

const QA_ADMIN_EMAIL = "etownjames7+atlasqa@gmail.com";

export const PROJECT_SEEDS: ProjectSeed[] = [
  {
    slug: "qa-sample-rag-helper",
    title: "Course Catalog RAG Helper",
    blurb:
      "A chat assistant that answers questions about club workshops and the concept catalog, built on retrieval over our own content.",
    description: [
      "**What it is.** A small retrieval-augmented chat tool: ask it anything about the club's workshops or the concept catalog and it answers with citations back to the source page.",
      "",
      "**Where it stands.**",
      "- Embeddings + retrieval working over the 57 AI concepts",
      "- Basic chat UI prototyped",
      "- Needs evaluation, prompt polish, and a real frontend",
      "",
      "Stack: Next.js, Supabase, the Anthropic API. Good first project if you want hands-on RAG experience, see [the repo](https://example.com/qa-sample) for the setup guide.",
    ].join("\n"),
    trackSlug: "ai",
    lookingFor: ["frontend dev", "prompt engineer"],
    repoUrl: "https://github.com/example/qa-sample-rag-helper",
    demoUrl: "https://example.com/qa-sample-demo",
    team: [{ email: QA_ADMIN_EMAIL, role: "Lead" }],
    extraContributors: ["Jordan Sample", "Priya Placeholder"],
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
    lookingFor: ["finance modeler"],
    repoUrl: "https://github.com/example/qa-sample-cap-table-lab",
    team: [],
    extraContributors: ["Casey Example"],
  },
  {
    slug: "qa-sample-club-site",
    title: "Club Site Refresh",
    blurb:
      "Rebuilding the public club site: new landing page, event highlights, and a join form that actually works on phones.",
    trackSlug: null,
    lookingFor: ["designer", "writer"],
    team: [],
    extraContributors: ["Sam Placeholder", "Riley Test", "Alex Demo"],
  },
];
