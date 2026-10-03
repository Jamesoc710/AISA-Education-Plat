// Date labels for a digest edition. weekOf and periodEnd are UTC midnights, so
// format in UTC or they render as the previous day west of Greenwich.

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

/**
 * "Week of October 5, 2026", or the span for a recap edition
 * ("August 10 to September 27, 2026"). `short` drops "Week of" and abbreviates.
 */
export function editionDateLabel(
  weekOf: string,
  periodEnd: string | null,
  style: "long" | "short" = "long",
): string {
  const month = style === "long" ? "long" : "short";
  if (!periodEnd) {
    const day = fmt(weekOf, { month, day: "numeric", year: "numeric" });
    return style === "long" ? `Week of ${day}` : day;
  }
  const sameYear = weekOf.slice(0, 4) === periodEnd.slice(0, 4);
  const start = fmt(weekOf, sameYear ? { month, day: "numeric" } : { month, day: "numeric", year: "numeric" });
  const end = fmt(periodEnd, { month, day: "numeric", year: "numeric" });
  if (style === "long") return `${start} to ${end}`;
  // Short labels sit in narrow columns: allow a line break only after "to"
  const nb = (t: string) => t.replace(/ /g, " ");
  return `${nb(start)} to ${nb(end)}`;
}
