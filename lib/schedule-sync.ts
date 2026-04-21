import ExcelJS from "exceljs";
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ─── Color → EventType mapping ─────────────────────────────────────────────
// Pulled from the calendar's own legend cell (J4):
//   Tech Team: Blue  → 4F81BD
//   Capital Team: Green → 9BBB59
//   Events: Orange → F79646
//   Non-mandatory: Grey → 808080
//   General: Black → 000000
//   Media Team: Purple → 8064A2
//   Exec: Red → C0504D

const COLOR_TO_TYPE: Record<string, string> = {
  "4F81BD": "TECH_TEAM",
  "538DD5": "TECH_TEAM",
  "1F497D": "TECH_TEAM",
  "9BBB59": "CAPITAL_TEAM",
  "92D050": "CAPITAL_TEAM",
  "00B050": "CAPITAL_TEAM",
  "F79646": "EVENTS",
  "FFC000": "EVENTS",
  "ED7D31": "EVENTS",
  "808080": "NON_MANDATORY",
  "A6A6A6": "NON_MANDATORY",
  "8064A2": "MEDIA_TEAM",
  "7030A0": "MEDIA_TEAM",
  "C0504D": "EXEC",
  "FF0000": "EXEC",
  "C00000": "EXEC",
  "000000": "GENERAL",
};

// Theme colors fall back to these. The TCO sheet uses theme:4 for Exec red.
const THEME_TO_TYPE: Record<number, string> = {
  4: "EXEC",
};

function colorToType(font?: Partial<ExcelJS.Font>): string {
  const color = font?.color as { argb?: string; theme?: number } | undefined;
  if (color?.argb) {
    const rgb = color.argb.replace(/^FF/i, "").toUpperCase();
    return COLOR_TO_TYPE[rgb] ?? "GENERAL";
  }
  if (color?.theme !== undefined && THEME_TO_TYPE[color.theme]) {
    return THEME_TO_TYPE[color.theme];
  }
  return "GENERAL";
}

// ─── Date range parsing ───────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDateRange(text: string, year: number): { start: Date; end: Date } | null {
  // Handles "Mar 30 – Apr 05", "May 04 – May 10", "Apr 06 – Apr 12"
  const m = text.match(/(\w{3})\s+(\d{1,2})\s*[\u2013\u2014\u2212-]\s*(?:(\w{3})\s+)?(\d{1,2})/);
  if (!m) return null;
  const [, m1, d1, m2, d2] = m;
  const startMonth = MONTHS[m1];
  const endMonth = m2 ? MONTHS[m2] : startMonth;
  if (startMonth === undefined || endMonth === undefined) return null;
  const start = new Date(Date.UTC(year, startMonth, parseInt(d1, 10)));
  const end = new Date(Date.UTC(year, endMonth, parseInt(d2, 10), 23, 59, 0));
  if (end < start) end.setUTCFullYear(year + 1); // year wrap (Dec→Jan)
  return { start, end };
}

// ─── Time hint extraction ─────────────────────────────────────────────────

function extractTime(text: string): { startTime: string | null; endTime: string | null } {
  // "5 - 8pm", "5:30 - 6:30", "6:30-7:30pm", "7 - 9:30 pm", "12 - 1"
  const m = text.match(/(\d{1,2}(?::\d{2})?)\s*(?:to|[-\u2013\u2014])\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i);
  if (m) return { startTime: m[1], endTime: m[2] + (m[3] ? m[3] : "") };
  return { startTime: null, endTime: null };
}

// ─── Cell parsing ─────────────────────────────────────────────────────────

interface ParsedEvent {
  title: string;
  description: string | null;
  type: string;
  startTime: string | null;
  endTime: string | null;
}

function getCellLines(cell: ExcelJS.Cell): { text: string; type: string }[] {
  const v = cell.value;
  if (!v) return [];

  const lines: { text: string; type: string }[] = [];

  if (typeof v === "object" && "richText" in v) {
    // Walk runs, breaking on \r?\n. The dominant non-GENERAL color in a line wins.
    let buf = "";
    let lineType = "GENERAL";
    const runs = (v as ExcelJS.CellRichTextValue).richText;
    for (const run of runs) {
      const runType = colorToType(run.font);
      const text = run.text;
      const parts = text.split(/\r?\n/);
      for (let i = 0; i < parts.length; i++) {
        buf += parts[i];
        if (runType !== "GENERAL") lineType = runType;
        if (i < parts.length - 1) {
          if (buf.trim()) lines.push({ text: buf, type: lineType });
          buf = "";
          lineType = "GENERAL";
        }
      }
    }
    if (buf.trim()) lines.push({ text: buf, type: lineType });
  } else {
    const text = String(typeof v === "object" && "text" in v
      ? (v as { text: string }).text
      : typeof v === "object" && "result" in v
        ? (v as { result?: unknown }).result ?? ""
        : v);
    const type = colorToType(cell.font);
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) lines.push({ text: line, type });
    }
  }

  return lines;
}

const BULLET_RE = /^\s*[\u2022\u2023\u25E6\u2043\u2219\u00B7\u25AA\u25CF]/;

function parseCell(cell: ExcelJS.Cell): ParsedEvent[] {
  const lines = getCellLines(cell);
  if (lines.length === 0) return [];

  const events: ParsedEvent[] = [];
  let pending: ParsedEvent | null = null;

  for (const { text, type } of lines) {
    const stripped = text.replace(BULLET_RE, "").trim();
    if (!stripped) continue;
    const isBullet = BULLET_RE.test(text);
    // A type mismatch signals a different team/session — never fold into the
    // previous event as a description. GENERAL is the "unknown" fallback and
    // is tolerated either way so notes under a colored header still attach.
    const typeMismatch =
      pending != null &&
      pending.type !== "GENERAL" &&
      type !== "GENERAL" &&
      pending.type !== type;
    // Bullets are sub-topics of the preceding event. If the bullet itself is
    // uncolored (GENERAL) but the parent is colored, treat authoring omission
    // as inheritance — otherwise the LLM's "different colors stay separate"
    // rule strands the bullet as its own event.
    const effectiveType: string =
      isBullet && type === "GENERAL" && pending != null && pending.type !== "GENERAL"
        ? pending.type
        : type;

    if (isBullet || !pending || typeMismatch) {
      if (pending) events.push(pending);
      const time = extractTime(stripped);
      pending = {
        title: stripped.replace(/\s+/g, " "),
        description: null,
        type: effectiveType,
        startTime: time.startTime,
        endTime: time.endTime,
      };
    } else {
      // Continuation line, append to description, prefer non-GENERAL type
      if (pending.type === "GENERAL" && type !== "GENERAL") pending.type = type;
      pending.description = pending.description
        ? pending.description + "\n" + stripped
        : stripped;
    }
  }
  if (pending) events.push(pending);
  return events;
}

// ─── LLM normalization ────────────────────────────────────────────────────
// Collapses same-type bullets in a cell into one event with topics[]. Cached
// by raw-content hash so unchanged cells never re-call the model.

export interface NormalizedEvent {
  title: string;
  description: string | null;
  topics: string[] | null;
  type: string;
  startTime: string | null;
  endTime: string | null;
}

function cellContentHash(parsed: ParsedEvent[]): string {
  const repr = parsed
    .map(
      (e) =>
        `${e.title} [${e.type}]${e.startTime ? ` ${e.startTime}-${e.endTime ?? "?"}` : ""}${e.description ? ` || ${e.description}` : ""}`,
    )
    .join("\n");
  return createHash("sha256").update(repr).digest("hex");
}

const LLM_SYSTEM_PROMPT = `You are normalizing a single weekday cell from a shared class-calendar spreadsheet.

Each input line has a detected team color (TECH_TEAM, CAPITAL_TEAM, EVENTS, MEDIA_TEAM, EXEC, NON_MANDATORY, GENERAL).

Decide whether the lines represent ONE session with multiple sub-topics, or MULTIPLE distinct sessions.

Rules:
- Lines of different types (colors) are always separate events.
- Lines that share a type and are clearly sub-topics of one workshop/lecture (no conflicting times/locations) should be merged into a single event with topics[].
- Preserve exact wording for titles and topics, do not paraphrase or invent text.
- When merging: the first line becomes the title; subsequent same-type lines become topics. Keep time hints from the title line if present.
- If a merged event's title contains a trailing time range like "7 - 9" or "5:30 - 6:30", strip it from the title and populate startTime/endTime instead.
- Preserve time strings exactly as they appear in the input. If the source says "12 - 1", emit startTime "12" and endTime "1" — do NOT pad with ":00", do NOT convert to 24-hour, do NOT add am/pm that wasn't there.
- Never merge across types. Never merge if the lines look like independent items.

Output strict JSON only, no markdown fences, no prose:
{ "events": [ { "title": string, "description": string | null, "topics": string[] | null, "type": string, "startTime": string | null, "endTime": string | null } ] }`;

async function normalizeWithLLM(parsed: ParsedEvent[]): Promise<NormalizedEvent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const lines = parsed
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" [${p.type}]${p.startTime ? ` time:${p.startTime}-${p.endTime ?? "?"}` : ""}${p.description ? `\n   notes: ${p.description}` : ""}`,
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: LLM_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Lines:\n${lines}\n\nReturn the normalized events JSON.` }],
  });

  const text =
    response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`LLM returned no JSON: ${text.slice(0, 200)}`);
  const result = JSON.parse(match[0]) as { events?: unknown };
  if (!Array.isArray(result.events)) throw new Error("LLM response missing events[]");

  return result.events.map((raw): NormalizedEvent => {
    const e = raw as Partial<NormalizedEvent>;
    return {
      title: String(e.title ?? "").slice(0, 500),
      description: e.description ? String(e.description).slice(0, 2000) : null,
      topics:
        Array.isArray(e.topics) && e.topics.length > 0
          ? e.topics.map((t) => String(t)).slice(0, 20)
          : null,
      type: String(e.type ?? "GENERAL"),
      startTime: e.startTime ? String(e.startTime) : null,
      endTime: e.endTime ? String(e.endTime) : null,
    };
  });
}

function toNormalized(parsed: ParsedEvent[]): NormalizedEvent[] {
  return parsed.map((e) => ({
    title: e.title,
    description: e.description,
    topics: null,
    type: e.type,
    startTime: e.startTime,
    endTime: e.endTime,
  }));
}

// ─── Location per column ──────────────────────────────────────────────────

const COL_LOCATIONS: Record<number, string> = {
  3: "Dream Lab",         // Mon
  4: "Willow Room",       // Tue
  5: "Lillis 132",        // Wed
  6: "Dream Lab",         // Thu
  7: "Lilis ENTR (Exec)", // Fri
};

const HOMEWORK_COL = 8;

// ─── Categorization heuristic ─────────────────────────────────────────────

function categorize(title: string, dayOfWeek: number): string {
  if (dayOfWeek === 5) return "HOMEWORK";
  const t = title.toLowerCase();
  if (/\bworkshop\b|\blab\b/.test(t)) return "WORKSHOP";
  if (/\btest\b|\bdebate\b|\bquiz\b/.test(t)) return "DEADLINE";
  if (/\bmeeting\b|\bstandup\b|\blecture\b/.test(t)) return "MEETING";
  if (/\bclub meeting\b/.test(t)) return "MEETING";
  return "OTHER";
}

// ─── Share URL → download URL ─────────────────────────────────────────────

export function buildDownloadUrl(shareUrl: string): string {
  const m = shareUrl.match(/^(https:\/\/[^/]+)\/:x:\/g\/personal\/([^/]+)\/([^/?]+)/);
  if (!m) throw new Error(`Unsupported SharePoint URL shape: ${shareUrl}`);
  const [, host, user, token] = m;
  return `${host}/personal/${user}/_layouts/15/download.aspx?share=${token}`;
}

// ─── Main sync ────────────────────────────────────────────────────────────

export interface SyncResult {
  fetched: number;       // events parsed from sheet
  upserted: number;      // events written to DB
  removed: number;       // events deleted (no longer in sheet)
  errors: string[];
  syncedAt: Date;
  durationMs: number;
  llmCalls: number;      // cells normalized via Claude this run
  llmCached: number;     // cells reused from cache (unchanged content)
}

export async function syncCalendar(opts?: { year?: number }): Promise<SyncResult> {
  const t0 = Date.now();
  const year = opts?.year ?? new Date().getFullYear();
  const url = process.env.SCHEDULE_SHEET_URL;
  if (!url) throw new Error("SCHEDULE_SHEET_URL env var not set");

  const downloadUrl = buildDownloadUrl(url);
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet found in calendar file");

  const errors: string[] = [];
  const seenKeys = new Set<string>();
  const records: { key: string; data: Record<string, unknown> }[] = [];
  const syncedAt = new Date();
  const LLM_CAP = 100; // hard budget guard
  let llmCalls = 0;
  let llmCached = 0;

  type CellJob = {
    cellKey: string;
    weekNumber: number;
    range: { start: Date; end: Date };
    dayOfWeek: number;
    col: number;
    parsed: ParsedEvent[];
    hash: string;
  };
  const jobs: CellJob[] = [];

  for (let r = 4; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const datesCell = row.getCell(1).value;
    const weekCell = row.getCell(2).value;
    const datesRaw = datesCell == null ? "" : String(datesCell).trim();
    if (!datesRaw || weekCell == null) continue;

    const range = parseDateRange(datesRaw, year);
    if (!range) {
      errors.push(`Row ${r}: cannot parse date range "${datesRaw}"`);
      continue;
    }
    const weekNumber = Number(weekCell);
    if (!Number.isFinite(weekNumber)) {
      errors.push(`Row ${r}: invalid week "${String(weekCell)}"`);
      continue;
    }

    for (const col of [3, 4, 5, 6, 7, HOMEWORK_COL]) {
      const cell = row.getCell(col);
      const parsed = parseCell(cell);
      if (parsed.length === 0) continue;
      const dayOfWeek = col === HOMEWORK_COL ? 5 : col - 3;
      const dayCode = ["mon", "tue", "wed", "thu", "fri", "hw"][dayOfWeek];
      jobs.push({
        cellKey: `w${weekNumber}-${dayCode}`,
        weekNumber,
        range,
        dayOfWeek,
        col,
        parsed,
        hash: cellContentHash(parsed),
      });
    }
  }

  // Prime cache for all cells in one query
  const cacheRows = await prisma.scheduleCellCache.findMany({
    where: { cellKey: { in: jobs.map((j) => j.cellKey) } },
  });
  const cacheByKey = new Map(cacheRows.map((c) => [c.cellKey, c]));

  // Resolve each cell → normalized events (cache → LLM → deterministic fallback)
  for (const job of jobs) {
    const cached = cacheByKey.get(job.cellKey);
    let normalized: NormalizedEvent[];

    if (cached && cached.contentHash === job.hash) {
      normalized = cached.normalized as unknown as NormalizedEvent[];
      llmCached++;
    } else if (job.parsed.length <= 1 || job.dayOfWeek === 5) {
      // Single-item cells and the homework column never need LLM merging
      normalized = toNormalized(job.parsed);
      await prisma.scheduleCellCache.upsert({
        where: { cellKey: job.cellKey },
        create: {
          cellKey: job.cellKey,
          contentHash: job.hash,
          normalized: normalized as unknown as Prisma.InputJsonValue,
        },
        update: {
          contentHash: job.hash,
          normalized: normalized as unknown as Prisma.InputJsonValue,
        },
      });
    } else if (llmCalls >= LLM_CAP) {
      errors.push(`LLM budget cap (${LLM_CAP}) reached at ${job.cellKey}; using deterministic parse`);
      normalized = toNormalized(job.parsed);
    } else {
      try {
        normalized = await normalizeWithLLM(job.parsed);
        llmCalls++;
        await prisma.scheduleCellCache.upsert({
          where: { cellKey: job.cellKey },
          create: {
            cellKey: job.cellKey,
            contentHash: job.hash,
            normalized: normalized as unknown as Prisma.InputJsonValue,
          },
          update: {
            contentHash: job.hash,
            normalized: normalized as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`LLM failed for ${job.cellKey}: ${msg}`);
        normalized = toNormalized(job.parsed);
      }
    }

    const eventDate = new Date(job.range.start);
    const dayOffset = job.dayOfWeek <= 4 ? job.dayOfWeek : 4;
    eventDate.setUTCDate(eventDate.getUTCDate() + dayOffset);

    normalized.forEach((ev, idx) => {
      const key = `${job.cellKey}-${idx}`;
      seenKeys.add(key);
      records.push({
        key,
        data: {
          weekNumber: job.weekNumber,
          weekStart: job.range.start,
          weekEnd: job.range.end,
          dayOfWeek: job.dayOfWeek,
          date: eventDate,
          title: ev.title.slice(0, 500),
          description: ev.description?.slice(0, 2000) ?? null,
          topics:
            ev.topics && ev.topics.length > 0
              ? (ev.topics.slice(0, 20) as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          startTime: ev.startTime,
          endTime: ev.endTime,
          location: job.dayOfWeek === 5 ? null : COL_LOCATIONS[job.col] ?? null,
          type: ev.type,
          category: categorize(ev.title, job.dayOfWeek),
          syncedAt,
        },
      });
    });
  }

  // Upsert all normalized events
  for (const { key, data } of records) {
    await prisma.scheduleEvent.upsert({
      where: { sourceRowKey: key },
      create: { sourceRowKey: key, ...data } as Parameters<typeof prisma.scheduleEvent.create>[0]["data"],
      update: data as Parameters<typeof prisma.scheduleEvent.update>[0]["data"],
    });
  }

  // Delete events no longer in the sheet
  const removed = await prisma.scheduleEvent.deleteMany({
    where: { sourceRowKey: { notIn: Array.from(seenKeys) } },
  });

  return {
    fetched: records.length,
    upserted: records.length,
    removed: removed.count,
    errors,
    syncedAt,
    durationMs: Date.now() - t0,
    llmCalls,
    llmCached,
  };
}
