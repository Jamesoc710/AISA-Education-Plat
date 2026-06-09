import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DigestClient } from "@/components/digest-client";
import type { DigestItem } from "@/lib/digest-sync";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "This Week | AISA Atlas",
};

/** Archive view: one published edition by its week slug (/digest/2026-06-08). */
export default async function DigestWeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) redirect("/digest");
  const weekOf = new Date(`${week}T00:00:00.000Z`);
  if (Number.isNaN(weekOf.getTime())) redirect("/digest");

  const edition = await prisma.digestEdition.findUnique({ where: { weekOf } });
  // Drafts are never reachable by URL guessing — only published weeks resolve
  if (!edition || edition.status !== "published") redirect("/digest");

  const others = await prisma.digestEdition.findMany({
    where: { status: "published", NOT: { id: edition.id } },
    orderBy: { weekOf: "desc" },
    select: { weekOf: true, headline: true },
  });

  return (
    <DigestClient
      edition={{
        headline: edition.headline,
        weekOf: edition.weekOf.toISOString(),
        generatedAt: edition.generatedAt.toISOString(),
        status: edition.status,
        items: edition.items as unknown as DigestItem[],
        bigPicture: edition.bigPicture,
        watchFor: edition.watchFor,
      }}
      stale={false} // archived weeks are supposed to be old
      previewingDraft={false}
      archiveView
      pastEditions={others.map((p) => ({
        weekOf: p.weekOf.toISOString(),
        headline: p.headline,
      }))}
    />
  );
}
