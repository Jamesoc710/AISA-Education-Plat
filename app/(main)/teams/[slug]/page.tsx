import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeam, teamAccentVars } from "@/lib/teams";
import { getTeamPageData } from "@/lib/team-data";
import {
  HairRule,
  SectionEyebrow,
  ArrowRight,
  EditorialLinkStyles,
} from "@/components/ui/editorial";
import { TypeTag } from "@/components/ui/type-tag";
import { WorthARead } from "@/components/team-hq/worth-a-read";
import { TeamApply } from "@/components/team-hq/team-apply";
import { SetLensButton } from "@/components/team-hq/set-lens-button";

export const dynamic = "force-dynamic";

/**
 * The Team HQ at /teams/[slug]. Editorial surface in the team accent (never the
 * home blue), rendered declaratively off the registry flags. 404s for an unknown
 * slug, an ops team, or a team that fails the liveness gate.
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team || !team.flags.memberFacing) notFound();

  const data = await getTeamPageData(team);
  if (!data) notFound();

  const rootStyle = {
    ...teamAccentVars(team.accent),
    backgroundColor: "var(--color-bg)",
    minHeight: "100%",
  } as React.CSSProperties;

  const memberLabel =
    data.memberCount === 0
      ? "No members yet"
      : data.memberCount === 1
        ? "1 member"
        : `${data.memberCount} members`;

  return (
    <div data-surface="editorial" style={rootStyle}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 48px 96px" }}>
        {/* Top hairline in the team accent */}
        <div
          aria-hidden
          style={{ height: 3, width: 64, backgroundColor: "var(--color-accent)", marginBottom: "var(--space-5)" }}
        />

        {/* ── 1. Masthead ─────────────────────────────────────────── */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "var(--space-6)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <SectionEyebrow>Team</SectionEyebrow>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(40px, 5.5vw, 60px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.04,
                color: "var(--color-text)",
              }}
            >
              {team.wordmark ?? team.displayName}
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: "var(--text-md)",
                color: "var(--color-text-2)",
                lineHeight: 1.5,
                maxWidth: 640,
              }}
            >
              {team.mandate}
            </p>
            <div
              style={{
                marginTop: "var(--space-4)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
              }}
            >
              {memberLabel}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "var(--space-3)",
              flexShrink: 0,
            }}
          >
            <TeamApply teamName={team.displayName} />
            {team.trackId && (
              <SetLensButton
                trackSlug={team.trackId}
                isActive={data.activeLensSlug === team.trackId}
              />
            )}
          </div>
        </header>

        <HairRule top={48} bottom={40} />

        {/* ── 2. Next team meeting ────────────────────────────────── */}
        <section>
          <SectionEyebrow>Next team meeting</SectionEyebrow>
          {data.meeting ? (
            <article style={cardStyle}>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-text-2)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {data.meeting.dayLabel}, {data.meeting.dateLabel}
                {data.meeting.timeLabel ? ` · ${data.meeting.timeLabel}` : ""}
              </div>
              <h3 style={cardTitleStyle}>{data.meeting.title}</h3>
              <div
                style={{
                  marginTop: "var(--space-3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-2)",
                }}
              >
                {data.meeting.location && <span>{data.meeting.location}</span>}
                <TypeTag type={data.meeting.type} />
              </div>
            </article>
          ) : (
            <p style={emptyStyle}>
              No meeting on the calendar right now.{" "}
              <Link href="/calendar" className="editorial-link" style={accentLink}>
                See the full calendar
              </Link>
              .
            </p>
          )}
        </section>

        <HairRule top={40} bottom={40} />

        {/* ── 3. Worth a read ─────────────────────────────────────── */}
        <WorthARead
          teamSlug={team.slug}
          drops={data.drops}
          hasMore={data.hasMoreDrops}
          memberDropCount={data.memberDropCount}
          isLoggedIn={data.isLoggedIn}
        />

        <HairRule top={40} bottom={40} />

        {/* ── 4. What we are building ─────────────────────────────── */}
        <section>
          <SectionEyebrow>What we are building</SectionEyebrow>
          {data.projects.length > 0 ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {data.projects.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/build/${p.slug}`}
                    className="editorial-link-row"
                    style={{ ...cardStyle, display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <h3 style={cardTitleStyle}>{p.title}</h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "var(--text-base)",
                        color: "var(--color-text-2)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}
                    >
                      {p.blurb}
                    </p>
                    {p.lookingFor.length > 0 && (
                      <div
                        style={{
                          marginTop: "var(--space-3)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                          color: "var(--color-accent)",
                        }}
                      >
                        Help wanted: {p.lookingFor.join(", ")}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: "var(--space-4)" }}>
                <Link href="/build" className="editorial-link" style={accentLink}>
                  See the full Build Board <ArrowRight />
                </Link>
              </div>
            </>
          ) : (
            <p style={emptyStyle}>
              No projects tagged to {team.displayName} yet.{" "}
              <Link href="/build" className="editorial-link" style={accentLink}>
                Post one on the Build Board
              </Link>
              .
            </p>
          )}
        </section>

        <HairRule top={40} bottom={40} />

        {/* ── 5. Roster ───────────────────────────────────────────── */}
        <section>
          <SectionEyebrow>Roster</SectionEyebrow>
          {data.roster.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "var(--space-3)",
              }}
            >
              {data.roster.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-2)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--color-surface-2)",
                      color: "var(--color-text-2)",
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {m.initials}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "var(--text-base)",
                        fontWeight: 500,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.name}
                    </div>
                    {m.active && (
                      <div
                        style={{
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: "var(--color-accent)",
                          }}
                        />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
                          Active this week
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={emptyStyle}>No one has joined yet. Be the founding member.</p>
          )}
        </section>

        <HairRule top={40} bottom={40} />

        {/* ── Footer utility links (the demoted home-repeats) ──────── */}
        <footer style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <FooterLink href="/home">Resume learning</FooterLink>
          <FooterLink href="/browse">Full curriculum</FooterLink>
          <FooterLink href="/calendar">Full calendar</FooterLink>
        </footer>
      </div>

      <EditorialLinkStyles />
    </div>
  );
}

// ── Shared style fragments ────────────────────────────────────────────────────

const cardStyle = {
  padding: "20px 22px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-3)",
  backgroundColor: "var(--color-surface)",
} as const;

const cardTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  lineHeight: 1.3,
  color: "var(--color-text)",
} as const;

const emptyStyle = {
  margin: 0,
  fontSize: "var(--text-base)",
  color: "var(--color-text-2)",
  lineHeight: 1.55,
} as const;

const accentLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
  fontWeight: 600,
  color: "var(--color-accent)",
  textDecoration: "none",
} as const;

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
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
      {children}
      <ArrowRight />
    </Link>
  );
}
