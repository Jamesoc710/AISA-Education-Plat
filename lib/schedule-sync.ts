import ExcelJS from "exceljs";
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

    if (isBullet || !pending) {
      if (pending) events.push(pending);
      const time = extractTime(stripped);
      pending = {
        title: stripped.replace(/\s+/g, " "),
        description: null,
        type,
        startTime: time.startTime,
        endTime: time.endTime,
      };
    } else {
      // Continuation line — append to description, prefer non-GENERAL type
      if (pending.type === "GENERAL" && type !== "GENERAL") pending.type = type;
      pending.description = pending.description
        ? pending.description + "\n" + stripped
        : stripped;
    }
  }
  if (pending) events.push(pending);
  return events;
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
      const events = parseCell(cell);
      const dayOfWeek = col === HOMEWORK_COL ? 5 : col - 3;

      const eventDate = new Date(range.start);
      const dayOffset = dayOfWeek <= 4 ? dayOfWeek : 4; // homework column → Friday
      eventDate.setUTCDate(eventDate.getUTCDate() + dayOffset);

      events.forEach((ev, idx) => {
        const dayCode = ["mon", "tue", "wed", "thu", "fri", "hw"][dayOfWeek];
        const key = `w${weekNumber}-${dayCode}-${idx}`;
        seenKeys.add(key);
        records.push({
          key,
          data: {
            weekNumber,
            weekStart: range.start,
            weekEnd: range.end,
            dayOfWeek,
            date: eventDate,
            title: ev.title.slice(0, 500),
            description: ev.description?.slice(0, 2000) ?? null,
            startTime: ev.startTime,
            endTime: ev.endTime,
            location: dayOfWeek === 5 ? null : COL_LOCATIONS[col] ?? null,
            type: ev.type,
            category: categorize(ev.title, dayOfWeek),
            syncedAt,
          },
        });
      });
    }
  }

  // Upsert all parsed events
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
  };
}
