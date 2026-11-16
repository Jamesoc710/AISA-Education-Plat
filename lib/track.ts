import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AI_TRACK_ONLY } from "@/lib/config";

/**
 * Track resolution for the multi-track pivot.
 *
 * The active track is held in a cookie (set via POST /api/track) and read
 * server-side on every track-scoped surface. Defaults to the AI flagship.
 * URL-based `/t/[slug]/…` deep links are a deferred Later-phase add.
 */
export const TRACK_COOKIE = "tco-track";
export const DEFAULT_TRACK_SLUG = "ai";

export type TrackSummary = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  accentColor: string;
  isPrimary: boolean;
};

export async function getActiveTrackSlug(): Promise<string> {
  // A saved choice of another track is ignored while only the AI track is offered.
  if (AI_TRACK_ONLY) return DEFAULT_TRACK_SLUG;
  const store = await cookies();
  return store.get(TRACK_COOKIE)?.value || DEFAULT_TRACK_SLUG;
}

export async function getTracks(): Promise<TrackSummary[]> {
  const tracks = await prisma.track.findMany({
    // A track with no content never shows up in a switcher.
    where: {
      tiers: { some: {} },
      ...(AI_TRACK_ONLY ? { slug: DEFAULT_TRACK_SLUG } : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      accentColor: true,
      isPrimary: true,
    },
  });
  return tracks;
}
