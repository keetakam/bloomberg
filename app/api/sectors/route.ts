import type { SectorData } from "@/app/api/update-sectors/route";
import { getSectors, getTickersBySector } from "@/lib/nasdaq-sectors";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getFromRedis(): Promise<SectorData | null> {
  try {
    return await redis.get<SectorData>("nasdaq_sectors");
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sector = searchParams.get("sector");

  // Redis first (updated by cron), fallback to bundled CSV
  const redisData = await getFromRedis();

  if (sector) {
    if (redisData?.[sector]) {
      return NextResponse.json({ tickers: redisData[sector].slice(0, 50) });
    }
    return NextResponse.json({ tickers: getTickersBySector(sector) });
  }

  if (redisData) {
    return NextResponse.json({ sectors: Object.keys(redisData).sort() });
  }
  return NextResponse.json({ sectors: getSectors() });
}
