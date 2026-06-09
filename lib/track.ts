import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Track resolution for the TCO multi-track pivot.
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
  const store = await cookies();
  return store.get(TRACK_COOKIE)?.value || DEFAULT_TRACK_SLUG;
}

export async function getTracks(): Promise<TrackSummary[]> {
  const tracks = await prisma.track.findMany({
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
