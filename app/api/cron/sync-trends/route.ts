import { NextRequest, NextResponse } from "next/server";
import { syncTrends } from "@/lib/trend-sync";

// Long LLM + web-search run, same ceiling as the digest cron.
export const maxDuration = 300;

/**
 * GET /api/cron/sync-trends  (Bearer CRON_SECRET)
 * Refreshes the trend tracker from live web search. Built for the daily cron,
 * but the vercel.json schedule is intentionally NOT wired yet: trigger this via
 * the admin "Sync now" button until a cadence is chosen.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncTrends();
  // Surface pipeline failure as 500 so a cron run is marked failed.
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
