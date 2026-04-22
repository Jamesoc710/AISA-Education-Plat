/**
 * Small uppercase chip for an event's team / category. Used on the Home
 * week rundown, Calendar agenda, Homework rows, and anywhere else a row
 * needs a one-word origin indicator.
 *
 * Always renders a `<span>` — even for GENERAL (no-label) events — so
 * callers using grid/flex layouts don't collapse a column when the tag
 * is empty. Use resolveTypeTag() directly if you need the raw entry.
 */

type TypeTagEntry = { label: string; color: string };

const TAGS: Record<string, TypeTagEntry> = {
  TECH_TEAM: { label: "TECH", color: "var(--color-blue)" },
  CAPITAL_TEAM: { label: "CAPITAL", color: "var(--color-correct)" },
  EVENTS: { label: "EVENT", color: "#E08A3C" },
  MEDIA_TEAM: { label: "MEDIA", color: "#8064A2" },
  EXEC: { label: "EXEC", color: "var(--color-incorrect)" },
  NON_MANDATORY: { label: "OPTIONAL", color: "var(--color-slate)" },
  GENERAL: { label: "", color: "var(--color-text-3)" },
};

export function resolveTypeTag(type: string): TypeTagEntry {
  return TAGS[type] ?? TAGS.GENERAL;
}

export function TypeTag({
  type,
  size = 11,
}: {
  type: string;
  size?: number;
}) {
  const tag = resolveTypeTag(type);
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tag.color,
        whiteSpace: "nowrap",
      }}
    >
      {tag.label}
    </span>
  );
}
