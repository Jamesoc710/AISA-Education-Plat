// Balanced-brace JSON extraction. Extracted from digest-sync so any pipeline
// parsing model output can reuse it. Surrounding prose can contain braces (a
// live run emitted text after the JSON and broke a naive first-"{"-to-last-"}"
// slice), so scan for every balanced top-level {...} and let the caller keep
// the last one shaped like its target.
export function* balancedJsonCandidates(text: string): Generator<string> {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      if (depth > 0) inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}" && depth > 0) {
      depth--;
      if (depth === 0 && start !== -1) {
        yield text.slice(start, i + 1);
        start = -1;
      }
    }
  }
}
