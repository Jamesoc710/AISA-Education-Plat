import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { DigestClient } from "@/components/digest-client";
import { editionToView } from "@/lib/digest-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "This Week | AISA Atlas",
};

const STALE_AFTER_MS = 8 * 24 * 60 * 60 * 1000;

async function viewerIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return false;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export default async function DigestPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { preview } = await searchParams;
  // Admins can preview the latest edition regardless of status (the review
  // step before publishing); everyone else only ever sees published content.
  const previewingDraft = preview === "draft" && (await viewerIsAdmin());

  const edition = previewingDraft
    ? await prisma.digestEdition.findFirst({ orderBy: { weekOf: "desc" } })
    : await prisma.digestEdition.findFirst({
        where: { status: "published" },
        orderBy: { weekOf: "desc" },
      });

  const pastEditions = edition
    ? await prisma.digestEdition.findMany({
        where: { status: "published", weekOf: { lt: edition.weekOf } },
        orderBy: { weekOf: "desc" },
        select: { weekOf: true, headline: true },
      })
    : [];

  return (
    <DigestClient
      edition={edition ? await editionToView(edition) : null}
      stale={
        edition ? Date.now() - edition.generatedAt.getTime() > STALE_AFTER_MS : false
      }
      previewingDraft={previewingDraft}
      pastEditions={pastEditions.map((p: { weekOf: Date; headline: string }) => ({
        weekOf: p.weekOf.toISOString(),
        headline: p.headline,
      }))}
    />
  );
}
