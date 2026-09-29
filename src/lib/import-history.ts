import type { Memory } from "./types";

export type ImportedCampaign = Omit<Memory, "id" | "brandId" | "createdAt">;

function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error("The CSV has an unclosed quote. Check the file and try again.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const [headers, ...data] = rows;
  if (!headers || data.length === 0) throw new Error("Add a header and at least one campaign row.");
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

function value(row: Record<string, unknown>, ...keys: string[]): unknown {
  const entry = Object.entries(row).find(([key]) => keys.includes(key.toLowerCase().replace(/[\s_-]/g, "")));
  return entry?.[1];
}

function stringValue(input: unknown, max = 500): string {
  return typeof input === "string" ? input.trim().slice(0, max) : typeof input === "number" ? String(input) : "";
}

export function parseHistory(text: string, filename: string, brandId: string, brandName: string): ImportedCampaign[] {
  const clean = text.replace(/^\uFEFF/, "");
  let raw: unknown;
  try { raw = filename.toLowerCase().endsWith(".json") ? JSON.parse(clean) : parseCsv(clean); }
  catch (error) { throw error instanceof SyntaxError ? new Error("This JSON file could not be read.") : error; }
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === "object" && "campaigns" in raw ? (raw as { campaigns: unknown }).campaigns : null;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Upload a CSV or JSON array containing campaign rows.");
  if (rows.length > 200) throw new Error("Import up to 200 campaigns at a time.");
  return rows.map((unknownRow, index) => {
    if (!unknownRow || typeof unknownRow !== "object" || Array.isArray(unknownRow)) throw new Error(`Row ${index + 1} is not a campaign.`);
    const row = unknownRow as Record<string, unknown>;
    const brand = stringValue(value(row, "brand", "brandname", "brandid"), 80);
    if (brand && brand.toLowerCase() !== brandName.toLowerCase() && brand.toLowerCase() !== brandId.toLowerCase()) {
      throw new Error(`Row ${index + 1} belongs to “${brand}”. Switch to that brand or remove the row.`);
    }
    const hook = stringValue(value(row, "hook", "headline", "title"), 160);
    const body = stringValue(value(row, "body", "copy", "description"));
    const channel = stringValue(value(row, "channel"), 80);
    const festival = stringValue(value(row, "festival", "event"), 80) || "No festival";
    const audience = stringValue(value(row, "audience"), 120) || "General audience";
    const goal = stringValue(value(row, "goal"), 80) || "Awareness";
    const rawCtr = value(row, "actualctr", "ctr");
    const clicks = Number(value(row, "clicks"));
    const impressions = Number(value(row, "impressions"));
    const ctr = rawCtr !== undefined && rawCtr !== "" ? Number(String(rawCtr).replace(/%$/, "")) : clicks / impressions * 100;
    if (!hook || !channel || !Number.isFinite(ctr) || ctr < 0 || ctr > 100 || (rawCtr === undefined && (!(impressions > 0) || clicks < 0 || clicks > impressions))) {
      throw new Error(`Row ${index + 1} needs a hook, channel, and valid CTR (or clicks and impressions).`);
    }
    const yearInput = value(row, "year");
    const year = yearInput === undefined || yearInput === "" ? new Date().getFullYear() : Number(yearInput);
    if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 1) throw new Error(`Row ${index + 1} has an invalid year.`);
    const source = stringValue(value(row, "source")).toLowerCase() === "competitor" ? "competitor" as const : "own" as const;
    const competitor = stringValue(value(row, "competitor"), 80);
    const predictedRaw = value(row, "predictedctr");
    const predicted = predictedRaw === undefined || predictedRaw === "" ? null : Number(String(predictedRaw).replace(/%$/, ""));
    if (predicted !== null && (!Number.isFinite(predicted) || predicted < 0 || predicted > 100)) throw new Error(`Row ${index + 1} has an invalid predicted CTR.`);
    return {
      hook, body, channel, festival, audience, goal, actualCtr: Number(ctr.toFixed(2)),
      predictedCtr: predicted, outcome: ctr >= 2.5 ? "win" as const : "flop" as const,
      source, ...(source === "competitor" && competitor ? { competitor } : {}), year,
    };
  });
}
