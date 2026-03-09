import type { NewsDigest } from "@/lib/news-digest";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const digest = await redis.get<NewsDigest>("news_digest_latest");
    return NextResponse.json({ digest: digest ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch digest" }, { status: 500 });
  }
}
