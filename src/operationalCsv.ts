export type CsvRecord = Record<string,string>;

export function parseCsv(text: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value.length)) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1)
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) => Object.fromEntries(headers.map((header,index) => [header, (values[index] ?? "").trim()])));
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
}

const DAY_MAP: Record<string,number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};

export function parseTravelDays(value: string) {
  const parts = value.split(/[|;\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
  const days = parts.map((item) => (/^[0-6]$/.test(item) ? Number(item) : DAY_MAP[item])).filter((item): item is number => Number.isInteger(item));
  return Array.from(new Set(days)).sort((a,b) => a-b);
}

export async function sha256Hex(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2,"0")).join("");
}

export function normalizeRosterRows(rows: CsvRecord[]) {
  return rows.map((row) => ({ participant_ref: row.participant_ref || row.employee_id || row.student_id || row.id || "" }));
}

export function normalizeCommuteRows(rows: CsvRecord[]) {
  return rows.map((row) => ({
    participant_ref: row.participant_ref || row.employee_id || row.student_id || row.id || "",
    origin_zone: row.origin_zone || "",
    destination_zone: row.destination_zone || "",
    travel_days: parseTravelDays(row.travel_days || row.days || ""),
    arrival_start: row.arrival_start || "",
    arrival_end: row.arrival_end || "",
    return_start: row.return_start || "",
    return_end: row.return_end || "",
    flexibility_minutes: row.flexibility_minutes || "0",
    current_mode: row.current_mode || "",
    parking_difficulty: row.parking_difficulty || "",
    access_point_willing: row.access_point_willing || "false",
    ev_hybrid_status: row.ev_hybrid_status || "unknown",
    approximate_zones: true,
  }));
}

export const ROSTER_TEMPLATE = `participant_ref\nEMP-001\nEMP-002\n`;
export const COMMUTE_TEMPLATE = `participant_ref,origin_zone,destination_zone,travel_days,arrival_start,arrival_end,return_start,return_end,flexibility_minutes,current_mode,parking_difficulty,access_point_willing,ev_hybrid_status\nEMP-001,Eagle Rock,Pasadena,Mon|Tue|Wed,07:30,08:00,16:30,17:00,15,drive_alone,4,true,ev\n`;

export function downloadCsvTemplate(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
