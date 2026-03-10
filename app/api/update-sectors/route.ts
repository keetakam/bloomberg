import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const EXCHANGES = ["NYSE", "NASDAQ", "AMEX"];
const REDIS_KEY = "nasdaq_sectors";
const REDIS_TTL = 60 * 60 * 48; // 48 hours

export type NasdaqStockRaw = {
  symbol: string;
  name: string;
  marketcap: string;
  sector: string;
};

export type SectorData = Record<string, { symbol: string; name: string; marketCap: number }[]>;

async function fetchExchange(exchange: string): Promise<NasdaqStockRaw[]> {
  const url = `https://api.nasdaq.com/api/screener/stocks?tableonly=true&exchange=${exchange}&download=true`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`${exchange}: HTTP ${res.status}`);
  const json = await res.json();
  const rows = json?.data?.rows;
  if (!Array.isArray(rows)) throw new Error(`${exchange}: unexpected response shape`);
  return rows as NasdaqStockRaw[];
}

export async function GET() {
  try {
    const results = await Promise.allSettled(EXCHANGES.map(fetchExchange));

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message ?? "unknown");

    // Merge + deduplicate
    const seen = new Set<string>();
    const allStocks: NasdaqStockRaw[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const stock of r.value) {
          if (!seen.has(stock.symbol)) {
            seen.add(stock.symbol);
            allStocks.push(stock);
          }
        }
      }
    }

    if (allStocks.length === 0) {
      return NextResponse.json(
        { status: "error", message: "All exchanges failed", errors },
        { status: 502 }
      );
    }

    // Group by sector, sort by market cap
    const sectorMap: SectorData = {};
    for (const stock of allStocks) {
      const sector = stock.sector?.trim();
      if (!sector || !stock.symbol) continue;
      if (!sectorMap[sector]) sectorMap[sector] = [];
      sectorMap[sector].push({
        symbol: stock.symbol.trim(),
        name: stock.name?.trim() ?? "",
        marketCap: Number.parseFloat(stock.marketcap ?? "0") || 0,
      });
    }
    for (const sector of Object.keys(sectorMap)) {
      sectorMap[sector].sort((a, b) => b.marketCap - a.marketCap);
    }

    // Save to Redis
    try {
      await redis.set(REDIS_KEY, sectorMap, { ex: REDIS_TTL });
    } catch (redisErr) {
      console.error("[update-sectors] Redis save failed:", redisErr);
    }

    const sectors = Object.keys(sectorMap).sort();
    console.log(
      `[update-sectors] Updated ${allStocks.length} stocks across ${sectors.length} sectors`
    );

    return NextResponse.json({
      status: "ok",
      sectors: sectors.length,
      stocks: allStocks.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[update-sectors] Fatal error:", err);
    return NextResponse.json({ status: "error", message: String(err) }, { status: 500 });
  }
}
