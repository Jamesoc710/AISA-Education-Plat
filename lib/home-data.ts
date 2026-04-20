import { prisma } from "@/lib/prisma";
import type { WeekWindow } from "@/lib/week-utils";

/**
 * Data access layer for the Home / Today page.
 *
 * One exported function per panel. All functions are pooled into a single
 * Promise.all in the page route so a cold visit is one round-trip of
 * parallel queries.
 */

// ─── Types (serializable — everything passed to the client) ────────────────

export type HomeWeekEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  type: string;
  dayOfWeek: number;
};

export type ContinuePick = {
  conceptSlug: string;
  conceptName: string;
  conceptSubtitle: string;
  sectionName: string;
  sectionSlug: string;
  /** "resume" = user has activity here; "start" = brand-new user fallback */
  kind: "resume" | "start";
};

export type DueItem = {
  id: string;
  title: string;
  /** ISO string or null (some assignments have no due date) */
  dueDate: string | null;
  href: string;
  kind: "homework" | "assessment";
};

export type BookmarkPreview = {
  conceptId: string;
  conceptSlug: string;
  conceptName: string;
  conceptSubtitle: string;
  sectionName: string;
  sectionSlug: string;
};

export type WeakConcept = {
  conceptSlug: string;
  conceptName: string;
  attempts: number;
  accuracyPct: number;
};

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getWeekEvents(window: WeekWindow): Promise<HomeWeekEvent[]> {
  const rows = await prisma.scheduleEvent.findMany({
    where: { date: { gte: window.start, lte: window.end } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      type: true,
      dayOfWeek: true,
    },
  });
  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    title: r.title,
    date: r.date.toISOString(),
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    type: r.type,
    dayOfWeek: r.dayOfWeek,
  }));
}

/**
 * Where to resume. Most-recent quiz attempt → its concept. If none, the
 * first concept in the first fundamentals section (by sortOrder).
 */
export async function getContinueLearning(userId: string): Promise<ContinuePick | null> {
  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { userId },
    orderBy: { attemptedAt: "desc" },
    select: {
      question: {
        select: {
          concept: {
            select: {
              name: true,
              slug: true,
              subtitle: true,
              section: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (lastAttempt?.question?.concept) {
    const c = lastAttempt.question.concept;
    return {
      conceptSlug: c.slug,
      conceptName: c.name,
      conceptSubtitle: c.subtitle,
      sectionName: c.section.name,
      sectionSlug: c.section.slug,
      kind: "resume",
    };
  }

  const firstConcept = await prisma.concept.findFirst({
    orderBy: [{ section: { tier: { sortOrder: "asc" } } }, { section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      name: true,
      slug: true,
      subtitle: true,
      section: { select: { name: true, slug: true } },
    },
  });
  if (!firstConcept) return null;
  return {
    conceptSlug: firstConcept.slug,
    conceptName: firstConcept.name,
    conceptSubtitle: firstConcept.subtitle,
    sectionName: firstConcept.section.name,
    sectionSlug: firstConcept.section.slug,
    kind: "start",
  };
}

/**
 * Homework not yet submitted + next formal assessment not yet attempted.
 * Merged, sorted by dueDate (nulls last), truncated to 4.
 */
export async function getDueItems(userId: string): Promise<DueItem[]> {
  const [assignments, activeQuiz] = await Promise.all([
    prisma.assignment.findMany({
      where: { submissions: { none: { userId } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, dueDate: true },
      take: 4,
    }),
    prisma.formalQuiz.findFirst({
      where: {
        status: "active",
        attempts: { none: { userId, submittedAt: { not: null } } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  const items: DueItem[] = assignments.map((a: (typeof assignments)[number]) => ({
    id: `hw-${a.id}`,
    title: a.title,
    dueDate: a.dueDate?.toISOString() ?? null,
    href: `/homework/${a.id}`,
    kind: "homework",
  }));

  if (activeQuiz) {
    items.push({
      id: `fq-${activeQuiz.id}`,
      title: activeQuiz.title,
      dueDate: activeQuiz.dueDate?.toISOString() ?? null,
      href: `/assessment/${activeQuiz.id}`,
      kind: "assessment",
    });
  }

  return items
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 4);
}

export async function getRecentBookmarks(userId: string, limit = 3): Promise<BookmarkPreview[]> {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      concept: {
        select: {
          id: true,
          slug: true,
          name: true,
          subtitle: true,
          section: { select: { name: true, slug: true } },
        },
      },
    },
  });
  return rows.map((r: (typeof rows)[number]) => ({
    conceptId: r.concept.id,
    conceptSlug: r.concept.slug,
    conceptName: r.concept.name,
    conceptSubtitle: r.concept.subtitle,
    sectionName: r.concept.section.name,
    sectionSlug: r.concept.section.slug,
  }));
}

/**
 * The concept where the user answered worst. Returns null unless the user
 * has ≥3 attempts on a single concept AND its accuracy is <60%.
 */
export async function getWeakestConcept(userId: string): Promise<WeakConcept | null> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, isCorrect: { not: null } },
    select: {
      isCorrect: true,
      question: { select: { concept: { select: { slug: true, name: true } } } },
    },
  });
  if (attempts.length === 0) return null;

  const tally = new Map<string, { name: string; slug: string; total: number; correct: number }>();
  for (const a of attempts as { isCorrect: boolean | null; question: { concept: { slug: string; name: string } } }[]) {
    const key = a.question.concept.slug;
    const cur =
      tally.get(key) ??
      { name: a.question.concept.name, slug: a.question.concept.slug, total: 0, correct: 0 };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    tally.set(key, cur);
  }

  let worst: { name: string; slug: string; total: number; correct: number } | null = null;
  for (const c of tally.values()) {
    if (c.total < 3) continue;
    const pct = c.correct / c.total;
    if (pct >= 0.6) continue;
    if (!worst || c.correct / c.total < worst.correct / worst.total) worst = c;
  }
  if (!worst) return null;
  return {
    conceptSlug: worst.slug,
    conceptName: worst.name,
    attempts: worst.total,
    accuracyPct: Math.round((worst.correct / worst.total) * 100),
  };
}
