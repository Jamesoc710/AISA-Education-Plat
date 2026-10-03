import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { viewerIsAdmin } from "@/lib/admin";
import { DigestClient } from "@/components/digest-client";
import { editionToView } from "@/lib/digest-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "This Week | AISA Atlas",
};

/**
 * Archive view: one published edition by its week slug (/digest/2026-06-08).
 * Admins can review any draft with ?preview=draft (the admin card links here).
 */
export default async function DigestWeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ week: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { week } = await params;
  const { preview } = await searchParams;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) redirect("/digest");
  const weekOf = new Date(`${week}T00:00:00.000Z`);
  if (Number.isNaN(weekOf.getTime())) redirect("/digest");

  const edition = await prisma.digestEdition.findUnique({ where: { weekOf } });
  if (!edition) redirect("/digest");
  // Drafts are never reachable by URL guessing; only an admin preview shows one
  const previewingDraft =
    edition.status !== "published" && preview === "draft" && (await viewerIsAdmin());
  if (edition.status !== "published" && !previewingDraft) redirect("/digest");

  const others = await prisma.digestEdition.findMany({
    where: { status: "published", NOT: { id: edition.id } },
    orderBy: { weekOf: "desc" },
    select: { weekOf: true, periodEnd: true, headline: true },
  });

  return (
    <DigestClient
      edition={await editionToView(edition)}
      previewingDraft={previewingDraft}
      archiveView
      pastEditions={others.map((p: { weekOf: Date; periodEnd: Date | null; headline: string }) => ({
        weekOf: p.weekOf.toISOString(),
        periodEnd: p.periodEnd?.toISOString() ?? null,
        headline: p.headline,
      }))}
    />
  );
}
