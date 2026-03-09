import { NextResponse } from "next/server";
import "@/lib/market-data-refresh"; // registers market data refresh (every 24h)
import "@/lib/news-prefetch"; // registers news pre-fetch for popular tickers (every 15min)
import "@/lib/news-digest"; // registers 4-hour AI news digest

export function GET() {
  return NextResponse.json({
    status: "Scheduler initialized",
    message: "Market data refresh scheduler is running",
  });
}

export function POST() {
  return NextResponse.json({ status: "ok" });
}
