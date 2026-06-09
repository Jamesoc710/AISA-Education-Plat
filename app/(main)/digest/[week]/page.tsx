import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DigestClient } from "@/components/digest-client";
import { editionToView } from "@/lib/digest-view";

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
      edition={await editionToView(edition)}
      stale={false} // archived weeks are supposed to be old
      previewingDraft={false}
      archiveView
      pastEditions={others.map((p: { weekOf: Date; headline: string }) => ({
        weekOf: p.weekOf.toISOString(),
        headline: p.headline,
      }))}
    />
  );
}
