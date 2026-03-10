import { readFileSync } from "node:fs";
import { join } from "node:path";

export type NasdaqStock = {
  symbol: string;
  name: string;
  marketCap: number;
};

type SectorMap = Record<string, NasdaqStock[]>;

let _cache: SectorMap | null = null;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function buildSectorMap(): SectorMap {
  // ใช้ไฟล์ที่ generate จาก ext/nasdaq_download.py (python main.py)
  // fallback ไปไฟล์ manual download ถ้ายังไม่ได้รัน script
  const candidates = [
    join(process.cwd(), "ext", "nasdaq_all_latest.csv"),
    join(process.cwd(), "ext", "nasdaq_screener_1773105256853.csv"),
  ];

  let csv = "";
  for (const path of candidates) {
    try {
      csv = readFileSync(path, "utf-8");
      break;
    } catch {
      // ลองไฟล์ถัดไป
    }
  }

  if (!csv) throw new Error("No NASDAQ CSV found in ext/");
  const lines = csv.trim().split(/\r?\n/);
  const map: SectorMap = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const symbol = cols[0]?.trim();
    const name = cols[1]?.trim().replace(/^"|"$/g, "");
    const marketCap = Number.parseFloat(cols[5] ?? "0") || 0;
    const sector = cols[9]?.trim();

    if (!symbol || !sector) continue;

    if (!map[sector]) map[sector] = [];
    map[sector].push({ symbol, name, marketCap });
  }

  // Sort each sector by market cap desc
  for (const sector of Object.keys(map)) {
    map[sector].sort((a, b) => b.marketCap - a.marketCap);
  }

  return map;
}

export function getSectorMap(): SectorMap {
  if (!_cache) _cache = buildSectorMap();
  return _cache;
}

export function getSectors(): string[] {
  return Object.keys(getSectorMap()).sort();
}

export function getTickersBySector(sector: string, limit = 50): NasdaqStock[] {
  return (getSectorMap()[sector] ?? []).slice(0, limit);
}
