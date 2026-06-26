import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeam, teamAccentVars } from "@/lib/teams";
import { getTeamDropsBoard, isTeamLive } from "@/lib/team-data";
import {
  SectionEyebrow,
  ArrowRight,
  EditorialLinkStyles,
} from "@/components/ui/editorial";
import { DropRow } from "@/components/team-hq/drop-row";
import { TeamHoverStyles } from "@/components/team-hq/team-hover-styles";

export const dynamic = "force-dynamic";

/**
 * The full, reverse-chron archive of a team's member drops: the durable record a
 * group chat cannot keep. Member posts only here (no system floor). Gated by the
 * same liveness check as the HQ, so a doorless team 404s on its board too.
 */
export default async function TeamDropsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team || !team.flags.memberFacing) notFound();
  if (!(await isTeamLive(team))) notFound();

  const { drops, isLoggedIn } = await getTeamDropsBoard(team);

  const rootStyle = {
    ...teamAccentVars(team.accent),
    backgroundColor: "var(--color-bg)",
    minHeight: "100%",
  } as React.CSSProperties;

  return (
    <div data-surface="editorial" style={rootStyle}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 48px 96px" }}>
        <Link
          href={`/teams/${team.slug}`}
          className="editorial-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-accent)",
            textDecoration: "none",
            marginBottom: "var(--space-5)",
          }}
        >
          {team.displayName}
        </Link>

        <SectionEyebrow>Worth a read</SectionEyebrow>
        <h1
          style={{
            margin: "0 0 var(--space-6)",
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.08,
            color: "var(--color-text)",
          }}
        >
          Everything
        </h1>

        {drops.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {drops.map((d) => (
              <DropRow key={d.id} drop={d} teamSlug={team.slug} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: 1.55 }}>
            Nothing here yet.{" "}
            <Link
              href={`/teams/${team.slug}`}
              className="editorial-link"
              style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}
            >
              Be the first to share a link
            </Link>
            .
          </p>
        )}

        <div style={{ marginTop: "var(--space-7)" }}>
          <Link
            href={`/teams/${team.slug}`}
            className="editorial-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "var(--text-base)",
              fontWeight: 500,
              color: "var(--color-text-2)",
              textDecoration: "none",
            }}
          >
            Back to {team.displayName}
            <ArrowRight />
          </Link>
        </div>
      </div>

      <EditorialLinkStyles />
      <TeamHoverStyles />
    </div>
  );
}
