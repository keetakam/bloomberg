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
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`${exchange}: HTTP ${res.status}`);
  const json = await res.json();
  return (json?.data?.rows ?? []) as NasdaqStockRaw[];
}

export async function GET() {
  const results = await Promise.allSettled(EXCHANGES.map(fetchExchange));

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
  await redis.set(REDIS_KEY, sectorMap, { ex: REDIS_TTL });

  const sectors = Object.keys(sectorMap).sort();
  const totalStocks = allStocks.length;

  console.log(`[update-sectors] Updated ${totalStocks} stocks across ${sectors.length} sectors`);
  return NextResponse.json({ status: "ok", sectors: sectors.length, stocks: totalStocks });
}
