// Shared LLM-text sanitizers. Extracted from digest-sync so the digest and the
// trend cron share one no-dash backstop (project rule: no em/en dashes in any
// LLM-generated or UI copy).

// Backstop for the no-dash style rule: em/en dashes between digits become
// hyphens (5-7), every other em/en dash becomes a comma pause.
export function stripDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/,\s*,/g, ", ")
    .replace(/^,\s*/, "")
    .replace(/[,\s]+$/, "");
}

// With the web_search tool active the model writes internal citation markup
// (<cite index="...">...</cite>). Inside JSON strings the API can't lift it into
// citation metadata, so it leaks through as literal text. Strip it, then apply
// the dash rule. Newlines are preserved (paragraph breaks are real).
// ">?" because a length cap can slice a tag in half, leaving it unclosed.
export function cleanDigestText(s: string): string {
  return stripDashes(
    s.replace(/<\/?cite\b[^>]*>?/gi, "").replace(/[ \t]{2,}/g, " "),
  );
}
