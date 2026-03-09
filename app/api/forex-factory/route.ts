import type {
  ForexCalendarResponse,
  ForexEvent,
  ForexImpact,
} from "@/lib/models/forex-factory.model";
import { NextResponse } from "next/server";

// Uses the unofficial ForexFactory JSON feed (no Cloudflare protection)
const FF_JSON_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

const IMPACT_MAP: Record<string, ForexImpact> = {
  High: "high",
  Medium: "medium",
  Low: "low",
  Holiday: "holiday",
};

interface FfJsonEvent {
  title: string;
  country: string;
  date: string; // ISO 8601
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("impact") ?? "high"; // high | medium | low | all

  try {
    const responses = await Promise.all(
      FF_JSON_URLS.map((url) =>
        fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 300 },
        })
      )
    );

    const allRaw: FfJsonEvent[] = [];
    for (const res of responses) {
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) allRaw.push(...data);
      }
    }

    const events: ForexEvent[] = allRaw
      .map((item): ForexEvent => {
        const d = new Date(item.date);
        const date = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const time = d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const impact: ForexImpact = IMPACT_MAP[item.impact] ?? "unknown";
        return {
          date,
          time,
          currency: item.country,
          impact,
          event: item.title,
          actual: item.actual || "-",
          forecast: item.forecast || "-",
          previous: item.previous || "-",
        };
      })
      .filter((e) => filter === "all" || e.impact === filter);

    return NextResponse.json(
      { status: "success", count: events.length, data: events } satisfies ForexCalendarResponse,
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("ForexFactory fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch calendar",
      } satisfies Partial<ForexCalendarResponse>,
      { status: 500 }
    );
  }
}
