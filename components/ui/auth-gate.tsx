import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

/**
 * Drop-in panel for logged-out pages that still live inside the (main)
 * shell. Instead of bouncing the user back to /login, we keep the
 * sidebar + top chrome context so they can still navigate around, and
 * show a centered sign-in card with contextual copy in the main area.
 *
 * Each page passes the nextPath so successful sign-in drops the user
 * right back where they were looking.
 */

export function AuthGate({
  icon,
  tileColor = "indigo",
  title,
  body,
  nextPath,
  signInLabel = "Sign in",
  signUpLabel = "Create an account",
}: {
  icon: IconName;
  tileColor?: string;
  title: string;
  body: string;
  nextPath: string;
  signInLabel?: string;
  signUpLabel?: string;
}) {
  const signInHref = `/login?next=${encodeURIComponent(nextPath)}`;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px 24px 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
          padding: "32px 32px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            marginBottom: "var(--space-4)",
          }}
        >
          <IconTile icon={icon} color={tileColor} size="lg" />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          {body}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <Link
            href={signInHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
              height: 44,
              padding: "0 18px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "var(--color-accent)",
              borderRadius: "var(--radius-2)",
              textDecoration: "none",
              letterSpacing: "-0.005em",
            }}
          >
            {signInLabel}
            <Icon name="arrow-right" size={14} strokeWidth={2} />
          </Link>
          <Link
            href={signInHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 40,
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-text-2)",
              textDecoration: "none",
            }}
          >
            {signUpLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
